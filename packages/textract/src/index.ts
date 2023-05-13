import { Worker } from 'worker_threads';
import path from 'path';

const workerScript = path.join(__dirname, 'worker.js');

const worker = new Worker(workerScript);

worker.on('message', (message) => {
  console.log('Message from worker:', message);
});

worker.on('error', (error) => {
  console.error('Error in worker:', error);
});

worker.on('exit', (code) => {
  console.log(`Worker exited with code: ${code}`);
});
