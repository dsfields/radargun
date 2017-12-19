'use strict';

const elv = require('elv');

const defaultReporter = require('./report');
const { ThresholdError } = require('./errors');
const updateStatus = require('./update-status');


//
// CONSTANTS
//


const NS_PER_SEC = 1e9;


//
// TYPE DOCUMENTATION
//


/**
 * @typedef FunctionConfiguration
 * @type {object}
 * @prop {*} bind
 * @prop {function} fn
 * @prop {string} label
 * @prop {*[]} params
 */


/**
 * @typedef Thresholds
 * @type {object}
 * @prop {number} avg
 * @prop {number} max
 * @prop {number} min
 * @prop {number} target
 */


/**
 * @typedef Stream
 * @type {object}
 * @prop {function} write
 */


/**
 * @typedef BenchOptions
 * @type {object}
 * @prop {function} reporter
 * @prop {number} runs
 * @prop {Stream} stream
 * @prop {Thresholds} thresholds
 */


/**
 * @typedef FunctionMetrics
 * @type {object}
 * @prop {number} avg
 * @prop {string} label
 * @prop {number} max
 * @prop {number} min
 */


//
// ERROR MESSAGES
//


/**
 * Defines error messages used by bench.
 */
const msg = {
  argFuncArray: 'Argument "functions" must be an array',
  argFuncItem: 'Argument "functions" must contain functions or objects',
  argFuncFn: 'The "fn" function obj key must be a function',
  argFuncLabel: 'The "label" function obj key must be a string if provided',
  argFuncParams: 'The "params" function obj key must be an array if provided',
  argOptimize: 'The "options.optimize" param must be a Boolean if provided',
  argReporter: 'The "options.reporter" param must be a function if provided',
  argRuns: 'The "options.runs" param must be a positive integer if provided',
  argThresholds: 'The "options.thresholds" param must be an object if provided',
  argAvg: 'The "options.thresholds.avg" param must be a number if provided',
  argMax: 'The "options.thresholds.max" param must be a number if provided',
  argMin: 'The "options.thresholds.min" param must be a number if provided',
  argStream: 'The "options.stream" param must be a writable stream if provided',
  argTarget: 'The "options.thresholds.target" param must be a positive integer',
};


//
// ASSERTION FUNCTIONS
//


/**
 * Validates a given list of functions.  A TypeError is thrown if the input is
 * invalid. Otherwise, an array of normalized {FunctionConfiguration} objects is
 * returned.
 *
 * @param {(function|FunctionConfiguration)[]} functions
 *
 * @returns FunctionConfiguration[]
 */
function assertFunctions(functions) {
  if (!Array.isArray(functions)) {
    throw new TypeError(msg.argFuncArray);
  }

  const funcs = [];

  for (let i = 0; i < functions.length; i++) {
    const item = functions[i];

    if (typeof item === 'object') {
      const bind = elv.coalesce(item.bind, null);
      const { fn } = item;
      const label = elv.coalesce(item.label, fn.name, `anonymous${i}`);
      const params = elv.coalesce(item.params, []);

      if (typeof fn !== 'function') {
        throw new TypeError(msg.argFuncFn);
      }

      if (typeof label !== 'string') {
        throw new TypeError(msg.argFuncLabel);
      }

      if (!Array.isArray(params)) {
        throw new TypeError(msg.argFuncParams);
      }

      funcs.push({
        bind,
        fn,
        label,
        params,
      });

      continue;
    }

    if (typeof item !== 'function') {
      throw new TypeError(msg.argFuncItem);
    }

    funcs.push({
      bind: null,
      fn: item,
      label: elv.coalesce(item.name, `anonymous${i}`),
      params: [],
    });
  }

  return funcs;
}


/**
 * Validates threshold options.  If it is invalid a TypeError is thrown.
 * Otherwise, a normalized thresholds object or null is returned.
 *
 * @param {object} thresholds
 *
 * @returns {object}
 */
