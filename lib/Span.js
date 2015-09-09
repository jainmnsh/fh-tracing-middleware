'use strict';

var trace = require('tryfer').trace;

/**
 * Spans are used to record the time a specific operation takes.
 * @param {Trace}   parent The parent trace
 * @param {String}  desc   Brief description of the span e.g "redis - write"
 */
function FHSpan (parent, desc) {
  // Create a child span and keep it referenced
  this.trace = parent.child(desc);
}


FHSpan.prototype.start = function () {
  this.trace.record(trace.Annotation.timestamp('start'));
};


FHSpan.prototype.end = function () {
  this.trace.record(trace.Annotation.timestamp('end'));
};

module.exports = FHSpan;
