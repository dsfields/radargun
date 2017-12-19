'use strict';

const { assert } = require('chai');

const bench = require('../../lib/bench');
const { ThresholdError } = require('../../lib/errors');


function wait(ms) {
  const start = process.hrtime();
  let elapsed = 0;
  while (elapsed < ms) {
    const end = process.hrtime(start);
    elapsed = ((end[0] * 1e9) + end[1]) / 1e6;
  }
}


describe('bench', function() {
  it('throws if functions not array', function() {
    assert.throws(() => {
      bench(42);
    }, TypeError);
  });

  it('throws if functions entry not function or object', function() {
    assert.throws(() => {
      bench([42]);
    }, TypeError);
  });

  it('throws if function entry fn not function', function() {
    assert.throws(() => {
      bench([
        {
          fn: 42,
        },
      ]);
    }, TypeError);
  });

  it('throws if function entry label not string', function() {
    assert.throws(() => {
      bench([
        {
          fn: () => { wait(50); },
          label: 42,
        },
      ]);
    }, TypeError);
  });

  it('throws if function entry params not array', function() {
    assert.throws(() => {
      bench([
        {
          fn: () => { wait(50); },
          params: 42,
        },
      ]);
    }, TypeError);
  });

  it('throws if options not object', function() {
    assert.throws(() => {
      bench([() => { wait(50); }], 42);
    }, TypeError);
  });

  it('throws if options.reporter not function', function() {
    assert.throws(() => {
      bench([() => { wait(50); }], { reporter: 42 });
    }, TypeError);
  });

  it('throws if options.runs not not integer', function() {
    assert.throws(() => {
      bench([() => { wait(50); }], { runs: 'foo' });
    }, TypeError);
  });

  it('throws if options.stream not stream', function() {
    assert.throws(() => {
      bench([() => { wait(50); }], { stream: 42 });
    }, TypeError);
  });

  it('does not throw if options not provided', function() {
    assert.doesNotThrow(() => {
      bench([() => { wait(50); }]);
    }, TypeError);
  });

  it('does not throw if options.thresholds not provided', function() {
    assert.doesNotThrow(() => {
      bench([() => { wait(50); }], {});
    }, TypeError);
  });

  it('throws if options.thresholds not object', function() {
    assert.throws(() => {
      bench([() => { wait(50); }], { thresholds: 42 });
    }, TypeError);
  });

  it('throws if options.thresholds.avg not number', function() {
    assert.throws(() => {
      bench([() => { wait(50); }], { thresholds: { avg: 'foo' } });
    }, TypeError);
  });

  it('throws if options.thresholds.max not number', function() {
    assert.throws(() => {
      bench([() => { wait(50); }], { thresholds: { max: 'foo' } });
    }, TypeError);
  });

  it('throws if options.thresholds.min not number', function() {
    assert.throws(() => {
      bench([() => { wait(50); }], { thresholds: { min: 'foo' } });
    }, TypeError);
  });

  it('throws if options.thresholds.target not integer', function() {
    assert.throws(() => {
      bench([() => { wait(50); }], { thresholds: { target: 'foo' } });
    }, TypeError);
  });

  it('throws if options.thresholds.target less than 0', function() {
    assert.throws(() => {
      bench([() => { wait(50); }], { thresholds: { target: -42 } });
    }, TypeError);
  });

  it('returns array', function() {
    const actual = bench([() => { wait(50); }]);
    assert.isArray(actual);
  });

  it('returns array with entry for each function', function() {
    const actual = bench([
      function test1() { wait(50); },
      function test2() { wait(30); },
    ]);

    assert.lengthOf(actual, 2);
  });

  it('returns array metrics for each function', function() {
    const actual = bench([
      function test1() { wait(50); },
      function test2() { wait(30); },
    ]);

    const actual0 = actual[0];
    assert.isString(actual0.label);
    assert.isNumber(actual0.avg);
    assert.isNumber(actual0.max);
    assert.isNumber(actual0.min);

    const actual1 = actual[1];
    assert.isString(actual1.label);
    assert.isNumber(actual1.avg);
    assert.isNumber(actual1.max);
    assert.isNumber(actual1.min);
  });

  it('throws if given threshold for avg not met', function() {
    assert.throws(() => {
      bench(
        [
          function test1() { wait(50); },
          function test2() { wait(30); },
        ],
        {
          thresholds: {
            avg: 1.0,
            max: -1.0,
            min: -1.0,
            target: 0,
          },
        }
      );
    }, ThresholdError);
  });

  it('throws if given threshold for min not met', function() {
    assert.throws(() => {
      bench(
        [
          function test1() { wait(50); },
          function test2() { wait(30); },
        ],
        {
          thresholds: {
            avg: -1.0,
            max: -1.0,
            min: 1.0,
            target: 0,
          },
        }
      );
    }, ThresholdError);
  });

  it('throws if given threshold for max not met', function() {
    assert.throws(() => {
      bench(
        [
          function test1() { wait(50); },
          function test2() { wait(30); },
        ],
        {
          thresholds: {
            avg: -1.0,
            max: 1.0,
            min: -1.0,
            target: 0,
          },
        }
      );
    }, ThresholdError);
  });

  it('throws if derived threshold for avg not met', function() {
    assert.throws(() => {
      bench(
        [
          {
            label: 'test1',
            fn: wait,
            params: [50],
          },
          {
            label: 'test1',
            fn: wait,
            params: [30],
          },
        ],
        {
          thresholds: {
            avg: null,
            max: -1.0,
            min: -1.0,
            target: 0,
          },
        }
      );
    }, ThresholdError);
  });

  it('throws if derived threshold for max not met', function() {
    assert.throws(() => {
      bench(
        [
          {
            label: 'test1',
            fn: wait,
            params: [50],
          },
          {
            label: 'test1',
            fn: wait,
            params: [30],
          },
        ],
        {
          thresholds: {
            avg: -1.0,
            max: null,
            min: -1.0,
            target: 0,
          },
        }
      );
    }, ThresholdError);
  });

  it('throws if derived threshold for min not met', function() {
    assert.throws(() => {
      bench(
        [
          {
            label: 'test1',
            fn: wait,
            params: [50],
          },
          {
            label: 'test1',
            fn: wait,
            params: [30],
          },
        ],
        {
          thresholds: {
            avg: -1.0,
            max: -1.0,
            min: null,
            target: 0,
          },
        }
      );
    }, ThresholdError);
  });

  it('does not throw if given threshold for avg is met', function() {
    assert.doesNotThrow(() => {
      bench(
        [
          {
            label: 'test1',
            fn: wait,
            params: [50],
          },
          {
            label: 'test1',
            fn: wait,
            params: [30],
          },
        ],
        {
          thresholds: {
            avg: 0.2,
            max: -1.0,
            min: -1.0,
            target: 1,
          },
        }
      );
    }, ThresholdError);
  });

  it('does not throw if given threshold for max is met', function () {
    assert.doesNotThrow(() => {
      bench(
        [
          {
            label: 'test1',
            fn: wait,
            params: [50],
          },
          {
            label: 'test1',
            fn: wait,
            params: [30],
          },
        ],
        {
          thresholds: {
            avg: -1.0,
            max: 0.2,
            min: -1.0,
            target: 1,
          },
        }
      );
    }, ThresholdError);
  });

  it('does not throw if given threshold for min is met', function () {
    assert.doesNotThrow(() => {
      bench(
        [
          {
            label: 'test1',
            fn: wait,
            params: [50],
          },
          {
            label: 'test1',
            fn: wait,
            params: [30],
          },
        ],
        {
          thresholds: {
            avg: -1.0,
            max: -1.0,
            min: 0.2,
            target: 1,
          },
        }
      );
    }, ThresholdError);
  });

  it('does not throw if derived threshold for avg is met', function () {
    assert.doesNotThrow(() => {
      bench(
        [
          {
            label: 'test1',
            fn: wait,
            params: [50],
          },
          {
            label: 'test1',
            fn: wait,
            params: [30],
          },
        ],
        {
          thresholds: {
            avg: null,
            max: -1.0,
            min: -1.0,
            target: 1,
          },
        }
      );
    }, ThresholdError);
  });

  it('does not throw if derived threshold for max is met', function () {
    assert.doesNotThrow(() => {
      bench(
        [
          {
            label: 'test1',
            fn: wait,
            params: [50],
          },
          {
            label: 'test1',
            fn: wait,
            params: [30],
          },
        ],
        {
          thresholds: {
            avg: -1.0,
            max: null,
            min: -1.0,
            target: 1,
          },
        }
      );
    }, ThresholdError);
  });

  it('does not throw if derived threshold for min is met', function () {
    assert.doesNotThrow(() => {
      bench(
        [
          {
            label: 'test1',
            fn: wait,
            params: [50],
          },
          {
            label: 'test1',
            fn: wait,
            params: [30],
          },
        ],
        {
          thresholds: {
            avg: -1.0,
            max: -1.0,
            min: null,
            target: 1,
          },
        }
      );
    }, ThresholdError);
  });
});
