
"use strict";

/* todo move these to util */
var NODE_RADIUS = 5,
    GRAPH_H = 400,
    GRAPH_W = 700,
    MODES = ["node", "truss", "force", "rolling", "fixed", "calc"],
    grid = 50,
    mode = "node";

var nodeIDs = 0,
		trussIDs = 0,
		forceIDs = 0;

var snap = false;
var visible = false;
var calculated = false;

var meta = { rolling: null, fixed: null };

d3.select("body")
	.on("keydown", function (d) {
			switch(d3.event.keyCode) {
			case 84:
				mode = "truss";
				$("#trussopt").prop("selected", true);
				break;
			case 78:
				mode = "node";
				$("#nodeopt").prop("selected", true);
				break;
			case 70:
				mode = "force";
				$("#forceopt").prop("selected", true);
				break;
			case 82:
				mode = "rolling";
				$("#rollingopt").prop("selected", true);
				break;
			case 71:
				mode = "fixed";
				$("#fixedopt").prop("selected", true);
				break;
			case 83:
				snap = !snap;
			  break;
			case 67:
			  util.calculate();
			  break;
		}
	}).on("keyup", function () {})

	function modechange(val) {
		mode = val;
	}

	function toggleSnap(val) {
		snap = !snap;
	}

// set up svg
var svg = d3.select("#solver").append("svg")
      .attr("width", GRAPH_W)
      .attr("height", GRAPH_H);

svg.append("marker")
	.attr({
		"id": "triangle",
		"viewBox" : "0 0 10 10", "refX": "0", "refY": "5",
		"markerUnits": "strokeWidth",
		"markerWidth": "3",
		"markerHeight": "4",
		"orient": "auto",
		"style": "fill:lightblue"
	}).append("path")
		.attr("d", "M 0 0 L 10 5 L 0 10 z");

/*-------GRIDLINES--------*/

// set up graph
var graph = svg.append("g")
	.attr("width", GRAPH_W)
	.attr("height", GRAPH_H)
	.on("click", function (d) {
		d3.event.preventDefault();
		if (mode != "node") return;
		var p = d3.mouse(this);
		createNode(p);
	});

// set up border
graph.append("rect")
	.attr("class", "background")
  .attr("width", GRAPH_W)
  .attr("height", GRAPH_H);

// set up gridlines
function gridlines(size) {
  var ticks = []
  for(var i = grid; i < size; i += grid)
    ticks.push(i)
  return ticks;
}

graph.selectAll("line.yline")
  .data(gridlines(GRAPH_H)).enter()
  .append("line")
  .attr(
  {
    "class": "gridline",
    "x1" : 0,
    "x2" : GRAPH_W,
    "y1" : function(d){ return d;},
    "y2" : function(d){ return d;}
  });

graph.selectAll("line.xline")
  .data(gridlines(GRAPH_W)).enter()
  .append("line")
  .attr({
    "class": "gridline",
    "x1" : function(d) { return d;},
    "x2" : function(d) { return d;},
    "y1" : 0,
    "y2" : GRAPH_H
  });

/*------------------------*/

var tempTruss = svg.insert("line", ".node")
			.classed("link tempTruss hidden", true);

var tempForce = svg.insert("line", ".node")
			.classed("link tempForce hidden", true)
			.attr("marker-end", "url(#triangle)");


var tempForceText = svg.append("g")
	.attr("visibility", "hidden")
	.classed("forceTextG", true)
	.classed("tempForceText", true);

	tempForceText.append("circle")
		.classed("forceCircle", true)
		.attr("r", "15")
		.attr("visibility", "inherit");

	tempForceText.append("text")
		.classed("forceText", true)
		.attr("visibility", "inherit");

var getNodeByID = function (id) {
	var found = -1;
	var data = d3.selectAll(".node").data();

	data.some(function (nd) {
		if (parseInt(nd.id) == parseInt(id)) {
			found = nd;
			return true;
		}
		return false;
	});
	return found;
}

/* connected () 
 * returns true if node1 and node2 are connected, false otherwise */
var connected = function (node1, node2) {
	var connected = false;
	if(node1.id == node2.id) return true;

	node1.trusses.some(function (t) {
		if (t.dest == node2.id) {
			connected = true;
			return true;
		}
		return false; 
	});
	return connected;
};

