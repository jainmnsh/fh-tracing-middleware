Tracing Middleware for FeedHenry Cloud Apps
===========================================

[![build-status](https://travis-ci.org/evanshortiss/fh-tracing-middleware.svg?branch=master)
](https://travis-ci.org/evanshortiss/fh-tracing-middleware)

Tracing middleware for FeedHenry Cloud applications. Uses node-tryfer for 
implementation of the data format for traces.

## Usage Example
The example below demonstrates a few things:

* Adding the tracing middleware via _app.use_, with a tracer that will write 
  our request events to an FHTracing mBaaS Service.
* IncomingRequest (req) has a _tracing_ property added, that is an instance 
  of FHTrace.
* _req.trace_ exposes a _createSpan_ function that returns an FHSpan instance.
* The FHSpan instance is used to time request operations using _start_ and 
  _end_ functions.
* That using the middleware is optional via _/delayed-ping_

In the example below, we generate a Trace that would show us how long it takes 
to validate a user's session for each request received. It will also tell us 
how long each opertaion within _/users-with-metadata_ takes at an individual 
level meaning we can identify where time is being spent in our routes.

```javascript

var express = require('express')
  , app = express()
  , users = require('lib/model/users')
  , session = require('lib/model/sessions')
  , meta = require('lib/model/sessions')
  , async = require('async')
  , tracing = require('fh-tracing')
  , tracingServiceGuid = 'hsydUvjH1KwaCSBUldQVnG73'


// Add our tracing middleware
app.use(tracing.init({
  tracers: [
    new tracing.FHServiceTracer({
      serviceId: tracingServiceGuid
    })
  ]
}));


// Example session handling middleware
app.use(function vaildateSession (req, res, next) {
  var sessionSpan = req.trace.createSpan('validate-session');
  sessionSpan.start();

  session.validate(req, function (err, valid) {
    if (err) {
      next(err);
    } else {
      sessionSpan.end();
      next();
    }
  });
});


// Route that responds with ok sometime within two seconds of being called
// Even though we don't directly use the middleware, it will still track how 
// long this request has taken!
app.get('/delayed-ping', function () {
  setTimeout(function () {
    res.end('ok');
  }, (Math.random() * 2000))
});


// A more comple route with multiple operations we can track
app.get('/users-with-metadata', function (req, res, next) {
  var getUsersSpan = req.trace.createSpan('get-users');
  getUsersSpan.start();

  users.getAllUsers(function onUsersLoaded (err, users) {
    getUsersSpan.end();

    if (err) {
      next(err);
    } else {
      var getMetaSpan = req.trace.createSpan('get-meta');
      getMetaSpan.start();

      async.map(
        users,
        meta.getMetaForUser.bind(meta),
        function onUserMetaLoaded (err, usersWithMeta) {
          getMetaSpan.end();

          if (err) {
            next(err);
          } else {
            res.json(usersWithMeta);
          }
        }
      );
    }
  });
});

```


## API

#### init(params)
Initialises the middleware. Params is a required Object that should contain the 
following:

* tracers - An Array of "tracers". Tracers are used to record the "traces" and 
"spans" that track the lifespan of a request.

#### events

##### emitter
A standard Node.js event emitter that can be used to observe the events listed 
below.

##### EVENTS
Exposes the events that the library can emit. The list is an Object with values:

* SERVER_RECEIVE - 'server-receive'
* SERVER_SEND - 'server-send'
* SEND_TRACE_SUCCESS - 'send-trace-success'
* SEND_TRACE_FAILED - 'send-trace-failed'
* SPAN_CREATED - 'span-created'

#### FHServiceTracer(params)
This is a "tracer" that is used to record spans that are used to track the 
lifecycle of a request. These spans are stored in the Mongo Database of an mBaaS
service specified in _params_. The mBaaS Service must be created using the 
FHTracerService template.
