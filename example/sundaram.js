/* eslint-disable no-bitwise */

'use strict';

function sieveOfSundaram(max) {
  const primes = [2];
  const sieve = Array(max).fill(true);
  const upper = max / 2;
  let denom = 0;
  let mval = 0;

  for (let i = 1; i < upper; i++) {
    denom = (i << 1) + 1;
    mval = (max - i) / denom;
    for (let j = i; j <= mval; j++) {
      sieve[i + (j * denom)] = false;
    }
  }

  for (let i = 1; i < upper; i++) {
    if (sieve[i]) primes.push((i << 1) + 1);
  }

  return primes;
}


module.exports = sieveOfSundaram;
