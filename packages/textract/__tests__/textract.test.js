'use strict';

const textract = require('..');
const assert = require('assert').strict;

assert.strictEqual(textract(), 'Hello from textract');
console.info('textract tests passed');
