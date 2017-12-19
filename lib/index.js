'use strict';

const bench = require('./bench');
const errors = require('./errors');


/**
 * Easy to use benchmarking utility for Node.js. Provides high-precision
 * execution time metrics for: average, min, and max.
 *
 * @module kesselrun
 *
 * @prop {object} errors - References to error types thrown by kesselrun
 * @prop {function} ThresholdError - Thrown when target thresholds are not met
 */
module.exports =
{
  /**
   * @method bench
   */
  bench,

  errors,
};
