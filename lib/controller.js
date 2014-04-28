'use strict';

var Q = require('q');
var EventEmitter = require('eventemitter3').EventEmitter;
var createServer = require('./server').create;
var createTarget = require('./target').create;

var MiddlewareSocket = require('es5class').$define('MiddlewareSocket', {
  setSocket: function (socket) {
    this._socket = socket;
  },
  write: function (data) {
    this._socket.emit('data', data);
  },
  end: function () {
    this._socket.emit('end');
  }
}).$implement(EventEmitter, true);


var createMiddlewareSocket = function () {
  var socket = new MiddlewareSocket();
  return socket;
};

var connectTargetToServer = exports.connectTargetToServer = function (target, server) {
  var defer = Q.defer();
  var targetAvailable = target.loaded;
  var serverInitialized = server.loaded;
  Q.all([
    targetAvailable,
    serverInitialized
  ]).done(function () {
    target.middle.setSocket(server.middle);
    server.middle.setSocket(target.middle);
    defer.resolve();
  });
  return defer.promise;
};

exports.create = function (options) {
  if (!(options && options.target && options.server)) {
    throw new Error("Failed to include options");
  }

  var target = options.target, server = options.server;
  var defer = Q.defer();
  var middleTargetSocket = createMiddlewareSocket();
  var middleServerSocket = createMiddlewareSocket();

  connectTargetToServer(
      createTarget({ client: target, socket: middleTargetSocket}),
      createServer({ server: server, socket: middleServerSocket})).then(function () {
    defer.resolve();
  });
  return defer.promise;
};
