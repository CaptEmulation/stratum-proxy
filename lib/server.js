/**
 * Created by jdean on 3/23/14.
 */
'use strict';

var Q = require('q');
var net = require('net');
var createSocket = require('./socket').createOutgoing;

function paramsMatchServerPassword(data, serverModel) {
   return !(data.params[0].indexOf(serverModel.user) || serverModel.user.indexOf(data.params[0]) ||
      data.params[1].indexOf(serverModel.password) || serverModel.password.indexOf(data.params[1]));
}

var parseJson = function (str) {
   var json;
   try {
      json = JSON.parse(str);
   } catch (e) {
      console.log('Not able to parse: ' + str + ' due to: ' + e.message + ':' + e.stack);
   }
   return json || {};
};

var miningAuthorized = function (client, serverModel, target, defer) {
   return function (str) {

      var data = parseJson(str);
      if (data && !defer.isFulfilled && data.method && data.method.indexOf('mining.authorize') !== -1) {
         if (data.params && Array.isArray(data.params) && paramsMatchServerPassword(data, serverModel)) {
            console.log('client authorized');
            client.write(JSON.stringify({
               id: data.id,
               error: "null",
               "result": true
            }) + '\n');
            defer.resolve();
            return;
         } else {
            client.write(JSON.stringify({
               id: data.id,
               error: "not authorized",
               "result": false
            }) + '\n');
            client.end();
            target.end();
            defer.reject();
         }
      } else {
         console.log('client did not ask to be authorized so forwarding request to server');
         target.write(str);
      }

   };
};

exports.create = function (options) {

   if (!(options && options.server && options.socket)) {
      throw new Error("Must include required options to start stratum server.  Got: " + JSON.stringify(options, null, 2));
   }
   var socket = options.socket, server = options.server;
   var defer = Q.defer(), serverCreatedDefer = Q.defer();

   var serverSocket = net.createServer(function (rawSocket) {
      console.log('Miner connecting...');
      var client = createSocket(rawSocket);
      var authorizedDefer = Q.defer();
      var authorizationHandler = miningAuthorized(rawSocket, options.server, socket, authorizedDefer);

      client.on('end', function () {
         socket.off(null, null, this);
         socket.end();
      });

      client.on('data', function (data) {
         console.log('data received from client');
         if (authorizedDefer.promise.isFulfilled()) {
            console.log('sending data from authorized client--' + data);
            client.write(data);
         } else {
            console.log('Attempting to authorizing client.--' + data);
            authorizationHandler(data);
         }

      });


      socket.on('data', function (data) {
         console.log('sending to client--' + data);
         client.write(data);
      }, this);

      serverCreatedDefer.resolve(self);
   });


   var self = {
      server: serverSocket,
      middle: socket,
      loaded: defer.promise,
      connected: serverCreatedDefer.promise
   };

   var serverUpDefer = Q.defer();
   serverSocket.listen(server.port, function () {
      console.log('Proxy Listening');
      serverUpDefer.resolve(serverSocket);
   });

   serverUpDefer.promise.then(function () {
      defer.resolve();
   });

   return self;
};
