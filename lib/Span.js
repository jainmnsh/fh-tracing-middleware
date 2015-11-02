'use strict';

var trace = require('tryfer').trace
  , assert = require('assert');

/**
 * Spans are used to record the time a specific operation takes.
 * @param {Trace}   parent The parent trace
 * @param {String}  desc   Brief description of the span e.g "redis - write"
 */
function FHSpan (parent, desc) {
  assert(
    parent,
    'FHSpan constructor was called without a "parent" trace being passed in'
  );

  assert(
    desc,
    'FHSpan constructor was called without a description parameter'
  );

  // Create a child span and keep it referenced
  this.trace = parent.child(desc);

  this.events = [];
}


/**
 * Used to ensure events are not being fired incorrectly.
 * This is important to ensure data consistency
 * @param  {String} fn
 * @param  {String} evt
 */
FHSpan.prototype._assertNotFired = function (fn, evt) {
  assert.equal(
    this.events.indexOf(fn),
    -1,
    'Cannot call "'.concat(fn).concat('" after calling "' + evt + '"')
  );
};


/**
 * Used to ensure events are not being fired incorrectly.
 * This is important to ensure data consistency
 * @param  {String} fn
 * @param  {String} evt
 */
FHSpan.prototype._assertFired = function (fn, evt) {
  assert.notEqual(
    -1,
    this.events.indexOf(fn),
    'Must call "'.concat(fn).concat('" before calling "' + evt + '"')
  );
};


/**
 * Make this span a one time event.
 * @throws {AssertionError} If "start", "end" or "oneTime" has been called already
 * @return {Undefined}
 */
FHSpan.prototype.oneTime = function () {
  this._assertNotFired('oneTime', 'start');
  this._assertNotFired('start', 'start');
  this._assertNotFired('end', 'start');

  this.events.push('oneTime');

  this.trace.record(trace.Annotation.timestamp('oneTime'));
};


/**
 * Create a start timestamp for this span
 * @throws {AssertionError} If "start", "end" or "oneTime" has been called already
 * @return {Undefined}
 */
FHSpan.prototype.start = function () {
  this._assertNotFired('oneTime', 'start');
  this._assertNotFired('start', 'start');
  this._assertNotFired('end', 'start');

  this.events.push('start');

  this.trace.record(trace.Annotation.timestamp('start'));
};


/**
 * Create a start timestamp for this span
 * @throws {AssertionError}   If "start" has not been called, of if "end" or
 *                           "oneTime" has been called already
 * @return {Undefined}
 */
FHSpan.prototype.end = function () {
  this._assertFired('start', 'end');
  this._assertNotFired('oneTime', 'end');
  this._assertNotFired('end', 'end');

  this.events.push('end');

  this.trace.record(trace.Annotation.timestamp('end'));
};

module.exports = FHSpan;
