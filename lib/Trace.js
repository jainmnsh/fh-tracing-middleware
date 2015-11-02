'use strict';

var FHSpan = require('./Span')
  , trace = require('tryfer').trace
  , events = require('./events');


/**
 * A trace is attached to each request object that enters the Node.js app.
 * The trace is used to create spans.
 * @param {Object} req The incoming request
 */
function FHTrace (req, res) {
  var complete = false
    , t = this.trace = trace.Trace.fromRequest(
      req, req.url
    );

  // We received the request!
  events.emitter.emit(events.EVENTS.SERVER_RECEIVE);
  t.record(trace.Annotation.serverRecv());

  function runIfNotComplete(fn) {
    return function () {
      if (!complete) {
        fn();
      }
    };
  }

  // Connection was closed for some reason
  req.on('close',
    runIfNotComplete(
      function traceOnConnectionClose () {
        // TODO: Handle timeout and other error scenarios
        events.emitter.emit(events.EVENTS.SERVER_SEND);
      }
    )
  );

  // We sent a response to the client somewhere in application logic!
  res.on('end',
    runIfNotComplete(
      function traceOnConnectionEnd () {
        // We've sent a response we think...
        // TODO: Handle timeout and other error scenarios
        events.emitter.emit(events.EVENTS.SERVER_SEND);
        t.record(trace.Annotation.serverSend());
      }
    )
  );
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
