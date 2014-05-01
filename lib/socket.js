/**
 * Created by jdean on 4/13/14.
 */
'use strict';
var es5Class = require('es5class');

function chunkData(write, data) {

   var dataIndexOfEol = data.indexOf('\n');
   if (dataIndexOfEol === -1) {
      // Have not received an EOL, so hold on to message until we do.
      return data;
   } else if (dataIndexOfEol !== (data.length - 1)) {
      // EOL is not at EOS, so process message(s) and save rest

      // Send each chunk
      var chunks = data.split('\n');

      chunks.slice(0, -1).forEach(function (chunk) {
         write(chunk + '\n');
      });

      // Save the rest
      return chunks.slice(-1)[0];
   } else if (dataIndexOfEol === (data.length -1)) {
      data.split('\n').forEach(function (chunk) {
         if (chunk.length) {
            write(chunk + '\n');
         }
      });
   }
   return "";
}

var LineSocket = exports.LineSocket = es5Class.$define('LineSocket', {
   construct: function (socket) {
      this.setSocket(socket);
      this.setCache('');
   },
   // Property getters/setters
   getSocket: function () {
      return this._socket;
   },
   setSocket: function (socket) {
      this._socket = socket;
   },
   // Property getters/setters
   getCache: function () {
      return this._cache;
   },
   setCache: function (cache) {
      this._cache = cache;
   },
   // Front end for socket interface as used by stratum-proxy
   write: function (data) {
      return this.getSocket().write(data);
   },
   on: function (topic, handler, context) {
      return this.getSocket().on(topic, handler, context);
   },
   off: function (topic, handler, context) {
      return this.getSocket().off(topic, handler, context);
   },
   end: function () {
      return this.getSocket().end();
   }
});


function

var OutgoingLineSocket = exports.OutgoingLineSocket = LineSocket.$define('OutgoingLineSocket', {
   // Front end for socket interface as used by stratum-proxy
   write: function (data) {
      this.setCache(chunkData(function (data) {
         this.getSocket().write(data);
      }.bind(this), this.getCache() + data));
   }
});

exports.createOutgoing = function (socket) {
   return new OutgoingLineSocket(socket);
};

var IncomingLineSocket = exports.IncomingLineSocker = LineSocket.$define('OutgoingLineSocket', {
   construct: function (socket) {
      this.events = new (require('eventemitter3').EventEmitter);
      this.$super(socket);

      this.getSocket().on('data', function (data) {
         this.setCache(chunkData(function (data) {
            this.events.emit('data', data);
         }.bind(this), this.getCache() + data));

      }.bind(this));
   },
   on: function (topic, handler, context) {
      if (topic === 'data') {
         this.events.on(topic, handler, context);
      } else {
         this.$super(topic, handler, context)
      }
   },
   off: function (topic, handler, context) {
      if (topic === 'data') {
         this.events.off(topic, handler, context);
      } else {
         this.$super(topic, handler, context)
      }
   }
});

exports.createIncoming = function (socket) {
   return new IncomingLineSocket(socket);
};