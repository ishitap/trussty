importScripts("numeric-1.2.6.js");

// Truss Solver Back End

// ------------------------- Data Entry ------------------------------ //
/*
nodes = [ {id: 0, x: 100, y: 251, 
			trusses: [ {id: 0, source: 0, dest: 4},
					   {id: 5, source: 1, dest: 0} ] },
		  {id: 1, x: 250, y: 251, fx: 0, fy: 100, 
		  	trusses: [ {id: 1, source: 4, dest: 1}, 
		  			   {id: 2, source: 1, dest: 3}, 
		  			   {id: 4, source: 2, dest: 1}, 
		  			   {id: 5, source: 1, dest: 0} ] },
		  {id: 2, x: 401, y: 251, 
		  	trusses: [ {id: 3, source: 2, dest: 1},
		  			   {id: 4, source: 3, dest: 2} ] }, 
		  {id: 3, x: 301, y: 127, 
		  	trusses: [ {id: 2, source: 1, dest: 3},
		  			   {id: 3, source: 3, dest: 2}, 
		  			   {id: 6, source: 4, dest: 3} ] },
		  {id: 4, x: 157, y: 131, 
		  	trusses: [ {id: 0, source: 0, dest: 4}, 
		  			   {id: 1, source: 4, dest: 1}, 
		  			   {id: 6, source: 4, dest: 3} ] } ]
trusses = [ {id: 0, source: 0, dest: 4},
			{id: 1, source: 4, dest: 1},
			{id: 2, source: 1, dest: 3},
			{id: 3, source: 3, dest: 2},
			{id: 4, source: 2, dest: 1},
			{id: 5, source: 1, dest: 0},
			{id: 6, source: 4, dest: 3} ]
meta = {fixed: 0, rolling: 2}
*/
/*
nodes = [ {id: 0, x: 11, y: 11, fx: -1000, fy: 0,
			trusses: [ {id: 0, source: 1, dest: 0},
					   {id: 4, source: 3, dest: 0} ] },
		  {id: 1, x: 1, y: 11, 
		  	trusses: [ {id: 0, source: 1, dest: 0}, 
		  			   {id: 1, source: 2, dest: 1}, 
		  			   {id: 2, source: 1, dest: 3} ] },
		  {id: 2, x: 1, y: 1, 
		  	trusses: [ {id: 3, source: 2, dest: 3},
		  			   {id: 1, source: 2, dest: 1} ] }, 
		  {id: 3, x: 11, y: 1, 
		  	trusses: [ {id: 3, source: 2, dest: 3}, 
		  			   {id: 2, source: 1, dest: 3}, 
		  			   {id: 4, source: 3, dest: 0} ] } ]


trusses = [ {id: 0, source: 1, dest: 0},
			{id: 1, source: 2, dest: 1},
			{id: 2, source: 1, dest: 3},
			{id: 3, source: 2, dest: 3},
			{id: 4, source: 3, dest: 0} ]

meta = {fixed: 3, rolling: 2}
*/

// Triangle Truss
/*
nodes = [ {id: 0, x: 0, y: 0, 
			trusses: [ {id: 0, source: 0, dest: 2},
					   {id: 2, source: 1, dest: 0} ] },
		  {id: 1, x: 10, y: 0, 
		  	trusses: [ {id: 1, source: 2, dest: 1}, 
		  			   {id: 2, source: 1, dest: 0} ] }, 
		  {id: 2, x: 0, y: 1, fx: 500, fy: 0,
		  	trusses: [ {id: 0, source: 0, dest: 2}, 
		  			   {id: 1, source: 2, dest: 1} ] } ]


trusses = [ {id: 0, source: 0, dest: 2},
			{id: 1, source: 2, dest: 1},
			{id: 2, source: 1, dest: 0} ]

meta = {fixed: 0, rolling: 1}
*/

