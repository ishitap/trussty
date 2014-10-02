var util = (typeof exports === "undefined")?(function util() {}):(exports);
if(typeof global !== "undefined") { global.util = util; }

util.tolerance = 10;

util.snapToGrid = function (point) {
	var np = {x:point.x, y:point.y};
  var xdiff = point.x % grid;
  if (xdiff < util.tolerance)
    np.x = point.x - xdiff;
  else if (xdiff > (grid-util.tolerance))
    np.x = point.x + grid - xdiff;

  var ydiff = point.y % grid;
  if (ydiff < util.tolerance)
    np.y = point.y - ydiff;
  else if (ydiff > (grid-util.tolerance))
    np.y = point.y + grid - ydiff;

  return np;
};

util.snapStraight = function (p1, p2) {
  var pt = {x: p2.x, y: p2.y};
  var slope = (p2.y - p1.y)/(p2.x - p1.x);
  if (slope < 1 && slope > -1)
    pt.y = p1.y;
  else pt.x = p1.x;
  return pt;
}


util.withinTolerance = function (point1, point2) {
  return (Math.abs(point1.x - point2.x) <= util.tolerance &&
	Math.abs(point1.y - point2.y) <= util.tolerance);
};

util.setYRight = function (y) {
  if(y)
    y = GRAPH_H - y;
  return y;
}

util.setAllYRight = function (a) {
	var array = a.slice();
	array.forEach(function (t) {
		if(t.y)
			t.y = GRAPH_H - t.y;
		if(t.fy)
			t.fy = 0 - t.fy;
	});
	return array;
}

util.printString = function () {
	var nodes = d3.selectAll(".node").data()
	var trusses = d3.selectAll(".truss").data()
	var forces = d3.selectAll(".truss").data()
	var meta = meta

	var obj = JSON.stringify({nodes: nodes, trusses: trusses, forces: forces, meta: meta}, null, 2);

	return obj

}

util.nodes = function () {
    return util.setYRight(d3.selectAll(".node").data())
}

util.trusses = function () {
    return util.setYRight(d3.selectAll(".truss").data())
}

util.forces = function () {
    return util.setYRight(d3.selectAll(".force").data())
}

util.meta = function () {
    return meta;
}

util.calculate = function () {
    var nodes = util.nodes();
    var trusses = util.trusses();
    var forces = util.forces();
    var meta = util.meta();
    console.log("Calculating!");

    // call some kind of calc(nodes,trusses,forces,meta) func here!
    // example below

    console.log(nodes);
    
    nodes.forEach( function (node) {
    	console.log("(" + node.x + ", " + node.y + ")");	
    });

    return "done!";
}

util.forceLocation = function (p1, p2) {
  var nx = p1.x + 0.8 * (p2.x - p1.x);
  var ny = p1.y + 0.8 * (p2.y - p1.y);
  return {cx:nx, cy:ny};
}

util.forceTextLocation = function (c) {
  return {x: c.cx-7, y: c.cy+5};
}

util.forceMagnitude = function (p1, p2) {
  var xdiff = (p2.x - p1.x);
  var ydiff = (p2.y - p1.y);
  var len = Math.sqrt(Math.pow(xdiff, 2) + Math.pow(ydiff, 2));
  return Math.floor(len/5);
}
