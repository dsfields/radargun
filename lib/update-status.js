'use strict';

const readline = require('readline');


/**
 * Renders the progress bar.
 *
 * @param {number} runCount
 * @param {number} totalRuns
 */
function updateStatus(runCount, totalRuns, stream) {
  if (runCount % 10 !== 0) return;

  const percent = Math.floor((runCount / totalRuns) * 100);
  const blocks = Math.floor(percent / 2);
  const empty = 50 - blocks;
  const value =
    '|'
    + '\u2588'.repeat(blocks)
    + '\u2591'.repeat(empty)
    + '| '
    + percent.toString()
    + '% || '
    + runCount.toString()
    + ' / '
    + totalRuns.toString();

  readline.cursorTo(stream, 0, null);
  stream.write(value);

  if (percent === 100) stream.write('\n\n');
}


module.exports = updateStatus;
