const Textractor = require('./dist/index').Textractor;
const path = require('path');
const OCRLib = require('./dist/index').OCRLib;

const textractor = new Textractor();
textractor
  .initialize()
  .then(() => {
    console.log('Initialized Textractor');
    const image = path.join(__dirname, 'sampledata', 'frames', '1748962803077_0000_1748962803096_activity.jpg');

    // textractor
    //   .extract(image, OCRLib.TESSERACT, __dirname)
    //   .then((result) => {
    //     console.log(result);
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });

    textractor
      .extract(image, OCRLib.VISIONKIT, __dirname)
      .then(result => {
        console.log(result);
      })
      .catch(err => {
        console.error('Error extracting text');
        console.error(err);
      });
  })
  .catch(err => {
    console.error('Error initializing textractor');
    console.error(err);
  });
