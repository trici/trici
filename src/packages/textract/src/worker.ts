// import { parentPort } from 'worker_threads';
// import { createWorker } from 'tesseract.js';
// import fs from 'fs';
// import path from 'path';

// const image = path.join(__dirname,'..','sampledata', 'regular_output_1684027761000.png');

// (async () => {
//   const worker = await createWorker({
//     logger: (m) => console.log(m),
//   });

//   await worker.loadLanguage('eng');
//   await worker.initialize('eng');

//   const imageBuffer = fs.readFileSync(image);

//   const { data: { text, blocks, paragraphs, lines, words, symbols, tsv} } = await worker.recognize(imageBuffer);

//   // parentPort?.postMessage(text);
//   parentPort?.postMessage(blocks);
//   parentPort?.postMessage(paragraphs);
//   parentPort?.postMessage(lines);
//   parentPort?.postMessage(words);
//   parentPort?.postMessage(symbols);

//   parentPort?.postMessage(tsv);

//   await worker.terminate();
// })();
