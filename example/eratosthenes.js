'use strict';

function sieveOfErathosthenes(max) {
  const primes = [];
  const sieve = Array(max).fill(true);
  const upper = Math.sqrt(max);

  for (let i = 2; i < upper; i++) {
    if (!sieve[i]) continue;
    for (let j = i * 2; j < max; j += i) {
      sieve[j] = false;
    }
  }

  for (let i = 2; i < max; i++) {
    if (sieve[i]) primes.push(i);
  }

  return primes;
}


module.exports = sieveOfErathosthenes;
