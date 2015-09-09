'use strict';

var formatter = require('tryfer').formatters.formatForRestkin
  , service = require('fh-mbaas-api').service
  , async = require('async')
  , log = require('fhlog').get('Mongo Tracer');


/**
 * Service Tracer that writes logs over HTTP to an mBaaS Service
 * @param  {String} serviceId
 */
function ServiceTracer (serviceId) {
  this.serviceId = serviceId;
}


/**
 * Record must be defined on the Tracer instance
 * @param  {[type]} traces [description]
 * @return {[type]}        [description]
 */
ServiceTracer.prototype.record = function(traces) {
  log.d('Storing traces:');
  log.d(JSON.stringify(traces, null, 2));

  async.mapSeries(traces, formatTuple, function (err, formattedTraces) {
    if (err) {
      log.e('Failed to store traces due to err: %s', err);
      log.e(err.stack);
    } else {
      storeTraces(formattedTraces, this.serviceId);
    }
  });
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
      log.d(JSON.stringify(json, null, 2));

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
function storeTraces (traces, serviceId) {
  service({
    guid: serviceId,
    path: '/tryfer/'.concat(serviceId),
    method: 'POST',
    data: traces
  }, function storeTracesCallback (err, res) {
    if (err) {
      log.e('Error sending traces to service %s: ', serviceId, err);
    } else if (res.statusCode != 200) {
      log.e(
        'Error saving traces to service %s, status code was %s',
        serviceId,
        res.statusCode
      );
    } else {
      log.d('Saved traces to service %s', serviceId);
    }
  });
}
