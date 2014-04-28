/**
 * Created by jdean on 4/16/14.
 */


var sinon = require('sinon');


var library = exports.library = {
  fooClient: function () {
    return {
      _id: 'foo',
      user: 'foo',
      password: 'bar',
      port: '1600',
      host: 'foo-host'
    }
  },
  stubSocket: function () {
    return {
      write: sinon.stub(),
      on: sinon.stub(),
      end: sinon.stub()
    };
  },
  fooServer: function () {
    return {
      user: 'foo',
      password: 'bar',
      port: '1600',
      clientId: 'foo'
    };
  },
  stubServerSocket: function () {
    return {
      on: sinon.stub(),
      listen: sinon.stub().yieldsAsync(),
      write: sinon.stub()
    };
  }
}

exports.tester = {
  controller: function (controller) {
    var options = {};

    var self = {
      create: function () {
        if (!options.server) {
          self.withFooServer();
        }
        if (!options.target) {
          self.withFooTarget();
        }

        return controller.create(options);
      },
      withFooServer: function () {
        options.server = library.fooServer();
        return self;
      },
      withFooTarget: function () {
        options.target = library.fooClient();
        return self;
      },
    }
    return self;
  },
  server: function tester(server) {
    var options = {};

    var self = {
      create: function () {
        if (!options.server) {
          self.withFooServer();
        }
        if (!options.socket) {
          self.withStubTarget();
        }

        return server.create(options);
      },
      withFooServer: function () {
        options.server = library.fooServer();
        return self;
      },
      withStubTarget: function () {
        options.socket = library.stubSocket();
        return self;
      },
      options: options
    };

    return self;
  },
  target: function tester(target) {
    var options = {};

    var self = {
      create: function () {
        if (!options.client) {
          self.withFooClient();
        }
        if (!options.socket) {
          self.withStubSocket();
        }

        return target.create(options);
      },
      withFooClient: function () {
        options.client = library.fooClient();
        return self;
      },
      withStubSocket: function () {
        options.socket = library.stubSocket();
        return self;
      },
      options: options
    };

    return self;
  }

}