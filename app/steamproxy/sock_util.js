'use strict';

const net = require('net');

/**
 *
 * @param {net.Socket} socket
 * @param {String} separator
 */
function readUntil(socket, separator) {
  // This is definitely not the best implementation,
  // you can make it more efficient if you have nothing better to do
  return new Promise((resolve, reject) => {
    const result = [];
    function readUntilInner() {
      let data = socket.read(1);
      while (data !== null) {
        result.push(data);
        if (data.toString() === separator) {
          resolve(Buffer.concat(result).toString());
          return;
        }
        data = socket.read(1);
      }
      if (socket.destroyed) {
        reject("Can't read line: connection closed");
        return;
      }
      setTimeout(readUntilInner, 5);
    }
    readUntilInner();
  });
}

module.exports = { readUntil: readUntil };
