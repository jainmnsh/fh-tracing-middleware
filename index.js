'use strict';

if (process.env.NODE_ENV === 'test') {
  var fhlog = require('fhlog');
  fhlog.setDefault('level', fhlog.LEVELS.ERR);
  fhlog.silenceAll();
}

var FHTrace = require('./lib/Trace')
  , assert = require('assert')
  , tracers = require('tryfer').tracers
  , ServiceTracer = require('./lib/tracers/ServiceTracer');

/**
 * Get a middleware instance with the configured options.
 * @return {[type]} [description]
 */
exports.init = function (params) {
  assert(
    params,
    'params are required by the init call for fh-tracing-middleware'
  );

  assert(
    params.tracers,
    'params.tracers is a required parameter, and must be an Array'
  );

  // Remove previous tracers and add the ServiceTracer by default
  tracers.setTracers(params.tracers);

  return function FHTracingMiddleware (req, res, next) {
    req.trace = new FHTrace(req, res);
    next();
  };
};

exports.events = require('./lib/events');

exports.FHServiceTracer = require('./lib/tracers/ServiceTracer');
