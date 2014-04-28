
/**
 * Created by jdean on 4/16/14.
 */

var rewire = require("rewire");
var controller = rewire('../controller');
var target = rewire('../target');
var server = rewire('../server');
var expect = require('chai').expect;
var sinon = require('sinon');
var Q = require('q');
var tester = require('./utils').tester.controller;
var library = require('./utils').library;

describe('controller test suite', function () {

  var test, serverSocket, serverSocket2, clientSocket;

  function getAllDataListeners(socket) {
    var dataListeners = [];
    socket.on.getCalls().forEach(function (call) {
      if (call.args[0].indexOf('data') !== -1) {
        dataListeners.push(call.args[1]);
      }
    });
    return dataListeners;
  }

  function serverSendsData(data) {
    getAllDataListeners(clientSocket).forEach(function (l) {
      l(data);
    });
  }

  function clientSendsData(data) {
    getAllDataListeners(serverSocket2).forEach(function (l) {
      l(data);
    });
  }

  function readLastServerData(which) {
    var method = clientSocket.write;
    var callee = method[which ? which : 'lastCall'];
    return callee.args[0];
  }

  function readLastClientData(which) {
    var method = serverSocket.write;
    var callee = which ? method[which] : method.lastCall
    return callee.args[0];
  }

  beforeEach(function () {
    test = tester(controller);
    serverSocket = library.stubServerSocket();
    serverSocket2 = library.stubSocket();
    clientSocket = library.stubSocket();
    target.__set__('net', {
      connect: function (options, callback) {
        setTimeout(function () {
          callback();
        });
        return clientSocket;
      }
    });
    server.__set__('net', {
      createServer: function (arg) {
        setTimeout(function () {
          arg(serverSocket2);
        });
        return serverSocket;
      }
    });
    controller.__set__('createTarget', target.create);
    controller.__set__('createServer', server.create);
  });

  it('sanity', function (done) {
    test.create().then(function () {
      done();
    });
  });

  describe('communication tests', function () {
    var originalPromiseStratumServer;

    beforeEach(function (done) {
      test.create().then(function () {
        done();
      });
    });

    afterEach(function () {
      controller.__set__('promiseStratumServer', originalPromiseStratumServer);
    });

    it('client can talk to server', function () {
      clientSendsData('{}\n');
      expect(readLastServerData()).to.equal('{}\n');
      expect(readLastClientData).to.throw();
    });

    it('server can talk to client', function () {
      serverSendsData('{}\n');
      expect(readLastClientData()).to.equal('{}\n');
    });

    it('client mining.authorize calls do not get forwarded to server', function () {
      clientSendsData(JSON.stringify({
        method: 'mining.authorize',
        params: [ 'test', 'test' ],
        id: 1
      }) + '\n');
      expect(readLastServerData).to.throw();
    });

    it('server receives authorize request', function () {
      serverSendsData('{"foo":"bar"}\n');
      expect(readLastClientData()).to.equal('{"foo":"bar"}\n');
      expect(readLastServerData()).to.have.string('{"method":"mining.authorize","params":["foo","bar"],"id":');
    });

    it('server responds to authorize request', function () {
      serverSendsData('{"foo":"bar"}\n');
      var authorizeRequest = JSON.parse(readLastServerData());
      var authorizeResponse = JSON.stringify({
        id: authorizeRequest.id,
        error: "null",
        "result": true
      }) + '\n';
      serverSendsData(authorizeResponse);
      expect(readLastClientData()).to.not.have.string(authorizeResponse);
    })
  });
});



