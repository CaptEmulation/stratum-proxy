/**
 * Created by jdean on 4/24/14.
 */



var createSocket = require('../socket').create;
var expect = require('chai').expect;
var sinon = require('sinon');
var Q = require('q');
var tester = require('./utils').tester.controller;
var library = require('./utils').library;

describe('socket test suite', function () {

  var socket, stubSocket;

  beforeEach(function () {
    stubSocket = library.stubSocket();
    socket = createSocket(stubSocket);
  });

  it('sanity', function () {
    expect(socket).to.be.ok;
  });

  it('does not send incomplete data', function () {
    socket.write('{}');
    expect(stubSocket.write.callCount).to.equal(0);
  });

  it('caches incomplete data', function () {
    socket.write('{');
    expect(stubSocket.write.callCount).to.equal(0);
    socket.write('}');
    expect(stubSocket.write.callCount).to.equal(0);
    socket.write('\n');
    expect(stubSocket.write.callCount).to.equal(1);
    expect(stubSocket.write.lastCall.args[0]).to.equal('{}\n');
  });

  it('chunks data and caches left over', function () {
    socket.write('1\n2\n3\n4\nfoo');
    expect(stubSocket.write.callCount).to.equal(4);
    socket.write('\n');
    expect(stubSocket.write.callCount).to.equal(5);
  });

  it('chunks data with trailing EOL', function () {
    socket.write('1\n2\n3\n4\nfoo\n');
    expect(stubSocket.write.callCount).to.equal(5);
  });

});