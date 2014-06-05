var _ = require('underscore');
var crypto = require('crypto-js');

function normalize(obj) {
  if (_.isArray(obj)) {
    return obj.map(function(x) {
      return normalize(x);
    });
  } else if (_.isObject(obj)) {
    var sortedKeys = _.keys(obj).sort();
    var newObj = {};
    sortedKeys.forEach(function(key) {
      newObj[key] = normalize(obj[key]);
    });
    return newObj;
  } else {
    return obj;
  }
}

module.exports.hash = function(obj) {
  var normalizedObject = normalize(obj);
  return crypto.SHA1(JSON.stringify(normalizedObject)).toString(crypto.enc.Hex);
};

