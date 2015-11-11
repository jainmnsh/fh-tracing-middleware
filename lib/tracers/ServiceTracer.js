'use strict';

var formatter = require('tryfer').formatters.formatForRestkin
  , request = require('request')
  , mockRequest = require('test/request-test-stub')
  , async = require('async')
  , cache = require('memory-cache')
  , VError = require('verror')
  , iurl = require('fh-instance-url')
  , path = require('path')
  , url = require('url')
  , log = require('fhlog').get('Mongo Tracer')
  , S_URL_CACHE_TIME = (5 * 1000 * 60);


/**
 * Service Tracer that writes logs over HTTP to an mBaaS Service
 * @param  {String} serviceId
 */
function ServiceTracer (params) {
  this.serviceId = params.serviceId;
}
module.exports = ServiceTracer;


/**
 * Default callback for when a callback is optional
 * @param  {Error} err
 * @param  {Mixed} res
 */
function noop (err, res) {
  if (err) {
    log.e('Error passed to noop: %s', err);
    log.e(err.stack);
  } else {
    log.d('Result: %s', res);
  }
}


/**
 * Record must be defined on the Tracer instance
 * @param  {Array}    traces
 * @param  {Function} [callback]
 */
ServiceTracer.prototype.record = function(trace, callback) {
  var self = this;

  callback = callback || noop;

  log.d('Storing annotations:');
  log.d(JSON.stringify(trace, null, 2));

  formatTuple(trace[0], function sendTracesToService (err, formattedTraces) {
    if (err) {
      callback(err, null);
    } else {
      async.waterfall([
        self.getServiceUrl.bind(self),
        storeTraces.bind(null, formattedTraces, self.serviceId)
      ], callback);
    }
  });
};


/**
 * Get the URL to use for sending traces to a service instance.
 * @param  {Function} callback
 */
ServiceTracer.prototype.getServiceUrl = function (callback) {
  var storageKey = 'service-urls-'.concat(this.serviceId);

  if (process.env.NODE_ENV === 'test') {
    callback(null, 'http://fake-test-service-url.com');
  } else {
    if (cache.get(storageKey)) {
      callback(null, cache.get(storageKey));
    } else {
      iurl.getUrl({
        guid: this.serviceId,
        domain: process.env.FH_MILLICORE
      }, function onUrlRetrieved (err, surl) {
        if (err) {
          callback(err, null);
        } else {
          cache.put(storageKey, surl, S_URL_CACHE_TIME);

          callback(null, surl);
        }
      });
    }
  }
};


/**
 * Formats a Tuple as a valid JSON Object.
 * @param  {Object}   tuple
 * @param  {Function} callback
 */
function formatTuple (tuple, callback) {
  formatter([[tuple[0], tuple[1]]], function (err, json) {
    if (err) {
      callback(err, null);
    } else {
      log.d('Formatted trace:');
      log.d(json);

      callback(null, json);
    }
  });
}


/**
 * Stores the traces by using the $fh.service API to send them
 * to a service instance.
 * @param  {Array}  traces
 * @param  {String} serviceId
 */
function storeTraces (traces, serviceId, serviceUrl, callback) {
  // Create the call URL
  serviceUrl = url.parse(serviceUrl);
  serviceUrl.pathname = serviceUrl.path = path.join(
    'tryfer',
    'traces',
    serviceId
  );


  var req = (process.env.NODE_ENV === 'test') ? mockRequest : request;

  // Create a JSON payload with traces
  var payload = '{"traces":' + traces + '}';

  req({
    url: serviceUrl,
    body: payload,
    method: 'POST',
    timeout: 15000,
    headers: {
      'content-type': 'application/json'
    }
  }, function storeTracesCallback (err, res) {
    if (err) {
      callback(
        new VError(err, 'failed to send traces'),
        null
      );
    } else if (res.statusCode != 200) {
      callback(
        new VError(err, 'Service returned status code '.concat(res.statusCode)),
        null
      );
    } else {
      callback(null, null);
    }
  });
}
