
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
		}
	}).on("keyup", function () {})

// set up svg
var svg = d3.select("body").append("svg")
      .attr("width", GRAPH_W)
      .attr("height", GRAPH_H);

svg.append("marker")
	.attr({
		"id": "triangle",
		"viewBox" : "0 0 10 10", "refX": "0", "refY": "5",
		"markerUnits": "strokeWidth",
		"markerWidth": "4",
		"markerHeight": "3",
		"orient": "auto",
		"style": "fill:lightblue"
	}).append("path")
		.attr("d", "M 0 0 L 10 5 L 0 10 z");

// set up graph
var graph = svg.append("g")
	.attr("width", GRAPH_W)
	.attr("height", GRAPH_H)
	.on("click", function (d) {
		if (d3.event.defaultPrevented) {
			console.log("yay");
			return;
		}
		d3.event.preventDefault();
		if (mode != "node") return;
		var p = d3.mouse(this);
		createNode(p);
	});

// set up border
graph.append("rect")
  .attr("width", GRAPH_W)
  .attr("height", GRAPH_H)
  .style("stroke", "#999999")
  .style("fill", "#F6F6F6");

/*-------GRIDLINES--------*/

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

var tempTruss = graph.insert("line", ".node")
			.classed("link tempTruss hidden", true),
		tempForce = graph.insert("line", ".node")
			.classed("link tempForce hidden", true)
			.attr("marker-end", "url(#triangle)")

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

	svg.append("circle")
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
				this.remove();
			}
			if(mode == "rolling" || mode == "fixed")
				setJoint(this);
		})
		.call(dragAction);
};

var clearNode = function (nd) {
	nd.trusses.forEach(function (td) {
		var otherID = (td.source == nd.id) ? td.dest : td.source;
		console.log(otherID)
		var otherNode = getNodeByID(otherID);
		console.log(otherNode)
		rm(td, otherNode);

		var found = null;

		d3.selectAll(".truss")[0].some(function (truss) {
			var trussData = d3.select(truss).datum();
			console.log(trussData)
			if (parseInt(trussData.id) == parseInt(td.id)) {
				found = truss;
				return true;
			}
			return false;
		});
		console.log(found);
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
			var truss = svg.insert("line", ".node")
				.attr({
					"class": "truss link",
					"x1": source.x, "y1": source.y,
					"x2": nd.x, "y2": nd.y
				})
				.datum(td)
				.on("click", function (d) {
					if(d3.event.shiftKey) {
						console.log("yay")
						clearTruss(d);
						this.remove();
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

var createForce = function (source, mp) {
	var fx = mp.x - source.x;
	var fy = mp.y - source.y;

	var force = svg.insert("line", ".node")
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
	else createForce(d, mp);
}; 

var drag = function (d) {
  var x = d3.event.x;
  var y = d3.event.y;

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
   	nd.x = x;
   	nd.y = y;

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
   	var force = getForce(nd);
   	if (force != null)
	   	force.attr({
	   		"x1": x, "y1": y,
  	 		"x2": x+d.fx, "y2": y+d.fy
   		});
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
  	tempForce.attr({"x2": x, "y2": y});
  }
};

/* drag 
 * defines drag behavior on nodes, truesses, and forces */
var dragAction = d3.behavior.drag()
	.on("dragstart", function (d) {
		d3.event.sourceEvent.preventDefault();
		d3.event.sourceEvent.stopPropagation();

		if (mode == "node") return;

		if (mode == "force" && d.fx != 0 || d.fy != 0) {
			var force = getForce(d);
			clearForce(force.datum());
			force.remove();
		}


		var temp = (mode == "truss") ? tempTruss : tempForce;
		temp.classed("hidden", false)
			.attr({
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

