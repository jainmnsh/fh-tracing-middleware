'use strict';

var FHSpan = require('./Span')
  , trace = require('tryfer').trace;


/**
 * A trace is attached to each request object that enters the Node.js app.
 * The trace is used to create spans.
 * @param {Object} req The incoming request
 */
function FHTrace (req) {
  var t = this.trace = trace.Trace.fromRequest(
    req, process.env.FH_WIDGET || 'FH_APP_ID'
  );

  // We received the request!
  t.record(trace.Annotation.serverRecv());

  req.on('close', function () {
    // We've sent a response we think...
    // TODO: Handle timeout and other error scenarios
    t.record(trace.Annotation.serverSend());
  });
}

module.exports = FHTrace;


/**
 * Creates a new span to track an event e.g
 *
 * var span = req.trace.createSpan('getUsers')

 * span.start();
 * var config = fs.readFileSync('./conf');
 * span.end();
 *
 * @param  {String} name
 * @return {Span}
 */
FHTrace.prototype.createSpan = function (name) {
  return new FHSpan(this.trace, name);
};
