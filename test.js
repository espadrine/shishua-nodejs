const shishua = require('./main');
const assert = require('assert/strict');

// Initialization.

{
  const prng = shishua(Buffer.alloc(32));
  assert.equal(prng.int32(), 4187381141, 'Buffer initialization');
}

{
  const prng = shishua('string seed');
  assert.equal(prng.int32(), 2548023054, 'String initialization');
  assert.equal(shishua('').int32(), 2167577206, 'Empty string initialization');
}

{
  const prng1 = shishua(), prng2 = shishua();
  assert.notEqual(prng1.int32(), prng2.int32(), 'Random initialization');
}

// Buffer filling.

{
  const buffer = Buffer.alloc(128);
  shishua('').fill(buffer);
  assert.equal(buffer.toString('base64'),
    'dpoygZyuS50zwdMPneMTyo0Wd9Secb0vUo5JbmaAZlRixyoBNN+1GA838AHu/mg0QwEVbUMfxuq+vYG5cwUzq2hUddC2/PJJ+UGc5MW3crDGrEi3bS30Te1FObOMM0EL+EQbWgtuc1q4dG6DKwIv/pnmJz26KJx1wEGbK0ZiUdM=',
    'Buffer filling, 128-byte aligned');
}

{
  const buffer = Buffer.alloc(129);
  shishua('').fill(buffer);
  assert.notEqual(buffer[buffer.length-1], 0,
    'Buffer filling, beyond 128-byte misalignment');
  assert.equal(buffer.toString('base64'),
    'dpoygZyuS50zwdMPneMTyo0Wd9Secb0vUo5JbmaAZlRixyoBNN+1GA838AHu/mg0QwEVbUMfxuq+vYG5cwUzq2hUddC2/PJJ+UGc5MW3crDGrEi3bS30Te1FObOMM0EL+EQbWgtuc1q4dG6DKwIv/pnmJz26KJx1wEGbK0ZiUdO5',
    'Buffer filling, not 128-byte aligned');
}

{
  const buffer = Buffer.alloc((1 << 17) + 127);
  shishua('').fill(buffer);
  assert.equal(buffer.slice(1 << 17).toString('base64'),
    'Yq+8pK2lYANvWWDiVvIE6utKTz0RDLS14RXgWBhQGmHpNYfSiQ67nr4Z6GaSSBvzjBx6qcC33Y+jSYyCb5IhTU6CknNP4HxCxCegB5xHoF1UeyEtDRl0J53RkCfpuxQ5+r79Tr3djXkmG09lEzOucvIqP/LLXOruwrmGC7GuyQ==',
    'Buffer filling, beyond internal buffer size');
}

// Number generation.

{
  const prng = shishua('');
  assert.equal(prng.int32(), 2167577206, 'int32');
  assert.equal(prng.double(), 0.6144360668531931, 'int32');
  assert.equal(prng.quick(), 0.7893659838009626, 'int32');
}
