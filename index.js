'use strict';

var FHTrace = require('./lib/Trace')
  , tracers = require('tryfer').tracers
  , ServiceTracer = require('./lib/tracers/ServiceTracer');

/**
 * Get a middleware instance with the configured options.
 * @return {[type]} [description]
 */
exports.init = function (params) {
  tracers.push(new ServiceTracer(params.serviceId));

  return function (req, res, next) {
    req.trace = new FHTrace(req);

    next();
  };
};
