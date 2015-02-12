#!/usr/bin/env node

var moment = require('moment');
var _ = require('underscore');
require('twix');
var timeline = require('./timeline');

function splitOverlaps(data) {
  return data.reduce(function (prev, current) {
    var start = moment.unix(current.time.start.start);
    var end = moment.unix(current.time.end.end);

    var rangeCurrent = moment.twix(start, end);

    if (_.find(prev.pure, function (el) {
      var start = moment.unix(el.time.start.start);
      var end = moment.unix(el.time.end.end);

      return rangeCurrent.overlaps(moment.twix(start, end));

    })) {
      prev.other.push(current);
      return prev;
    }

    prev.pure.push(current);
    return prev;

  }, {
    pure: [],
    other: []
  });
}

function multiSplit(data) {
  var results = [];

  var result = splitOverlaps(data);
  results.push(result.pure);

  while (result.other.length !== 0) {
    result = splitOverlaps(result.other);
    results.push(result.pure);
  }

  return results;
}

var range1 = moment("1982-05-02").twix("1982-05-30");
var range2 = moment("1982-06-03").twix("1982-06-13");

console.log(range2.overlaps(range1)); //=> true
