/**
 * Created by jdean on 4/24/14.
 */
'use strict';


var createOutgoingSocket = require('../socket').createOutgoing;
var createIncomingSocket = require('../socket').createIncoming;
var expect = require('chai').expect;
var sinon = require('sinon');
var library = require('./utils').library;

describe('socket test suite', function () {

   describe('Outgoing socket tests', function () {

      var socket, stubSocket;

      beforeEach(function () {
         stubSocket = library.stubSocket();
         socket = createOutgoingSocket(stubSocket);
      });

      it('sanity', function () {
         expect(socket).to.not.equal(undefined);
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

   describe('Incoming socket tests', function () {

      var socket, testSocket, stubListener;

      beforeEach(function () {
         testSocket = library.testSocket();
         socket = createIncomingSocket(testSocket);
         stubListener = sinon.stub();
         socket.on('data', stubListener);
      });

      it('sanity', function () {
         expect(socket).to.not.equal(undefined);
      });

      it('does not send incomplete data', function () {
         testSocket.receive('{}');
         expect(stubListener.callCount).to.equal(0);
      });

      it('caches incomplete data', function () {
         testSocket.receive('{');
         expect(stubListener.callCount).to.equal(0);
         testSocket.receive('}');
         expect(stubListener.callCount).to.equal(0);
         testSocket.receive('\n');
         expect(stubListener.callCount).to.equal(1);
         expect(stubListener.lastCall.args[0]).to.equal('{}\n');
      });

      it('chunks data and caches left over', function () {
         testSocket.receive('1\n2\n3\n4\nfoo');
         expect(stubListener.callCount).to.equal(4);
         testSocket.receive('\n');
         expect(stubListener.callCount).to.equal(5);
      });

      it('chunks data with trailing EOL', function () {
         testSocket.receive('1\n2\n3\n4\nfoo\n');
         expect(stubListener.callCount).to.equal(5);
      });

   });

});