// MIT example Truss, variable height
/*
var hp = 1
nodes = [ {id: 0, x: 0, y: 0*hp,
			trusses: [ {id: 0, source: 0, dest: 6},
					   {id: 1, source: 0, dest: 1} ] },
		  {id: 1, x: 2, y: 0,
		  	trusses: [ {id: 1, source: 0, dest: 1}, 
		  			   {id: 2, source: 1, dest: 2}, 
		  			   {id: 7, source: 1, dest: 6} ] },
		  {id: 2, x: 4, y: 0, fx: 0, fy: -120, 
		  	trusses: [ {id: 2, source: 1, dest: 2}, 
		  			   {id: 3, source: 2, dest: 3},
		  			   {id: 6, source: 6, dest: 2},
		  			   {id: 5, source: 2, dest: 4} ] },
		  {id: 3, x: 6, y: 0,
		  	trusses: [ {id: 3, source: 2, dest: 3},
		  			   {id: 4, source: 3, dest: 4} ] }, 
		  {id: 4, x: 4, y: 3*hp,
		  	trusses: [ {id: 4, source: 3, dest: 4}, 
		  			   {id: 5, source: 2, dest: 4},
		  			   {id: 10, source: 6, dest: 4}, 
		  			   {id: 9, source: 5, dest: 4} ] },
		  {id: 5, x: 3, y: 4*hp,  
		  	trusses: [ {id: 8, source: 6, dest: 5}, 
		  			   {id: 9, source: 5, dest: 4} ] },
		  {id: 6, x: 2, y: 3*hp, fx: 0, fy: -100,
		  	trusses: [ {id: 0, source: 0, dest: 6}, 
		  			   {id: 6, source: 6, dest: 2},
		  			   {id: 8, source: 6, dest: 5},
		  			   {id: 10, source: 6, dest: 4}, 
		  			   {id: 7, source: 1, dest: 6} ] } ]


trusses = [ {id: 0, source: 0, dest: 6},
			{id: 1, source: 0, dest: 1},
			{id: 2, source: 1, dest: 2},
			{id: 3, source: 2, dest: 3},
			{id: 4, source: 3, dest: 4},
			{id: 5, source: 2, dest: 4},
			{id: 6, source: 6, dest: 2},
			{id: 7, source: 1, dest: 6},
			{id: 8, source: 6, dest: 5},
			{id: 9, source: 5, dest: 4},
			{id: 10, source: 6, dest: 4} ]

meta = {fixed: 3, rolling: 0} 
*/



