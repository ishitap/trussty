
/*-----CONSTANTS------*/
var NODE_RADIUS = 5,
    GRAPH_H = 400,
    GRAPH_W = 700, 
    BUTTON_H = 20,
    BUTTON_W = 50,
    TOLERANCE = 10,
    MODES = ["node", "truss", "remove"],
    COLORS = ["yellow", "green", "blue", "red"],
    grid = 50;
/*---------------------*/

var current_line = null;
var last_id = 0;
var mode = MODES[0];

function click_create(){
  if (d3.event.defaultPrevented) return;

  if(mode != "node") return;

  // get point location
  var p = d3.mouse(this),
      node = {id: last_id++, x: p[0], y: p[1]};

  // add the node
  svg.append("circle")
      .datum(node)
      .attr("class", "node")
      .attr("r", NODE_RADIUS)
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .on("click", click_remove)
      .call(drag)
      .on("mouseover", function() {
        if(mode == "remove")
          d3.select(this).classed("hovering", true);
      }).on("mouseout", function() {
        d3.select(this).classed("hovering", false);
      })
}


/*-------SET-UP--------*/
 //Create the SVG
var svg = d3.select("body").append("svg")
  .attr("width", GRAPH_W)
  .attr("height", GRAPH_H)

var graph = svg.append("g")
  .on("click", click_create);

graph.append("rect")
  .attr("width", GRAPH_W)
  .attr("height", GRAPH_H)
  .style("stroke", "#999999")
  .style("fill", "#F6F6F6");

svg.selectAll(".button")
  .data(MODES)
  .enter().append("rect")
  .attr("width", BUTTON_W)
  .attr("height", BUTTON_H)
  .text(function(d) { return d; })
  .style("fill", function(d,i) { return COLORS[i]; })
  .attr("y", function(d, i) { return i*BUTTON_H; })
  .on("click", function(d) {
    mode = d;
  });

/*-------GRIDLINES--------*/

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
  .attr(
  {
    "class": "gridline",
    "x1" : function(d) { return d;},
    "x2" : function(d) { return d;},
    "y1" : 0,
    "y2" : GRAPH_H
  });


function click_remove(d) {
  if (d3.event.defaultPrevented) return;

  if(mode != "remove") return;

  // find all connected trusses
  d3.selectAll(".truss")
    .each(function (linkData) {
      if (linkData.source == d.id)
        d3.select(this).remove();
      else if (linkData.destination == d.id)
        d3.select(this).remove();
    });
  d3.select(this).remove();
}

/* returns true if point1 and point1 are within tolerance
  radius of one another, false otherwise */
function tolerance(point1, point2) {
  return (Math.abs(point1.x - point2.x) <= TOLERANCE &&
          Math.abs(point1.y - point2.y) <= TOLERANCE);
}

/* returns true if node1 and node 2 are connected with a link,
  false otherwise */
function connected(node1, node2) {
  var connected = false;

  if(node1.id == node2.id) return true;

  (d3.selectAll(".truss"))[0].some(function(t) {
    var link = d3.select(t).datum();
    if(link.source == node1.id || link.destination == node1.id)
      if(link.source == node2.id || link.destination == node2.id) {
        connected = true;
        return true;
      }
    return false;
  });
  return connected;
}

/* Define drag behavior for lines & nodes
  SEE dragend() and drag() */
var drag = d3.behavior.drag()
    .on("dragstart", function(d) {
      d3.event.sourceEvent.stopPropagation();
      d3.event.sourceEvent.preventDefault();

      // start a new line
      if (mode == "truss")
        current_line = svg.insert("line", ".node")
          .attr({
            "class": "temp",
            "x1": d.x, "y1": d.y,
            "x2": d.x, "y2": d.y,
          });
    })
    .on("drag", drag)
    .on("dragend", dragend);

function dragend (d) {
  if(mode != "truss") return;

  var mp = {x:current_line.attr("x2"), y:current_line.attr("y2")},
    set = false;

  (d3.selectAll(".node"))[0]
    .some(function(t) {
      var node = d3.select(t).datum();

      // is it close to an unconnected node?
      if(tolerance(node, mp) && !connected(node, d)) {

        // align truss with center of node & update stuff
        current_line.attr({ "x2": node.x, "y2": node.y })
          .classed({"temp": false, "truss": true})
          .datum({source:d.id, destination:node.id});
        set = true;
        return true;
      }
      return false;
    });

  if(!set) current_line.remove();
}

function snap_to_grid(point) {
  var np = {x:point.x, y:point.y};
  var xdiff = point.x % grid;
  if (xdiff < TOLERANCE)
    np.x = point.x - xdiff;
  else if (xdiff > (grid-TOLERANCE))
    np.x = point.x + grid - xdiff;

  var ydiff = point.y % grid;
  if (ydiff < TOLERANCE)
    np.y = point.y - ydiff;
  else if (ydiff > (grid-TOLERANCE))
    np.y = point.y + grid - ydiff;

  return np;

  /*return {
    x: Math.round(point.x/grid) * grid,
    y: Math.round(point.y/grid) * grid
  };*/
}

function drag (d) {
  var point = snap_to_grid(d3.event);
  var x = d3.event.x;
  var y = d3.event.y;

  // drag a node
  if(mode == "node") {
    x = point.x;
    y = point.y;
    d3.select(this).attr({ "cx": x, "cy": y })
      .datum({id: d.id, x:x, y:y});
    
    // drag the attached trusses with it
    d3.selectAll(".truss")
      .each(function (linkData, i) {
        if (linkData.source == d.id)
          d3.select(this).attr({ "x1": x, "y1": y });
        else if (linkData.destination == d.id) {
          d3.select(this).attr({ "x2": x, "y2": y });
        }
      });
  } 
  // drag a line
  else if (mode == "truss")
    current_line.attr({ "x2": x, "y2": y });
}