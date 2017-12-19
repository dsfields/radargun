'use strict';


/**
 * Thrown when a target function fails to meet defined performance thresholds.
 *
 * @extends {Error}
 */
class ThresholdError extends Error {
  constructor() {
    super();
    Error.captureStackTrace(this, ThresholdError);
    this.message = 'Target function did not meet performance thresholds';
    this.name = 'ThresholdError';
  }
}


module.exports = { ThresholdError };
