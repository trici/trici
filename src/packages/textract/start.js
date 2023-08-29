const Textractor = require("./dist/index").Textractor;
const path = require("path");
const OCRLib = require("./dist/index").OCRLib;

const textractor = new Textractor();
textractor
  .initialize()
  .then(() => {
    console.log("Initialized");
    const image = path.join(__dirname, "sampledata", "regular_output_1684027761000.png");

    // textractor
    //   .extract(image, OCRLib.TESSERACT, __dirname)
    //   .then((result) => {
    //     console.log(result);
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });

    textractor.extract(image, OCRLib.VISIONKIT, __dirname).then((result) => {
      console.log(result);
    }).catch((err) => {
      console.error(err);
    });
  })
  .catch((err) => {
    console.error(err);
  });
