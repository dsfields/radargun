'use strict';

class MockStream {
  constructor() {
    this.writeCalled = false;
    this.value = '';
  }

  write(value) {
    this.writeCalled = true;
    this.value += value;
  }
}


module.exports = MockStream;
