'use strict';

var trace = require('tryfer').trace
  , FHSpan = require('lib/Span')
  , expect = require('chai').expect
  , span = null;

describe('FHSpan', function () {

  beforeEach(function () {
    span = new FHSpan({
      child: function () {
        return {
          record: function () {

          }
        }
      }
    }, 'test-span');
  });

  describe('#FHSpan', function () {
    it('Should create an instance successfully', function () {
      expect(function () {
        new FHSpan({}, 'desc')
      }).to.not.throw('AssertionError');
    });

    it('Should fail to create', function () {
      expect(function () {
        new FHSpan();
      }).to.throw();
    });

    it('Should Should fail to create', function () {
      expect(function () {
        new FHSpan({});
      }).to.throw();
    });
  });



  describe('#oneTime', function () {
    it('Should pass assertion', function () {
      expect(function () {
        span._assertNotFired('oneTime', 'oneTime');
      }).to.not.throw('AssertionError');
    });

    it('Should throw "oneTime" assertion error', function () {
      expect(function () {
        span.oneTime();
        span.oneTime();
      }).to.throw('AssertionError');
    });

    it('Should throw assertion error, cannot call "start"', function () {
      expect(function () {
        span.oneTime();
        span.start();
      }).to.throw('AssertionError');
    });

    it('Should throw assertion error, cannot call "end"', function () {
      expect(function () {
        span.oneTime();
        span.end();
      }).to.throw('AssertionError');
    });
  });

  describe('#start', function () {
    it('Should pass assertion', function () {
      expect(function () {
        span._assertNotFired('start', 'start');
      }).to.not.throw('AssertionError');
    });

    it('Should throw "start" assertion error', function () {
      expect(function () {
        span.start();
        span.start();
      }).to.throw('AssertionError');
    });

    it('Should throw assertion error, cannot call "oneTime"', function () {
      expect(function () {
        span.start();
        span.oneTime();
      }).to.throw('AssertionError');
    });

  });

  describe('#end', function () {
    it('Should pass assertion', function () {
      expect(function () {
        span._assertNotFired('end', 'end');
      }).to.not.throw('AssertionError');
    });

    it('Should throw "end" assertion error', function () {
      expect(function () {
        span.end();
        span.end();
      }).to.throw('AssertionError');
    });

    it('Should throw assertion, cannot call "end" before "start"', function () {
      expect(function () {
        span.end();
      }).to.throw('AssertionError');
    });
  });

  describe('#_assertFired', function () {
    it('Should throw AssertionError', function () {
      expect(function () {
        span.events.push('a');
        span._assertFired('b', 'a');
      }).to.throw('AssertionError');
    });

    it('Should not throw AssertionError', function () {
      expect(function () {
        span.events.push('a');
        span._assertFired('a', 'a');
      }).to.not.throw('AssertionError');
    });
  });

  describe('#_assertNotFired', function () {
    it('Should throw AssertionError', function () {
      expect(function () {
        span.events.push('a');
        span._assertNotFired('a', 'a');
      }).to.throw('AssertionError');
    });

    it('Should not throw AssertionError', function () {
      expect(function () {
        span.events.push('a');
        span._assertNotFired('b', 'a');
      }).to.not.throw('AssertionError');
    });
  });

  describe('#continueChain', function () {

    // Automate for any chainable func
    ['oneTime', 'start', 'end'].forEach(function (fn) {
      describe('#'.concat(fn), function () {
        it('Should pass arguments back into a callback funtion',
          function (done) {
            if (fn === 'end') {
              // Need to call 'start' before 'end'
              span.start();
            }

            span[fn]('a', 'b', function (a, b) {
              expect(a).to.equal('a');
              expect(b).to.equal('b');
              done();
            });
          }
        );
      });
    });

  });

});