self.addEventListener("message", function (e) {

	var data = e.data;
	if(data.message != "calculate")
		return;

	trusses = [ {id: 0, source: 0, dest: 2},
			{id: 1, source: 2, dest: 1},
			{id: 2, source: 1, dest: 0} ]

	nodes = [ {id: 0, x: 0, y: 0, 
			trusses: [ trusses[0], trusses[2] ] },
		  {id: 1, x: 1, y: 0, 
		  	trusses: [ trusses[1], 
		  			   trusses[2] ] }, 
		  {id: 2, x: 0, y: 1, fx: 50, fy: 0,
		  	trusses: [ trusses[0], 
		  			   trusses[1] ] } ]


meta = {fixed: 0, rolling: 1}

	var nodes = e.data.nodes;
	var trusses = e.data.trusses;
	var meta = e.data.meta;


trusses.forEach(function (e, i, a) {
	e.trussNum = i;
});

// --------------------- Statically Determinant Test ------------------ //
numElements = trusses.length
numNodes = nodes.length

// Check for rolling and fixed node
if (typeof meta.fixed == 'undefined') {
	console.log("Need a fixed node.")
} else if (typeof meta.rolling == 'undefined'){
	console.log("Need a rolling node.")
} else {
	numFixed = 2
	numReacts = 3
}

// Error message
if (2*numNodes != numElements + numReacts) {
	console.log("System is not statically determinant.")
}

// ---------------------- Matrix Assembly ------------------------ //

// Numbering system for force (x) vector:
//
//    [F1,..., Fn, Rfx, Rfy, Rry]
//
// Last 3 components of vector reaction forces
// for fixed and rolling nodes. 

// indices of reaction forces in x vector, determined by above
RryInd = 2*nodes.length - 1 
RfxInd = 2*nodes.length - 3 
RfyInd = 2*nodes.length - 2

// initialization of matrix A, with the intent of solving Ax = b
var A = zeros([2*numNodes, 2*numNodes])

// initialization of vector b, in Ax = b
var b = [];
for (var i = 0; i < 2*numNodes; i++) b[i] = 0;

// for each node (2 rows of matrix filled)
for (i = 0; i < numNodes; i++) {
	connTrusses = nodes[i].trusses
	xRowNum = 2*i
	yRowNum = 2*i + 1

	// for each connecting truss
	for (j = 0; j < connTrusses.length; j++) {
		trussNum = nodes[i].trusses[j].trussNum
		sourceNodeIndex = i
		destNodeID = getDestTrussNodeID(i, j)
		destNodeIndex = getIndexByID(destNodeID)
		
		// break forces into components by direction
		sX = nodes[i].x
		sY = nodes[i].y
		dX = nodes[destNodeIndex].x
		dY = nodes[destNodeIndex].y
		len = Edistance(sX, sY, dX, dY)	

		Fx = (dX - sX)/len
		Fy = (dY - sY)/len

		// add values to correct column numbers of A for our row
		A[xRowNum][trussNum] = A[xRowNum][trussNum] + Fx 
		A[yRowNum][trussNum] = A[yRowNum][trussNum] + Fy
	} 

	// add matrix values for reaction forces
	// if fixed node
	if (meta.fixed == nodes[i].id) {
		A[xRowNum][RfxInd] = A[xRowNum][RfxInd] + 1
		A[yRowNum][RfyInd] = A[yRowNum][RfyInd] + 1
	}

	// if rolling node
	if (meta.rolling == nodes[i].id) {
		A[yRowNum][RryInd] = A[yRowNum][RryInd] + 1
	}

	// add values to b vector for external forces
	// if there is an external force in the x, y directions
	if (typeof nodes[i].fx != 'undefined') {
		b[xRowNum] = -1*nodes[i].fx
	}

	if (typeof nodes[i].fy != 'undefined') {
		b[yRowNum] = -1*nodes[i].fy
	}
}

// Note for Matrices
// A[i][j] i is row, j is column

printMatrix(A)

// ----------------------- Solve the System ------------------------//

//console.log(A)

Ainv = numeric.inv(A)
var x = numeric.dot(Ainv, b)

// var xJSON = [];

// x.forEach (function (e, i, a) {
// 	xJSON.push({id: trusses[i].id, tension:e})
// });

//self.postMessage(xJSON)

//Results
// negative: member in compression
// positive: member in tension     

console.log("printing final values")
//printMatrix(A)
console.log(b)
console.log(x)

x.forEach(function(e, i, a) {
	if (i < trusses.length)
		trusses[i].tension = e;
});

var backData = {message: "calculated", trusses: trusses}

self.postMessage(backData);

// ----------------------- Helper Functions ------------------------//

function getIndexByID(nodeID) {
	index = -1;
	nodes.some(function (e, i, a) {
		if(e.id == nodeID) {
			index = i;
			return true;
		}
		return false;
	})
	return index;
}

// Replicates the Matlab 'Zeros' function for declaring a matrix
function zeros(dimensions) {
    var array = [];
    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 
        	? 0 : zeros(dimensions.slice(1)));
    }
    return array
}

// Takes three values in, a, b, and a. Finds the non-matching value b.
// Prints error exception if all three are the same. 
function sortOther(a, b, c) {
	if (a != c) return a
	if (b != c) return b
	console.log('a = b = c problem')
}

// For any nodeID in the A assembly forloop, returns the nodeID of the
// destination node connected by the truss in question.
function getDestTrussNodeID(nodeIndex, trussIndex) {
	nodeID = nodes[nodeIndex].id;
	source = nodes[nodeIndex].trusses[trussIndex].source
	dest = nodes[nodeIndex].trusses[trussIndex].dest
	actualDestination = sortOther(source, dest, nodeID)
	return actualDestination
}

// Coordinate Distance 
function Edistance(x1, y1, x2, y2) {
	dx = x2 - x1
	dy = y2 - y1
	dist = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2))
	return dist
}

// For debugging, prints a matrix like a matrix to console
function printMatrix(A) {
	for (i = 0; i < A.length; i++) {
		console.log(A[i])
	}
}

}); // end worker onmessage

