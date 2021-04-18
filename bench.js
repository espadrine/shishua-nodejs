const shishua = require('./main');
const random = require('random');
const seedrandom = require('seedrandom');

// Classic usage.
console.time('Math.random: 10M floats');
for (let i = 0; i < 1e7; i++)
random.float();
console.timeEnd('Math.random: 10M floats');
random.use(shishua('flowers'));
console.time('SHISHUA: 10M floats');
for (let i = 0; i < 1e7; i++)
random.float();
console.timeEnd('SHISHUA: 10M floats');

// Buffer filling.
const arng = seedrandom.alea();
const prng = shishua(Buffer.alloc(32));
const buffer = Buffer.alloc(1 << 30);
console.time('Math.random fills a 1G buffer');
for (let i = 0; i < buffer.length; i += 4) {
  const r = Math.random() * 0x100000000;
  buffer[i + 0] = r >>>  0;
  buffer[i + 1] = r >>>  8;
  buffer[i + 2] = r >>> 16;
  buffer[i + 3] = r >>> 24;
}
console.timeEnd('Math.random fills a 1G buffer');
console.time('Alea fills a 1G buffer');
for (let i = 0; i < buffer.length; i += 4) {
  const r = arng.int32();
  buffer[i + 0] = r >>>  0;
  buffer[i + 1] = r >>>  8;
  buffer[i + 2] = r >>> 16;
  buffer[i + 3] = r >>> 24;
}
console.timeEnd('Alea fills a 1G buffer');
console.time('SHISHUA fills a 1G buffer');
prng.fill(buffer);
console.timeEnd('SHISHUA fills a 1G buffer');
