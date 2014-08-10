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


util.withinTolerance = function (point1, point2) {
  return (Math.abs(point1.x - point2.x) <= util.tolerance &&
	Math.abs(point1.y - point2.y) <= util.tolerance);
};

util.setYRight = function (a) {
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



