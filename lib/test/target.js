/**
 * Created by jdean on 4/14/14.
 */
'use strict';

var rewire = require("rewire");
var target = rewire('../target');
var expect = require('chai').expect;
var sinon = require('sinon');
var tester = require('./utils').tester.target;

describe('Target test suite', function () {

  var test, netStub, connectSocketStub;

  beforeEach(function () {
    test = tester(target);
    connectSocketStub = {
      on: sinon.stub(),
      listen: sinon.stub().yieldsAsync(),
      write: sinon.stub(),
      end: sinon.stub()
    };
    netStub = {
      connect: function (options, callback) {
        setTimeout(function () {
          callback();
        });
        connectSocketStub.port = options.port;
        connectSocketStub.host = options.host;
        return connectSocketStub;
      }
    };
    target.__set__('net', netStub);
  });

  it('sanity', function () {
    expect(test.create()).to.not.equal(undefined);
  });

  it('#net.connect', function (done) {
    test.create().loaded.then(function () {
      done();
    });
  });

  describe('Target connected: ', function () {
    beforeEach(function (done) {
      test.create().loaded.then(function () {
        done();
      });
    });

    function clientSendsData(data) {
      var dataListeners = [];
      test.options.socket.on.getCalls().forEach(function (call) {
        if (call.args[0].indexOf('data') !== -1) {
          dataListeners.push(call.args[1]);
        }
      });
      dataListeners.forEach(function (l) {
        l(data);
      });
    }

    function serverSendsData(data) {
      var dataListeners = [];
      connectSocketStub.on.getCalls().forEach(function (call) {
        if (call.args[0].indexOf('data') !== -1) {
          dataListeners.push(call.args[1]);
        }
      });
      dataListeners.forEach(function (l) {
        l(data);
      });
    }

    it('Receives data from connected client', function () {
      clientSendsData('{}\n');
      expect(connectSocketStub.write.firstCall.args[0]).to.equal('{}\n');
    });

    it('Send data to connected client', function () {
      serverSendsData('{}\n');
      expect(test.options.socket.write.firstCall.args[0]).to.contain('{}');
    });

    it('Server receives  mining.authorized request', function () {
      serverSendsData('{}\n');
      expect(connectSocketStub.write.firstCall.args[0].indexOf('mining.authorize') !== -1).to.equal(true);
    });

  });


});