var getForce = function (nd) {
	var forces = d3.selectAll(".force")[0];
	var thisForce = null;
	forces.some(function (f) {
		var force = d3.select(f);
		var fd = force.datum();
		if (parseInt(fd.nid) == parseInt(nd.id)) {
			thisForce = force;
			return true;
		}
		return false;
	});
	return thisForce;
}

/* createNode () 
 * Creates a node at @point */
var createNode = function (p) {
	var node = {id: nodeIDs++, x: p[0], y: p[1], trusses: [], fx: 0, fy: 0};

	var grp = svg.insert("g", ".nodegrp")
		.datum(node)
		.attr("class", "nodegrp");

	grp.append("circle")
		.datum(node)
		.attr({
			"class": "node",
			"r": NODE_RADIUS,
			"cx": function(d) {return d.x},
			"cy": function(d) {return d.y}
		})
		.on("click", function (d) {
			if(d3.event.defaultPrevented) return;
			if(d3.event.shiftKey) {
				clearNode(d);
				$(this).parent().remove();
			}
			if(mode == "rolling" || mode == "fixed")
				setJoint(this);
		})
		.call(dragAction);

	addTooltip(grp, node);
};

var addTooltip = function (grp, d) {
	var tt = grp.append("g")
		.attr({
			class: "tool",
			id: "nid" + d.id
		})
		.datum(d);

	if (!visible)
		tt.attr("visibility", "hidden");

	var rect = tt.append("rect")
		.attr({
			class: "toolbox",
			rx: 5, ry: 5,
			x: function (d) {return d.x+5; },
			y: function (d) {return d.y+5; },
			height: "24px",
			visbility: "inherit"
		});

		var text = tt.append("text")
		.text(function (d) {return "(" + d.x + ", " + util.setYRight(d.y) + ")"})
		.attr({
			"class": "tooltext",
			"x": function (d) {return d.x+10;},
			"y": function (d) {return d.y+22;},
			"visibility": "inherit"
		});
	
	rect.attr("width", text.node().getBBox().width+10);
}

var clearNode = function (nd) {
	nd.trusses.forEach(function (td) {
		var otherID = (td.source == nd.id) ? td.dest : td.source;
		var otherNode = getNodeByID(otherID);

		rm(td, otherNode);

		var found = null;

		d3.selectAll(".trussgrp")[0].some(function (truss) {
			var trussData = d3.select(truss).datum();
			if (parseInt(trussData.id) == parseInt(td.id)) {
				found = truss;
				return true;
			}
			return false;
		});
		d3.select(found).remove();
	});
}

/* createTruss ()
 * Creates a truss going from the @source node to a node near
 * the destination point @mp, if possible */
var createTruss = function (source, mp) {
	var nodeData = d3.selectAll(".node").data();
	nodeData.some(function (nd) {

		// is it close to an unconnected node?
		if(util.withinTolerance(nd, mp) && !connected(nd, source)) {
			var td = {id: trussIDs++, source: source.id, dest: nd.id};
			var trussgrp = svg.insert("g", ".nodegrp")
				.attr("class", "trussgrp")
				.datum(td);

			trussgrp.insert("text", ".truss").attr("class", "trusstext")

			var truss = trussgrp.append("line")
				.attr({
					"class": "truss link",
					"x1": source.x, "y1": source.y,
					"x2": nd.x, "y2": nd.y
				})
				.datum(td)
				.on("click", function (d) {
					if(d3.event.shiftKey) {
						clearTruss(d);
						$(this).parent().remove();
					}
				});

			// add truss to nodes' truss lists
			source.trusses.push(td);
			nd.trusses.push(td);
			return true;
		}
		return false;
	});
};

var rm = function (tr, nd) {
	var toRemove = -1;
	nd.trusses.some(function (td, i) {
		if (td.id == tr.id) {
			toRemove = i;
			return true;
		}
		return false;
	});
	var last = nd.trusses[nd.trusses.length-1];
	nd.trusses[toRemove] = last;
	nd.trusses.pop();
};

var clearTruss = function (td) {
	var nd1 = getNodeByID(td.source);
	var nd2 = getNodeByID(td.dest);

	rm(td, nd1);
	rm(td, nd2);
}

