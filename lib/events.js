'use strict';

var EventEmitter = require('events').EventEmitter;

exports.emitter = new EventEmitter();

exports.EVENTS = {
  // Triggered when the middleware is executed
  SERVER_RECEIVE: 'server-receive',

  // Indicates "res.end" was called in the express application
  SERVER_SEND: 'server-send',

  // Sending a trace succeeded
  SEND_TRACE_SUCCESS: 'send-trace-success',

  // Sending a trace failed
  SEND_TRACE_FAILED: 'send-trace-failed',

  // Fire when a new span is created
  SPAN_CREATED: 'span-created'
};
