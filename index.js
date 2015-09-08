'use strict';

var FHTrace = require('./lib/Trace');

module.exports = function (req, res, next) {
  var req.trace = new FHTrace(req);

  // Request is completed, end tracing
  // req.on('close', req.trace.end);

  next();
};
