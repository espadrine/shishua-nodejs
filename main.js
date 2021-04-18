const addon = require('./build/Release/addon.node');
const crypto = require('crypto');

const BUFSIZE = 1 << 17;

class PRNG {
  constructor(seed) {
    this.internalSeed =
      (seed instanceof Buffer)? seed:
      (typeof seed === 'string')?
        crypto.createHash('sha512').update(seed).digest().slice(0, 32):
      crypto.randomBytes(32);
    this.state = addon.init(this.internalSeed);
    this.buffer = Buffer.alloc(BUFSIZE);
    this.fillBuffer();
  }

  fillBuffer() {
    addon.generate(this.state, this.buffer);
    this.index = 0;
  }

  fill(buffer) {
    if (buffer.length & (128-1) === 0) {
      // The buffer is a multiple of 128:
      // fast-path by bringing our own buffer.
      addon.generate(this.state, buffer);
    } else {
      let copied = this.buffer.copy(buffer, this.index);
      this.index += copied;
      while (copied < buffer.length) {
        this.fillBuffer();
        let n = this.buffer.copy(buffer, 0);
        copied += n;
        this.index += n;
      }
    }
  }

  uint32() {
    let prevIndex = this.index;
    this.index += 4;
    if (this.index >= BUFSIZE) {
      this.fillBuffer();
      prevIndex = 0;
    }
    return this.buffer.readUInt32LE(prevIndex);
  }

  // Returns a random number between 0 included and 1.
  double() {
    var prevIndex = this.index;
    this.index += 8;
    if (this.index >= BUFSIZE) {
      this.fillBuffer();
      prevIndex = 0;
    }
    var r0 = this.buffer.readUInt32LE(prevIndex);
    var r1 = this.buffer.readUInt32LE(prevIndex + 4);
    return r0             /      0x100000000 +
          (r1 & 0x1fffff) / 0x20000000000000;
  }
}

// We target compatibility with the seedrandom package.
//
// seed: a String or Buffer.
function seedrandom(seed, options = {}, callback) {
  // If requesting to "add entropy" to the pool,
  // we just rely on the system's cryptographic pool.
  if (options.entropy) { seed = null; }
  const prng = new PRNG(seed);

  const double = prng.double.bind(prng);
  double.int32 = prng.uint32.bind(prng);
  double.quick = function() {
    return prng.uint32() / 0x100000000;
  };
  double.double = double;
  double.fill = prng.fill.bind(prng);

  if (callback) {
    return callback(double, prng.internalSeed, this, options.state);
  }
  return double;
}

module.exports = seedrandom;
