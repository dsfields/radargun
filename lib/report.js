'use strict';

const elv = require('elv');


//
// TYPE DEFINITIONS
//


/**
 * @typedef Dimensions
 * @type {object}
 * @prop {number} name
 * @prop {number} avg
 * @prop {number} min
 * @prop {number} max
 */


//
// CONSTANTS
//


const UNIT = ' ns';
const HIGHLIGHT = '\u001b[7m'; // inverse
const BOLD = '\u001b[1m';
const RESET = '\u001b[0m';
const BORDER_VERT = '│';
const BORDER_HORZ = '─';
const BORDER_DBL_HORZ = '═';
const BORDER_RD = '┌';
const BORDER_LD = '┐';
const BORDER_RU = '└';
const BORDER_LU = '┘';
const BORDER_LRD = '┬';
const BORDER_LRUD = '┼';
const BORDER_LRU = '┴';
const BORDER_RUD = '├';
const BORDER_LUD = '┤';
const BORDER_UD_DBL_R = '╞';
const BORDER_UD_DBL_L = '╡';
const BORDER_UD_DBL_LR = '╪';


//
// TABLE HELPERS
//


/**
 * A String.prototype.padEnd shim.
 *
 * @param {string} str
 * @param {number} length
 */
function padEnd(str, length) {
  /* istanbul ignore next */
  if (str.length >= length) return str;
  return str + ' '.repeat(length - str.length);
}


/**
 * Calculate the number of digits in an integer in base10.
 *
 * @param {number} num
 *
 * @returns {number}
 */
function numDigits(num) {
  return Math.floor(Math.log10(num) + 1);
}


/**
 * Calculates table cell dimensions.
 *
 * @param {@link FunctionMetrics[]} metrics
 *
 * @returns {Dimensions}
 */
function tableDimensions(metrics) {
  const pointPad = UNIT.length + 2;
  let name = 6;
  let point = 5;

  for (let i = 0; i < metrics.length; i++) {
    const metric = metrics[i];
    name = Math.max(name, metric.label.length + 2);
    point = Math.max(
      point,
      numDigits(metric.avg) + pointPad,
      numDigits(metric.min) + pointPad,
      numDigits(metric.max) + pointPad
    );
  }

  return {
    name,
    avg: point,
    min: point,
    max: point,
  };
}


/**
 * Creates a row divider for the given dimensions of a specific type.
 *
 * @param {Dimensions} dimensions
 * @param {('top'|'bottom'|'header'|'row')} type
 *
 * @returns {string}
 */
function divider(dimensions, type) {
  let left = BORDER_RUD;
  let right = BORDER_LUD;
  let line = BORDER_HORZ;
  let joint = BORDER_LRUD;

  switch (type) {
    case 'top':
      left = BORDER_RD;
      right = BORDER_LD;
      joint = BORDER_LRD;
      break;

    case 'bottom':
      left = BORDER_RU;
      right = BORDER_LU;
      joint = BORDER_LRU;
      break;

    case 'header':
      left = BORDER_UD_DBL_R;
      right = BORDER_UD_DBL_L;
      line = BORDER_DBL_HORZ;
      joint = BORDER_UD_DBL_LR;
      break;

    default: break;
  }

  const {
    name,
    avg,
    min,
    max,
  } = dimensions;

  return left
    + line.repeat(name)
    + joint
    + line.repeat(avg)
    + joint
    + line.repeat(min)
    + joint
    + line.repeat(max)
    + right
    + '\n';
}


/**
 * Generates the header for a report table.
 *
 * @param {Dimensions} dimensions
 *
 * @returns {string}
 */
function header(dimensions) {
  return divider(dimensions, 'top')
    + BORDER_VERT
    + BOLD + padEnd(' NAME', dimensions.name) + RESET
    + BORDER_VERT
    + BOLD + padEnd(' AVG', dimensions.avg) + RESET
    + BORDER_VERT
    + BOLD + padEnd(' MIN', dimensions.min) + RESET
    + BORDER_VERT
    + BOLD + padEnd(' MAX', dimensions.max) + RESET
    + BORDER_VERT
    + '\n'
    + divider(dimensions, 'header');
}


/**
 * Generates a report table row.
 *
 * @param {@link FunctionMetrics} metric
 * @param {Dimensions} dimensions
 * @param {boolean} isTarget
 *
 * @returns {string}
 */
function row(metric, dimensions, isTarget) {
  let left = '';
  let right = '';

  if (isTarget) {
    left = HIGHLIGHT;
    right = RESET;
  }

  return BORDER_VERT
    + left + padEnd(' ' + metric.label, dimensions.name) + right
    + BORDER_VERT
    + left + padEnd(' ' + metric.avg + UNIT, dimensions.avg) + right
    + BORDER_VERT
    + left + padEnd(' ' + metric.min + UNIT, dimensions.min) + right
    + BORDER_VERT
    + left + padEnd(' ' + metric.max + UNIT, dimensions.max) + right
    + BORDER_VERT
    + '\n';
}


//
// REPORTER
//


/**
 * Generates a report table.
 *
 * @param {@link Stream} stream
 * @param {@link FunctionMetrics[]} metrics
 * @param {@link Thresholds} thresholds
 */
function report(stream, metrics, thresholds) {
  const target = (!elv(thresholds)) ? -1 : thresholds.target;
  const dimensions = tableDimensions(metrics);
  const border = divider(dimensions);
  let value = header(dimensions);

  for (let i = 0; i < metrics.length; i++) {
    if (i > 0) value += border;
    const metric = metrics[i];
    value += row(metric, dimensions, i === target);
  }

  value += divider(dimensions, 'bottom');
  value += '\n';

  stream.write(value);
}


module.exports = report;
