'use strict';

const array = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
];

const set = new Set(array);

const value = 't';

bench(
  [
    {
      fn: function benchArrayIndexOf() {
        return array.indexOf(value) > -1;
      },
    },
    {
      fn: function benchSetHas() {
        return set.has(value);
      },
    },
  ],
  { runs: 1000 }
);
