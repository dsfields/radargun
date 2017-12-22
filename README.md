# radargun

[![Build Status](https://secure.travis-ci.org/dsfields/radargun.svg)](https://travis-ci.org/dsfields/radargun)

Easy to use benchmarking utility for Node.js.  Provides high-precision execution time metrics for: average, min, and max.

__Table of Contents__

* [Usage](#usage)
* [API](#api)
* [CLI](#cli)
* [Benchmarking Very Fast Functions](#benchmarking-very-fast-functions)
* [CI Pipelines](#ci-pipelines)
* [Custom Reporter](#custom-reporter)

## Usage

1. Install `radargun` as a dev dependency in your app:

    ```sh
    $ npm install radargun -D
    ```

2. Create a `.bench.js` script with a series of functions to benchmark:

    __benchmark/primes.bench.js__

    The `bench()` function is a method added to the global scope by `radargun`.

    ```js
    bench(
      [
        function sieveOfEratosthenes() {
          // calculate primes to 10000
        },
        function sieveOfSundaram() {
          // calculate primes to 10000
        }
      ],
      { runs: 1000 }
    );
    ```

3. Execute your script with `radargun`:

    ```sh
    $ radargun benchmark/primes.bench.js
    ```

4. Read the results that are printed to the terminal:

    ```sh
    ┌──────────────────────┬────────────┬────────────┬────────────┐
    │ NAME                 │ AVG        │ MIN        │ MAX        │
    ╞══════════════════════╪════════════╪════════════╪════════════╡
    │ sieveOfErathosthenes │ 1492392 ns │ 1337675 ns │ 5455338 ns │
    ├──────────────────────┼────────────┼────────────┼────────────┤
    │ sieveOfSundaram      │ 802019 ns  │ 688149 ns  │ 3883506 ns │
    └──────────────────────┴────────────┴────────────┴────────────┘
    ```

## API

### `bench(functions [, options])`

Runs a benchmark analysis for a given array of functions, and generates a report.

#### Parameters

* `functions`: _(required)_ an array of functions for which to gather performance metrics.  Each function generates its own set of metrics.  Every entry in the array must be a function or an object with the following keys:

  + `bind`: _(optional)_ the `this` context to use while executing the function.  The default is `null`.

  + `fn`: _(required)_ a reference to the function to execute.

  + `label`: _(optional)_ the label to use for this function in the generated report.  The default is the name of the function.

  + `params`: _(optional)_ an array of values to pass into the function.

* `options`: _(optional)_ an object containing keys to customize the behavior of `bench()`.  This object can have the following keys:

  + `reporter`: _(optional)_ a function that is responsible for generating the report.  The default is the built-in reporter.  See [Custom Reporter](#custom-reporter) for more information.

  + `runs`: _(optional)_ the number of times to execute the function.  The default is `10`.

  + `stream`: _(optional)_ a [writable stream](https://nodejs.org/api/stream.html#stream_writable_streams) to which status and report information is written.  The default is `process.stdout`.

  + `thresholds`: _(optional)_ an object that sets performance thresholds for a target function.  A failure to stay within these thresholds will cause the `radargun` utility to exit with `3`.

    All metric thresholds are expressed as a percentage of performance, between the target function and all others (`1 - target/other`) that the target function must meet or exceed.

    - `avg`: _(optional)_ a number specifying the percentage threshold for "average."  If omitted, the target's "avg" metric must simply be less than or equal to all other functions.

    - `max`: _(optional)_ a number specifying the percentage threshold for "max."  If omitted, the target's "max" metric must simply be less than or equal to all other functions.

    - `min`: _(optional)_ a number specifying the percentage threshold for "min."  If omitted, the target's "min" metric must simply be less than or equal to all other functions.

    - `target`: _(required)_ the target function who's benchmark metrics must fall within all specified performance thresholds.  This value is a number specifying an index in the `functions` array.

#### Example

```js
const comparisonModule = require('comparison-module');
const fs = require('fs');

const myModule = require('../lib');

const params = ['foo', 'bar'];
const stream = fs.createWriteStream('results.txt');

bench(
  [
    {
      fn: myModule,
      label: 'My Module',
      params,
    },
    {
      fn: comparisonModule,
      label: 'Comparison Module',
      params,
    },
  ],
  {
    runs: 1000,
    stream,
    thresholds: {
      avg: 0.5,
      max: 0.5,
      min: 0.5,
      target: 0,
    },
  }
);
```

In this example, we are comparing the performance of "My Module" against the performance of `comparison-module`.  If My Module's performance is less than 50% greater than that of `comparison-module`, `radargun` exits with error code 3.  Results are writen to a file "results.txt."

## CLI

The `radargun` command line interface takes a single parameter, which is a [glob](https://en.wikipedia.org/wiki/Glob_(programming)) that specifies how to find bench files to run.

```sh
$ radargun benchmark/**/*.bench.js
```

## Benchmarking Very Fast Functions

In situations where you need to benchmark very fast functions, you get a more accurate understanding of performance by wrapping what it is you want to test in a function, and execute your function in a loop.

```js
bench(
  [
    function () {
      for (let i = 0; i < 1000000) {
        myVeryFastFunction();
      }
    }
  ],
  { runs: 100 }
);
```

## CI Pipelines

It's possible to use `radargun` in a continuous integration pipeline, and fail a build in the event that a new version of your code sees an unacceptable drop in performance.

__Example__

```js
const myCurrentModule = require('my-module');
const myUpdatedModule = require('../lib');

bench(
  [
    {
      fn: myUpdatedModule,
      label: 'New Hotness',
      params: ['foo', 'bar'],
    },
    {
      fn: myCurrentModule,
      label: 'Currently Published',
      params: ['foo', 'bar'],
    },
  ],
  {
    runs: 1000,
    thresholds: {
      avg: -0.08,
      max: -0.08,
      min: -0.08,
      target: 0,
    },
  }
);
```

In this example, we are comparing the performance of the implementation of `my-module` in the local code base against the published version of `my-module`.  Thresholds are set such that if there is a drop in performance of more than 8%, the `radargun` utility will exit with an error.

Keep in mind that benchmarking is non-deterministic.  It's possible that, depending on conditions with the host, `radargun` could fail with a false negative.  It is recommended that you do some experimentation before settling on thresholds to use in your CI pipeline.

## Custom Reporter

A reporter is a function used to generate a benchmark report.  It is called by the [`bench()`](#bench-functions-options) method after it has completed gathering performance metrics.  The `radargun` module ships with a built-in formater, which functions as the default.  It is possible to provide a custom reporter function as an option to `bench()`.  This function is called with the parameters:

* `stream`: a [writable stream](https://nodejs.org/api/stream.html#stream_writable_streams) to which the report should be written.

* `report`: an array of data containing the performance metrics gathered by the `bench()` method.  Each entry is an object with the keys:

  + `avg`: a number indicating the average execution time (in nanoseconds) of all runs for the function while benchmarking.

  + `label`: a string value indicating the label to use in the report.  This is typically the name of the function

  + `max`: a number indicating the highest execution time (in nanoseconds) encountered for the function while benchmarking.

  + `min`: a number indicating the lowest execution time (in nanoseconds) encountered for the function while benchmarking.

* `thresholds`: if threshold configuration was provided as `options` to the `bench()` method, this value is passed to the reporter.  Otherwise, this value is `null`.
