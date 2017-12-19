'use strict';

/* eslint-disable max-len */

const { assert } = require('chai');

const MockStream = require('../mocks/mock-stream');
const report = require('../../lib/report');


describe('report', function() {
  it('writes report to stream with target highlighting', function() {
    const stream = new MockStream();
    const metrics = [
      {
        label: 'helloWorld',
        avg: 4828290539,
        min: 4,
        max: 999992899903,
      },
      {
        label: 'foo',
        avg: 812,
        min: 23,
        max: 4783993,
      },
    ];
    const thresholds = {
      target: 1,
    };

    report(stream, metrics, thresholds);

    const actual = stream.value;
    const expected =
        '┌────────────┬─────────────────┬─────────────────┬─────────────────┐\n'
      + '│\u001b[1m NAME       \u001b[0m│\u001b[1m AVG             \u001b[0m│\u001b[1m MIN             \u001b[0m│\u001b[1m MAX             \u001b[0m│\n'
      + '╞════════════╪═════════════════╪═════════════════╪═════════════════╡\n'
      + '│ helloWorld │ 4828290539 ns   │ 4 ns            │ 999992899903 ns │\n'
      + '├────────────┼─────────────────┼─────────────────┼─────────────────┤\n'
      + '│\u001b[7m foo        \u001b[0m│\u001b[7m 812 ns          \u001b[0m│\u001b[7m 23 ns           \u001b[0m│\u001b[7m 4783993 ns      \u001b[0m│\n'
      + '└────────────┴─────────────────┴─────────────────┴─────────────────┘\n\n';

    assert.strictEqual(actual, expected);
  });

  it('writes report to stream with target highlighting', function () {
    const stream = new MockStream();
    const metrics = [
      {
        label: 'helloWorld',
        avg: 4828290539,
        min: 4,
        max: 999992899903,
      },
      {
        label: 'foo',
        avg: 812,
        min: 23,
        max: 4783993,
      },
    ];

    report(stream, metrics, null);

    const actual = stream.value;
    const expected =
      '┌────────────┬─────────────────┬─────────────────┬─────────────────┐\n'
      + '│\u001b[1m NAME       \u001b[0m│\u001b[1m AVG             \u001b[0m│\u001b[1m MIN             \u001b[0m│\u001b[1m MAX             \u001b[0m│\n'
      + '╞════════════╪═════════════════╪═════════════════╪═════════════════╡\n'
      + '│ helloWorld │ 4828290539 ns   │ 4 ns            │ 999992899903 ns │\n'
      + '├────────────┼─────────────────┼─────────────────┼─────────────────┤\n'
      + '│ foo        │ 812 ns          │ 23 ns           │ 4783993 ns      │\n'
      + '└────────────┴─────────────────┴─────────────────┴─────────────────┘\n\n';

    assert.strictEqual(actual, expected);
  });
});
