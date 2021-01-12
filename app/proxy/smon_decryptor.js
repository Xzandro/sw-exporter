const crypto = require('crypto');
const zlib = require('zlib');

const encryptkey = require(`./binaries/key-${process.platform}-${process.arch}`);

function decrypt(text) {
  const key = encryptkey.key();
  const algorithm = 'aes-128-cbc';

  let decipher = crypto.createDecipheriv(algorithm, key, '\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00');
  let dec = decipher.update(text, 'base64', 'latin1');
  dec += decipher.final('latin1');

  return dec;
}

module.exports = {
  decrypt_request: (text) => JSON.parse(decrypt(text)),
  decrypt_response: (text) => JSON.parse(zlib.inflateSync(Buffer.from(decrypt(text), 'latin1'))),
};
