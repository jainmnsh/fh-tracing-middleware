'use strict';

var nextResponse = null
  , lastRequestOpts = null;

var mock = module.exports = function (opts, callback) {
  lastRequestOpts = opts;

  if (!nextResponse) {
    throw new Error('No response was configured for the incoming request');
  } else {
    callback(nextResponse.err, nextResponse.res, nextResponse.body);
  }
};

mock.getLastRequest = function () {
  return lastRequestOpts;
};

mock.clearLastRequest = function () {
  lastRequestOpts = null;
};

mock.setResponseToDefault = function () {

  mock.setNextResponse(
    null,
    {
      statusCode: 200,
    },
    {
      message: 'ok'
    }
  );

};

mock.clearNextResponse = function () {
  nextResponse = null;
};

mock.setNextResponse = function (err, res, body) {
  nextResponse = {
    err: err,
    res: res,
    body: body
  };
};