function assertThresholds(thresholds) {
  if (!elv(thresholds)) return null;

  if (typeof thresholds !== 'object') {
    throw new TypeError(msg.argThresholds);
  }

  const avg = elv.coalesce(thresholds.avg, false);
  const max = elv.coalesce(thresholds.max, false);
  const min = elv.coalesce(thresholds.min, false);
  const { target } = thresholds;

  if (avg !== false && typeof avg !== 'number') {
    throw new TypeError(msg.argAvg);
  }

  if (max !== false && typeof max !== 'number') {
    throw new TypeError(msg.argMax);
  }

  if (min !== false && typeof min !== 'number') {
    throw new TypeError(msg.argMin);
  }

  if (!Number.isInteger(target) || target < 0) {
    throw new TypeError(msg.argTarget);
  }

  return {
    avg,
    max,
    min,
    target,
  };
}


/**
 * Validates the options provided to the bench method.  If it is invalid a
 * TypeError is thrown. Otherwise a normalized {BenchOptions} object is
 * returned.
 *
 * @param {BenchOptions} options
 *
 * @returns {BenchOptions}
 */
function assertOptions(options) {
  if (!elv(options)) {
    return {
      report: defaultReporter,
      runs: 10,
      stream: process.stdout,
      thresholds: null,
    };
  }

  if (typeof options !== 'object') {
    throw new TypeError();
  }

  const report = elv.coalesce(options.reporter, () => defaultReporter);

  const runs = elv.coalesce(options.runs, 10);
  const stream = elv.coalesce(options.stream, process.stdout);
  const thresholds = assertThresholds(options.thresholds);

  if (typeof report !== 'function') {
    throw new TypeError(msg.argReporter);
  }

  if (!Number.isInteger(runs) || runs < 1) {
    throw new TypeError(msg.argRuns);
  }

  if (typeof stream.write !== 'function') {
    throw new TypeError(msg.argStream);
  }

  return {
    report,
    runs,
    stream,
    thresholds,
  };
}


//
// CHECK THRESHOLDS
//


/**
 * Throws if a given threshold ratio is not met.
 *
 * @param {number} value
 * @param {number} other
 * @param {?number} threshold
 */
function assertThreshold(value, other, threshold) {
  if (!threshold && value > other) throw new ThresholdError();
  const ratio = 1 - (value / other);
  if (ratio < threshold) throw new ThresholdError();
}


/**
 * Validates results of a benchmarking run against a given set of thresholds. If
 * the target function's metrics are outside of the given thresholds, an error
 * is thrown.
 *
 * @param {FunctionMetrics[]} metrics
 * @param {Thresholds} thresholds
 */
function checkThresholds(metrics, thresholds) {
  if (!elv(thresholds)) return;

  const target = metrics[thresholds.target];

  for (let i = 0; i < metrics.length; i++) {
    if (i === thresholds.target) continue;

    const other = metrics[i];
    assertThreshold(target.avg, other.avg, thresholds.avg);
    assertThreshold(target.max, other.max, thresholds.max);
    assertThreshold(target.min, other.min, thresholds.min);
  }
}


//
// BENCHMARKING
//


/**
 * Runs a benchmark analysis for a given array of functions, and generates a
 * report.
 *
 * @param {(function|FunctionConfiguration)[]} functions
 * @param {BenchOptions} options
 *
 * @returns {FunctionMetrics[]}
 */
function bench(functions, options) {
  const funcs = assertFunctions(functions);
  const opts = assertOptions(options);
  const metrics = [];
  const totalRuns = funcs.length * opts.runs;
  let runCount = 0;

  for (let i = 0; i < funcs.length; i++) {
    const func = funcs[i];
    const totals = [0, 0];
    let max = 0;
    let min = Number.MAX_SAFE_INTEGER;

    for (let j = 0; j < opts.runs; j++) {
      const start = process.hrtime();
      func.fn.call(func.bind, func.params);
      const end = process.hrtime(start);

      totals[0] += end[0];
      totals[1] += end[1];

      const ns = (end[0] * NS_PER_SEC) + end[1];
      if (ns > max) max = ns;
      if (ns < min) min = ns;

      updateStatus(++runCount, totalRuns, opts.stream);
    }

    const whole = (totals[0] / opts.runs) * NS_PER_SEC;
    const partial = totals[1] / opts.runs;
    const avg = Math.ceil(whole + partial);

    metrics.push({
      avg,
      label: func.label,
      max,
      min,
    });
  }

  opts.report(opts.stream, metrics, opts.thresholds);
  checkThresholds(metrics, opts.thresholds);

  return metrics;
}


module.exports = bench;
