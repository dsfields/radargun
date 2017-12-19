'use strict';

const { assert } = require('chai');

const MockStream = require('../mocks/mock-stream');
const updateStatus = require('../../lib/update-status');


describe('updateStatus', function() {
  it('does not update stream if runCount not a factor of 10', function() {
    const stream = new MockStream();
    updateStatus(5, 100, stream);
    assert.isFalse(stream.writeCalled);
  });

  it('updates stream with status', function() {
    const expected = '\u001b[1G|█████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| 10% || 10 / 100';
    const stream = new MockStream();
    updateStatus(10, 100, stream);
    assert.strictEqual(stream.value, expected);
  });

  it('writes double space when finished', function() {
    const expected = '\u001b[1G|██████████████████████████████████████████████████| 100% || 100 / 100\n\n';
    const stream = new MockStream();
    updateStatus(100, 100, stream);
    assert.strictEqual(stream.value, expected);
  });
});