var createForce = function (source, mp, parent) {
	var fx = mp.x - source.x;
	var fy = mp.y - source.y;
	var force = d3.select(parent).insert("line", ".node")
		.attr({
			"class": "force link",
			"x1": source.x, "y1": source.y,
			"x2": mp.x, "y2": mp.y,
			"marker-end": "url(#triangle)"
		})
		.datum({nid: source.id, fx: fx, fy: fy})
		.on("click", function (fd) {
			d3.event.preventDefault();
			if(d3.event.shiftKey) {
				clearForce(fd);
				this.remove();
			}
		});
	var ft = $(".tempForceText").clone();
	var forcetool = d3.select(ft.appendTo(parent)[0]);
	forcetool.classed("forceTextG", true)
			.classed("tempForceText", false)
			.attr("visibility", "visible");
	source.fx = fx;
	source.fy = fy;
}

var clearForce = function (fd) {
	var nd = getNodeByID(fd.nid);
	nd.fx = 0;
	nd.fy = 0;
}

var dragend = function (d) {
	if (mode != "truss" && mode != "force")
		return;

	var temp = (mode == "truss") ? tempTruss : tempForce;
	var mp = {x:temp.attr("x2"), y:temp.attr("y2")};
	temp.classed("hidden", true);

	tempForceText.attr("visibility", "hidden");

	if (mode == "truss") createTruss(d, mp);

	// if it's not within tolerance try to get back the old truss!!
	else if (!util.withinTolerance(d, mp)) {
		createForce(d, mp, $(this).parent()[0]);
	}
}; 

var drag = function (d) {
  var x = d3.event.x;
  var y = d3.event.y;

  if(x > GRAPH_W-5)
  	x = GRAPH_W-5;
  else if (x < 5)
  	x = 5;

  if(y > GRAPH_H-5)
  	y = GRAPH_H-5;
  else if (y < 5)
  	y = 5;

  if(mode == "rolling" || mode == "fixed") return;

  // drag a node
  if(mode == "node") {

  var circleLoc = util.forceLocation(d, {x:d.fx + d.x, y:d.fy + d.y});
  var textLoc = util.forceTextLocation(circleLoc);

  	if(snap) {
  		var s = util.snapToGrid({x:x, y:y});
	  	x = s.x;
  		y = s.y;
  	}
   	var node = d3.select(this)
   		.attr({ "cx": x, "cy": y });
   	var nd = node.datum();

   	// drag attached trusses with it
   	var trusses = d3.selectAll(".truss");
   	trusses.each(function (td, i) {
   		var truss = d3.select(this);
   		if(td.source == nd.id)
   			truss.attr({ "x1": x, "y1": y });
   		else if(td.dest == nd.id)
   			truss.attr({ "x2": x, "y2": y });
   	});

   	// drag attached force with it
   	var force = d3.select($(this).parent().children(".force")[0])
   	if (force != null)
	   	force.attr({
	   		"x1": x, "y1": y,
  	 		"x2": x+d.fx, "y2": y+d.fy
   		});

	   // drag force toolip too
	  var parent = $(this).parent()[0];
	  d3.select(parent).select(".forceCircle")
	  	.attr(circleLoc);

	  d3.select(parent).select(".forceText")
	  		.attr(textLoc);

   	nd.x = x;
   	nd.y = y;

   	// drag tooltip with it
   	var tooltip = $(this).parent().children(".tool"),
   			toolbox = d3.select(tooltip.children(".toolbox")[0]),
   			tooltext = d3.select(tooltip.children(".tooltext")[0]);
   	if(tooltext != null)
   		tooltext.attr({
   			x:x+10, y:y+22
   		})
   		.text(function (d) {return "(" + x + ", " + util.setYRight(y) + ")"})
   	if (toolbox != null)
   		toolbox.attr({
   			x: x+5, y: y+5,
   			width: tooltext.node().getBBox().width+10
   		});
  }
 	// drag a truss 
  else if (mode == "truss")
  	tempTruss.attr({"x2": x, "y2": y});

  // drag a force
  else if (mode == "force") {
  	if(snap) {
  		var s = util.snapStraight(d, {x:x, y:y});
  		x = s.x;
  		y = s.y;
  	}
  	tempForce.classed("hidden", false).attr({"x2": x, "y2": y});


  var circleLoc = util.forceLocation(d, {x:x, y:y});
  var textLoc = util.forceTextLocation(circleLoc);

  	tempForceText.attr("visibility", "visible")
  		.select(".forceCircle")
	  		.attr(circleLoc);

	  tempForceText.select(".forceText")
	  	.attr(textLoc)
	  	.text(util.forceMagnitude(d, {x:x, y:y}));
  }
};

