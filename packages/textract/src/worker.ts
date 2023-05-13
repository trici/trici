import { parentPort } from 'worker_threads';
import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

const image = path.join(__dirname,'..','sampledata', 'sshot1.png');

(async () => {
  const worker = await createWorker({
    logger: (m) => console.log(m),
  });

  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  const imageBuffer = fs.readFileSync(image);

  const { data: { text, tsv} } = await worker.recognize(imageBuffer);

  // parentPort?.postMessage(text);
  parentPort?.postMessage(tsv);

  await worker.terminate();
})();
