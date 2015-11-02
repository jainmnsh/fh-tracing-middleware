'use strict';

'use strict';

var proxyquire = require('proxyquire')
  , expect = require('chai').expect
  , events = require('lib/events')
  , tracing = require('index.js')
  , serviceStub = require('test/request-test-stub')
  , middleware = null
  , req = null
  , res = null
  , httpMocks = require('node-mocks-http');

describe('Middlware', function () {

  describe('#init', function () {
    it('Should throw due to missing params', function () {
      expect(tracing.init).to.throw(Error);
    });

    it('Should run successfully and return a middleware', function () {
      expect(tracing.init({
        tracers: [new tracing.FHServiceTracer({
          serviceId: '1234567890'
        })]
      })).to.be.a('function');
    });
  });

  describe('#req.trace', function () {
    beforeEach(function () {
      serviceStub.clearLastRequest();
      serviceStub.clearNextResponse();

      middleware = tracing.init({
        tracers: [new tracing.FHServiceTracer({
          serviceId: 'fake-service-id'
        })]
      });

      req = httpMocks.createRequest({
        method: 'GET',
        url: '/test'
      });

      res = httpMocks.createResponse({
        eventEmitter: require('events').EventEmitter
      });
    });

    it('Should be defined on the req object', function (done) {

      middleware(req, res, function (err) {
        expect(err).to.be.undefined;
        expect(req.trace).to.be.defined;
        expect(req.trace.createSpan).to.be.defined;
        done();
      });

    });

    it('Should fire server receive (sr) and server send (ss)', function (done) {

      // Verify the server receive is behaving correctly
      events.emitter.on(events.EVENTS.SERVER_RECEIVE, function () {

        // Need to wait a little while to ensure all processing completes
        // before checking results
        setTimeout(function () {
          var sr = serviceStub.getLastRequest()
            , body = null;

          expect(sr.body).to.be.a('string');

          body = JSON.parse(sr.body);

          expect(body.sender).to.be.a('string');
          expect(body.traces).to.be.an('array');
          expect(body.traces[0]).to.be.an('object');
          expect(body.traces[0].trace_id).to.be.defined;
          expect(body.traces[0].annotations).to.be.an('array');
          expect(body.traces[0].annotations[0].key).to.equal('sr');
          expect(body.traces[0].annotations[0].type).to.equal('timestamp');

          // Now respond to trigger server send
          serviceStub.setResponseToDefault();

          res.end('ok');
        }, 100);

      });

      // Verify the server send is bahaving correctly
      events.emitter.on(events.EVENTS.SERVER_SEND, function () {

        // Need to wait a little while to ensure all processing completes
        // before checking results
        setTimeout(function () {
          var ss = serviceStub.getLastRequest()
            , body = null;

          expect(ss.body).to.be.a('string');

          body = JSON.parse(ss.body);

          expect(body.sender).to.be.a('string');
          expect(body.traces).to.be.an('array');
          expect(body.traces[0]).to.be.an('object');
          expect(body.traces[0].trace_id).to.be.defined;
          expect(body.traces[0].annotations).to.be.an('array');
          expect(body.traces[0].annotations[0].key).to.equal('ss');
          expect(body.traces[0].annotations[0].type).to.equal('timestamp');

          done()
        }, 100);

      });

      // Ensure the response for the SR (server receive is ok)
      serviceStub.setResponseToDefault();

      // "Initialise" (mimic) a request to the server
      middleware(req, res, function (err) {
        expect(err).to.be.undefined;
        expect(res.trace).to.be.defined;
      });
    });

  });

});
