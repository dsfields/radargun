'use strict';

const sieveOfErathosthenes = require('../eratosthenes');
const sieveOfSundaram = require('../sundaram');

const limit = 10000;

bench(
  [
    {
      fn: sieveOfErathosthenes,
      params: [limit],
    },
    {
      fn: sieveOfSundaram,
      params: [limit],
    },
  ],
  { runs: 1000 }
);
