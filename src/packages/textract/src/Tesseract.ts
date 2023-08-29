// const { createWorker } = require('tesseract.js');

// const worker = createWorker({
//   logger: m => console.log(m)
// });

// (async () => {
//   await worker.load();
//   await worker.loadLanguage('eng');
//   await worker.initialize('eng');
//   const { data: { text, tesseract_version, blocks, paragraphs, lines, words, symbols } } = await worker.recognize('image.png');
//   console.log(text); // Recognized text
//   console.log(tesseract_version); // Tesseract version
//   console.log(blocks); // Text blocks
//   console.log(paragraphs); // Paragraphs
//   console.log(lines); // Lines
//   console.log(words); // Words
//   console.log(symbols); // Symbols (individual characters)
//   await worker.terminate();
// })();
