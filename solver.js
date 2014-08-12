
"use strict";

/* todo move these to util */
var NODE_RADIUS = 5,
    GRAPH_H = 400,
    GRAPH_W = 700,
    MODES = ["node", "truss", "force", "rolling", "fixed"],
    grid = 50,
    mode = "node";

var nodeIDs = 0,
		trussIDs = 0,
		forceIDs = 0;

var snap = false;

var meta = { rolling: null, fixed: null };

d3.select("body")
	.on("keydown", function (d) {
			switch(d3.event.keyCode) {
			case 84:
				mode = "truss";
				break;
			case 78:
				mode = "node";
				break;
			case 70:
				mode = "force";
				break;
			case 82:
				mode = "rolling";
				break;
			case 71:
				mode = "fixed";
				break;
			case 83:
				snap = !snap;
			  break;
			case 67:
			  util.calculate();
			  break;
			case 187:
				if(currScaleFactor > 0.01)
					scale(0.1);
				break;
			case 189:
				if(currScaleFactor < 1000)
					scale(10);
				break;
		}
	}).on("keyup", function () {})

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
var currScaleFactor = 10;

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

var scale = function (factor) {
	// change all the display values if display is on
}

/*------------------------*/

var tempTruss = svg.insert("line", ".node")
			.classed("link tempTruss hidden", true),
		tempForce = svg.insert("line", ".node")
			.classed("link tempForce hidden", true)
			.attr("marker-end", "url(#triangle)");

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

	var grp = svg.insert("g", ".tool")
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
};

var createToolTip = function (d) {
	var tt = svg.append("g")
		.attr("class", "tool")
		.attr("visibility", "hidden")
		.attr("id", "nid" + d.id)
		.datum(d);

	var rect = tt.append("rect")
		.attr({
			class: "toolbox",
			"rx": 5, "ry": 5,
			"x": function (d) {return d.x+10; },
			"y": function (d) {return d.y-12},
			"height": "24px",
			"visibility": "inherit"
		});
	var text = tt.append("text")
		.text(function (d) {return "(" + d.x + ", " + d.y + ")"})
		.attr({
			"class": "tooltext",
			"x": function (d) {return d.x+16;},
			"y": function (d) {return d.y+3.5;},
			"visibility": "inherit"
		});
	rect.attr("width", text.node().getBBox().width+12)
		.attr("visbility", "hidden")
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
		})

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

	if (mode == "truss") createTruss(d, mp);

	// if it's not within tolerance try to get back the old truss!!
	else if (!util.withinTolerance(d, mp)) {
		createForce(d, mp, $(this).parent()[0]);
	}
}; 

var drag = function (d) {
  var x = d3.event.x;
  var y = d3.event.y;

  if(mode == "rolling" || mode == "fixed") return;

  // drag a node
  if(mode == "node") {
  	if(snap) {
  		var s = util.snapToGrid(d3.event);
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
   	nd.x = x;
   	nd.y = y;
  }
 	// drag a truss 
  else if (mode == "truss")
  	tempTruss.attr({"x2": x, "y2": y});

  // drag a force
  else if (mode == "force") {
  	if(snap) {
  		var s = util.snapStraight(d, d3.event);
  		x = s.x;
  		y = s.y;
  	}
  	tempForce.classed("hidden", false).attr({"x2": x, "y2": y});
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

