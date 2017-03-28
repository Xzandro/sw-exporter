const crypto = require('crypto');
const zlib = require('zlib');
const encryptkey = require(`./binaries/key-${process.platform}-${process.arch}`);

module.exports = {
  decrypt_request: (text) => {
    return JSON.parse(decrypt(text));
  },
  decrypt_response: (text) => {
    return JSON.parse(zlib.inflateSync(Buffer.from(decrypt(text), 'latin1')));
  }
};

function decrypt(text) {
  const key = encryptkey.key();
  const algorithm = 'aes-128-cbc';

  var decipher = crypto.createDecipheriv(algorithm, key, '\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00');
  var dec = decipher.update(text,'base64','latin1');
  dec += decipher.final('latin1');

  return dec;
}
