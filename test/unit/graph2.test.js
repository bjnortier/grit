var chai = require('chai');
var assert = chai.assert;

var Graph = require('../../lib/graph2');

describe.only('Immutable graph', function() {

  var g0 = new Graph();

  beforeEach(function() {
    g0 = new Graph({idFn: function(vertex) { 
      if (vertex._id === undefined) { 
        throw new Error('no id can be determined for object');
      }
      return vertex._id; 
    }});
  });

  it('can store, fetch, replace and remove objects', function() {

    // ----- Put -----

    // No id
    assert.throws(function() {
      g0.put({});
    }, Error, 'no id can be determined for object');

    // Put & get
    var a0 = {_id: 0, value: 5};
    var g1 = g0.put(a0);
    assert.isNull(g0.get(0));
    assert.deepEqual(g1.get(0), a0);

    // ----- Replace -----

    // Not in graph
    assert.throws(function() {
      g0.replace({_id: 5});
    }, Error, 'vertex not in graph');  

    // Replace & get
    var a1 = {_id: 0, value: 10};
    var g2 = g1.replace(a1);
    assert.isNull(g0.get(0));
    assert.deepEqual(g1.get(0), a0);
    assert.deepEqual(g2.get(0), a1);

    // ----- Remove -----

    // Not in graph
    assert.throws(function() {
      g2.remove({_id: 5});
    }, Error, 'vertex not in graph');  

    // Remove & get
    var g3 = g2.remove(a1);
    assert.isNull(g0.get(0));
    assert.deepEqual(g1.get(0), a0);
    assert.deepEqual(g2.get(0), a1);
    assert.isNull(g3.get(0));

  });

 });