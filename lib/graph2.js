var mori = require('mori');

// Immutable Graph bases on mori persistent data structures
// http://swannodette.github.io/mori/
// 
// Each mutation of the graph returns a new graph reference

var Graph = function(options, data) {

  // Function tp determine the unique id of the vertex, defaults
  // to the 'id' property. If the id function is supplied, it must
  // generate an error if the id if undefined.
  options = options || {};
  this.idFn = options.idFn || function(v) { 
    if ((v.id === undefined) || (v.id === null)) {
      throw Error('no id can be determined for object');
    }
    return v.id;
  };

  this.options = options;

  data = data || {};
  this.vertices = data.vertices || mori.hash_map();
  this.outgoingVertices = data.outgoingVertices || mori.hash_map();
  this.incomingVertices = data.incomingVertices || mori.hash_map();

};

Graph.prototype.put = function(vertex) {
  var id = this.idFn(vertex);
  var v1 = mori.assoc(this.vertices, id, vertex);
  var g1 = new Graph(this.options, {
    vertices: v1,
    outgoingVertices: this.outgoingVertices,
    incomingVertices: this.incomingVertices,
  });
  return g1;
};

Graph.prototype.get = function(id) {
  return mori.get(this.vertices, id);
};

// Replace a vertex with the same id
Graph.prototype.replace = function(vertex) {
  var id = this.idFn(vertex);
  var inGraph = mori.get(this.vertices, id);
  if (inGraph === null) {
    throw new Error('vertex not in graph');
  }

  var v1 = mori.assoc(this.vertices, id, vertex);
  var g1 = new Graph(this.options, {
    vertices: v1,
    outgoingVertices: this.outgoingVertices,
    incomingVertices: this.incomingVertices,
  });
  return g1; 

};

Graph.prototype.remove = function(vertex) {
  var id = this.idFn(vertex);
  var inGraph = mori.get(this.vertices, id);
  if (inGraph === null) {
    throw new Error('vertex not in graph');
  }

  var v1 = mori.dissoc(this.vertices, id);
  var g1 = new Graph(this.options, {
    vertices: v1,
    outgoingVertices: this.outgoingVertices,
    incomingVertices: this.incomingVertices,
  });
  return g1;
};

module.exports = Graph;