/* drag 
 * defines drag behavior on nodes, truesses, and forces */
var dragAction = d3.behavior.drag()
	.on("dragstart", function (d) {
		d3.event.sourceEvent.stopPropagation();
		d3.event.sourceEvent.preventDefault();

		if (mode == "node" || mode == "rolling" || mode == "fixed") return;

		if (mode == "force" && d.fx != 0 || d.fy != 0) {
			var force = getForce(d);
			clearForce(force.datum());
			force.remove();

			console.log("hi")
			d3.select($(this).parent()[0]).select(".forceTextG").remove();
		}


		var temp = (mode == "truss") ? tempTruss.classed("hidden", false) : tempForce;
		temp.attr({
					"x1": d.x, "y1": d.y,
      		"x2": d.x, "y2": d.y
			});
	})
	.on("drag", drag)
	.on("dragend", dragend);

var setJoint = function (node) {
	if (mode == "rolling") {
		d3.select(meta.rolling).classed("rolling fixed", false);
		d3.select(node).classed("rolling", true);
		if (meta.fixed == node) {
			d3.select(node).classed("fixed", false);
			meta.fixed = null;
		}
		meta.rolling = node;
	}
	else if (mode == "fixed") {
		d3.select(meta.fixed).classed("fixed rolling", false);
		d3.select(node).classed("fixed", true);
		if (meta.rolling == node) {
			d3.select(node).classed("rolling", false);
			meta.rolling = null;
		}
		meta.fixed = node;
	}
};


var calculate = function () {
	mode = "calc";
	var tensions = [];
	var trusses = d3.selectAll(".truss");

	trusses.each(function (td) {
		var n = Math.random() - 0.5;
		tensions.push({id: td.id, tension:n});
	});
	addTensions(tensions);

	var worker = new Worker('trussSolverBackEnd.js');

	worker.addEventListener('message', function(e) {
		console.log(e.data);
  	addTensions(e.data.trusses);
	}, false);

	var ev = {};
	ev.message = "calculate";
	ev.nodes = d3.selectAll(".node").data();
	ev.trusses = d3.selectAll(".truss").data();
	ev.meta = { fixed: d3.select(meta.fixed).datum().id,
							rolling: d3.select(meta.rolling).datum().id }

	worker.postMessage(ev); // Send data to our worker.
}

var uncalculate = function() {
	var trusses = d3.selectAll(".truss")
		.classed("tension compression", false)
}

var toggleXY = function () {
	if (visible)
		d3.selectAll(".tool")
			.attr("visibility", "hidden");
	else
		d3.selectAll(".tool")
			.attr("visibility", "visible");

	visible = !visible;
}

var setTension = function (trussgrp, tensionobj) {
	var tension = tensionobj.tension;
	var truss = d3.select(trussgrp).select(".truss");
	var x1 = parseInt(truss.attr("x1"));
	var x2 = parseInt(truss.attr("x2"));
	var y1 = parseInt(truss.attr("y1"));
	var y2 = parseInt(truss.attr("y2"));
	var x = ((x1 + x2)/2);
	var y = ((y1 + y2)/2);

	d3.select(trussgrp).select(".trusstext")
		.text(tension.toFixed(2))
		.attr({
			x: x,
			y: y
		});
	console.log(d3.select(trussgrp).select(".trusstext"))

	if (tension < 0) {
		truss.classed("tension", false)
			.classed("compression", true);
	}
	else if(tension > 0) {
		truss.classed("compression", false)
			.classed("tension", true);
	}
}

var addTensions = function (tensions) {
	var trussgrps = d3.selectAll(".trussgrp");
	trussgrps.each(function (td) {
		var tens = tensions.some(function (e, i, a) {
			if (e.id == td.id) {
				setTension(this, e);
				return true;
			}
			return false;
		}, this);
	});
}

var errors = ["Oops, your structure isn't statistically determinant. Learn more",
							"Oops, you need to have 2 joints, and at least one needs to be a fixed joint. Learn more",
							"Looks like you're missing some forces. Learn more"]
