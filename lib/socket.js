/**
 * Created by jdean on 4/13/14.
 */


exports.create = function (socket) {
  var cache = '';

  var self = {
    write: function (data) {
      // Restore any cached data
      data = cache + data;
      var dataIndexOfEol = data.indexOf('\n');
      if (dataIndexOfEol === -1) {
        // Have not received an EOL, so hold on to message until we do.
        cache = data;
      } else if (dataIndexOfEol !== (data.length - 1)) {
        // EOL is not at EOS, so process message(s) and save rest

        // Send each chunk
        var chunks = data.split('\n');

        chunks.slice(0, -1).forEach(function (chunk) {
          socket.write(chunk + '\n');
        });

        // Save the rest
        cache = chunks.slice(-1)[0];
      } else if (dataIndexOfEol === (data.length -1)) {
        data.split('\n').forEach(function (chunk) {
          if (chunk.length) {
            socket.write(chunk + '\n');
          }
        });
      }
    },
    on: function () {
      socket.on.apply(this, arguments);
    },
    off: function () {
      socket.off.apply(this, arguments);
    },
    end: function () {
      socket.end.apply(this, arguments);
    }
  };

  return self;
};