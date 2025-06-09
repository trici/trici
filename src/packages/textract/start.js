const Textractor = require('./dist/index').Textractor;
const path = require('path');
const OCRLib = require('./dist/index').OCRLib;
const { getConsoleLogger } = require('@trici/logger');

const textractor = new Textractor(getConsoleLogger);

const image = path.join(__dirname, 'sampledata', 'frames', '1748962803077_0000_1748962803096_activity.jpg');

textractor
  .extract(image, OCRLib.VISIONKIT, __dirname)
  .then(result => {
    console.log(result);
  })
  .catch(err => {
    console.error('Error extracting text');
    console.error(err);
  });
