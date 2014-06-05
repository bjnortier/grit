var chai = require('chai');
var assert = chai.assert;
var _ = require('underscore');

var Graph = require('../../');

describe('graph', function() {

  var graph;
  var simpleHashFn = function(obj) {
    return '_' + obj.id;
  };

  beforeEach(function() {
    graph = new Graph();
  });

  it('can store, fetch, replace and remove objects', function() {
    graph = new Graph({idKey: '_id'});

    // Store
    assert.throws(function() {
      graph.put({});
    }, Error, "object has no '_id' property");

    // Fetch
    var a = {_id: 'a'};
    graph.put(a);
    assert.deepEqual(graph.get('a'), a);

    // Replace
    assert.throws(function() {
      graph.replace({_id: 'b'});
    }, Error, "no object 'b' in graph");
    var a2 = {_id: 'a', newprop: 'foo'};
    graph.replace(a2);
    assert.deepEqual(graph.get('a'), a2);

    // Remove
    assert.throws(function() {
      graph.remove({_id: 'b'});
    }, Error, "no object 'b' in graph");
    graph.remove(a);

    assert.isUndefined(graph.get('a'));

  });

  it('will reject inserting an object already in the graph', function() {
    var a = {id: 'a'};
    graph.put(a);

    assert.throws(function() {
      graph.put(a);
    }, Error, "object with id 'a' already in graph");
  });

  it('has edges', function() {
    var a = {id: 'a'}, b = {id: 'b'}, c = {id: 'c'};
    graph.put(a);
    graph.put(b);
    graph.put(c);

    assert.throws(function() {
      graph.createEdge(a, {});
    }, Error, "no object 'undefined' in graph");
    assert.throws(function() {
      graph.createEdge({}, a);
    }, Error, "no object 'undefined' in graph");
    
    graph.createEdge(a,b);
    graph.createEdge(c,b);
    assert.deepEqual(graph.getOutgoing(a), [b]);
    assert.deepEqual(graph.getOutgoing(b), []);
    assert.deepEqual(graph.getOutgoing(c), [b]);
    assert.deepEqual(graph.getIncoming(a), []);
    assert.deepEqual(graph.getIncoming(b), [a, c]);
    assert.deepEqual(graph.getIncoming(c), []);

    graph.remove(a);
    assert.isUndefined(graph.get(a));
    assert.deepEqual(graph.getOutgoing(b), []);
    assert.deepEqual(graph.getOutgoing(c), [b]);
    assert.deepEqual(graph.getIncoming(b), [c]);
    assert.deepEqual(graph.getIncoming(c), []);

    graph.removeEdge(c,b);
    assert.deepEqual(graph.getOutgoing(b), []);
    assert.deepEqual(graph.getOutgoing(c), []);
    assert.deepEqual(graph.getIncoming(b), []);
    assert.deepEqual(graph.getIncoming(c), []);

  });

  it('can be serialized', function() {
    var graph = new Graph({
      serializableFn: function(obj) {
        return obj.val !== 'dont_serialize';
      },
    });
    var a = {id: 'a', val: 'a'};
    var b1 = {id: 'b', val: 'b1'};
    var b2 = {id: 'b', val: 'b2'};
    var c1 = {id: 'c', val: 'c'};
    var c2 = {id: 'c', val: 'dont_serialize'};
    graph.put(a);
    graph.put(b1);
    graph.createEdge(a,b1);
    graph.replace(b2);
    graph.put(c1);
    graph.replace(c2);
    graph.setMetadata('meta');

    var serialized = graph.serialize();
    assert.deepEqual(serialized, {
      vertices: {
        a: a,
        b: b2,
      },
      edges: {
        a: ['b'],
      },
      metadata: 'meta'
    });
  });

  it('can be hash-serialized', function() {
    var graph = new Graph({
      hashFn: function(obj) {
        return '_' + obj.val;
      },
      serializableFn: function(obj) {
        return obj.val !== 'dont_serialize';
      },
    });
    var a = {id: 'a', val: 'a'};
    var b1 = {id: 'b', val: 'b1'};
    var b2 = {id: 'b', val: 'b2'};
    var c1 = {id: 'c', val: 'c'};
    var c2 = {id: 'c', val: 'dont_serialize'};
    graph.put(a);
    graph.put(b1);
    graph.createEdge(a,b1);
    graph.replace(b2);
    graph.put(c1);
    graph.replace(c2);
    graph.setMetadata({foo:'bar'});

    var hashSerialized = graph.hashSerialize();
    assert.deepEqual(hashSerialized, {
      vertices: ['_a', '_b2'],
      edges: {
        _a: ['_b2'],
      },
      metadata: {foo: 'bar'}
    });
  });

  it('can be restored from a hash-serialization', function() {
    
    var hashedGraph = {
      vertices: ['_a', '_b'],
      edges: {'_a': ['_b']},
      metadata: {foo: 'bar'}
    };
    var hashesToVertices = {
      '_a' : {id: 'a'},
      '_b' : {id: 'b'}
    };
    
    graph.fromHashSerialization(hashedGraph, hashesToVertices);

    assert.deepEqual(graph.serialize(), {
      vertices: {
        a: {id: 'a'},
        b: {id: 'b'}
      },
      edges: {
        a: ['b'],
      },
      metadata: {foo: 'bar'}
    });

  });

  it('generates vertex hashing events', function() {
    var graph = new Graph({hashFn: simpleHashFn});
    var events = [];

    graph.on('vertexHashed', function(hash, vertex) {
      var event = {};
      event[hash] = vertex;
      events.push(event);
    });

    var a = {id: 'a'}, b = {id: 'b'};
    graph.put(a); 
    graph.put(b);
    graph.createEdge(a,b);
    graph.remove(a);

    assert.deepEqual(events, [
      { _a: a },
      { _b: b },
    ]);

  });

  it('can be cloned', function() {
    var a = {id: 'a'}, b = {id: 'b'}, c = {id: 'c'};
    var graph1 = new Graph();
    graph1.put(a); 
    graph1.put(b);
    graph1.createEdge(a,b);

    var graph2 = graph1.clone();
    graph1.put(c);
    graph1.createEdge(a,c);

    assert.deepEqual(graph1.serialize(), {
      vertices: {
        a: {id: 'a'},
        b: {id: 'b'},
        c: {id: 'c'},
      },
      edges: {
        a: ['b', 'c'],
      }
    });

    assert.deepEqual(graph2.serialize(), {
      vertices: {
        a: {id: 'a'},
        b: {id: 'b'},
      },
      edges: {
        a: ['b'],
      }
    });

  });

  var EventLog = function() {
    var that = this;
    this.events = [];
    this.listener = function(event) {
      that.events.push(event);
    };
  };

  it('can generate add/remove diff events', function() {
    var graph1 = new Graph(), graph2 = new Graph();
    var a = {id: 'a'}, b = {id: 'b'};
    graph1.put(a); 
    graph2.put(b); 

    var logger12 = new EventLog();
    var logger21 = new EventLog();
    graph2.diffFrom(graph1, logger12.listener);
    graph1.diffFrom(graph2, logger21.listener);
    assert.deepEqual(logger12.events, [
      {vertexRemoved: a},
      {vertexAdded: b},
    ]);
    assert.deepEqual(logger21.events, [
      {vertexRemoved: b},
      {vertexAdded: a}
    ]);
  });

  it('can generate replacement diff events', function() {
    var graph1 = new Graph(), graph2 = new Graph();
    var a1 = {id: 'a', val: 'a1'};
    var a2 = {id: 'a', val: 'a2'};
    graph1.put(a1); 
    graph2 = graph1.clone();
    graph2.replace(a2);

    var logger12 = new EventLog();
    var logger21 = new EventLog();
    graph2.diffFrom(graph1, logger12.listener);
    graph1.diffFrom(graph2, logger21.listener);

    assert.deepEqual(logger12.events, [
      {vertexReplaced: {from: a1, to: a2}}
    ]);
    assert.deepEqual(logger21.events, [
      {vertexReplaced: {from: a2, to: a1}}
    ]);
  });

  it('can generate metadata diff events', function() {
    var graph1 = new Graph(), graph2 = new Graph();
    graph1.setMetadata('a'); 
    graph2.setMetadata('b'); 

    var logger12 = new EventLog();
    var logger21 = new EventLog();
    graph2.diffFrom(graph1, logger12.listener);
    graph1.diffFrom(graph2, logger21.listener);
    assert.deepEqual(logger12.events, [
      {metadataChanged: {from: 'a', to: 'b'}},
    ]);
    assert.deepEqual(logger21.events, [
      {metadataChanged: {from: 'b', to: 'a'}},
    ]);
  });

  it('can search for vertices by property', function() {

    var a = {id: 'a', name: 'theA'};
    graph.put(a);
    assert.deepEqual(graph.getByProperty('name', 'theA'), a);

  });

  it('has leaf-first search', function() {

    var a = {id: 'a'}, b = {id: 'b'}, c = {id: 'c'};
    var x = {id: 'x'}, y = {id: 'y'}, z = {id:'z'};
    graph.put(a);
    graph.put(b);
    graph.put(c);
    graph.put(x);
    graph.put(y);
    graph.put(z);
    graph.createEdge(a,b);
    graph.createEdge(b,c);
    graph.createEdge(x,y);

    var sequence = [];
    graph.leafFirstSearch(function(vertex) {
      sequence.push(vertex.id);
    });
    assert.deepEqual(sequence, ['c', 'b', 'a', 'y', 'x', 'z' ]);

    graph.createEdge(c,x);

    sequence = [];
    graph.leafFirstSearch(function(vertex) {
      sequence.push(vertex.id);
    });
    assert.deepEqual(sequence, ['y', 'x', 'c', 'b', 'a', 'z' ]);

    graph.removeEdge(b,c);

    sequence = [];
    graph.leafFirstSearch(function(vertex) {
      sequence.push(vertex.id);
    });
    assert.deepEqual(sequence, ['b', 'a', 'y', 'x', 'c', 'z' ]);


  });

  it('can use a strip function for hashing and serialization', function() {

    var graph = new Graph({
      hashFn: function(obj) {
        return '_' + obj.id;
      },
      stripFn: function(obj) {
        var strippedObj = {};
        for (var key in obj) {
          if (obj.hasOwnProperty(key) && (key[0] !== '_')) {
            strippedObj[key] = obj[key];
          }
        }
        return strippedObj;
      }
    });
    var a = {id: 'a', _x: '2'};
    var b = {id: 'b', value: 'bb'};
    graph.put(a);
    graph.put(b);
    graph.createEdge(a,b);

    var serialized = graph.serialize();

    assert.deepEqual(serialized, {
      vertices: {
        a: {id: 'a'},
        b: b,
      },
      edges: {
        a: ['b'],
      },
    });

  });

  it('has a hash of it\'s own', function() {
    var hashFn = function(obj) {
      if (obj.id) {
        return '_' + obj.id;
      } else {
        return _.keys(obj.vertices).length + '_' + _.keys(obj.edges).length;
      }

    };
    var graph = new Graph({
      hashFn: hashFn
    });

    var a = {id: 'a'}, b = {id: 'b'};
    graph.put(a);
    graph.put(b);

    graph.serialize();
    assert.deepEqual(graph.getHash(), '2_0');

  });

});