/**
 * Created by jdean on 3/23/14.
 */

var Q = require('q');
var net = require('net');
var createSocket = require('./socket').create;

var once = exports.onceThen = function (first, then) {
  var run = false;
  return function () {
    if (run) {
      then.apply(this, arguments);
    } else {
      first.apply(this, arguments);
    }
  }
}

function paramsMatchServerPassword(data, serverModel) {
  return !(data.params[0].indexOf(serverModel.user) || serverModel.user.indexOf(data.params[0])
    || data.params[1].indexOf(serverModel.password) || serverModel.password.indexOf(data.params[1]));
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
        client.write(JSON.stringify({
          id: data.id,
          error: "null",
          "result": true
        }) + '\n');
        defer.resolve();
        return;
      }
      client.write(JSON.stringify({
        id: data.id,
        error: "not authorized",
        "result": false
      }) + '\n');
      client.end();
      defer.reject();
    } else {
      target.write(str);
    }

  }
};

exports.create = function (options) {

  if (!(options && options.server && options.socket)) {
    throw new Error("Must include required options to start stratum server.  Got: " + JSON.stringify(options, null, 2));
  }
  var socket = options.socket, server = options.server;
  var defer = Q.defer(), serverCreatedDefer = Q.defer();

  var serverSocket = net.createServer(function (rawSocket) {
    var client = createSocket(rawSocket);
    var authorizedDefer = Q.defer();
    var authorizationHandler = miningAuthorized(client, options.server, socket, authorizedDefer);

    client.on('end', function () {

    });

    client.on('data', function (data) {

      if (authorizedDefer.isFulfilled) {
        socket.write(data);
      } else {
        authorizationHandler(data);
      }

    });
    serverCreatedDefer.resolve(self);
  });

  socket.on('data', function (data) {
    serverSocket.write(data);
  });

  var self = {
    server: serverSocket,
    middle: socket,
    loaded: defer.promise
  };

  var serverUpDefer = Q.defer();
  serverCreatedDefer.promise.then(function () {
    serverSocket.listen(server.port, function () {
      serverUpDefer.resolve(serverSocket);
    });
  });

  serverUpDefer.promise.then(function () {
    defer.resolve();
  });

  return self;
};
