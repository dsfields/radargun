/* eslint-disable import/no-dynamic-require, global-require */

'use strict';

const { ThresholdError } = require('../lib/errors');
global.bench = require('../lib/bench');

const filePath = process.argv[2];

console.log(`\n\u001b[1m${filePath}\u001b[0m\n`);

try {
  require(filePath);
  process.exit(0);
} catch (err) {
  if (err instanceof ThresholdError) {
    console.log('\u001b[31mBenchmark run failed to meet thresholds\u001b[0m\n');
    process.exit(3);
  } else {
    throw err;
  }
}
