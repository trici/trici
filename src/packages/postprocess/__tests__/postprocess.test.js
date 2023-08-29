const PostProcessor = require('../dist/index.js').PostProcessor;
const getConsoleLogger = require('@trici/logger').getConsoleLogger;
const deleteDirectoryWithContents = require('@trici/utils').deleteDirectoryWithContents;
const path = require('path');
const fs = require('fs');

const ffmpegPath =  '/Users/shashi/projects/trici/packages/recorder/bin/ffmpeg';
const postProcessor = new PostProcessor(ffmpegPath, getConsoleLogger());

const recordingFileName = '1684027760452';
const recordingsDirecoryPath = path.join(__dirname, '..', 'sampledata');
const outputDirectoryPath = path.join(__dirname, '..', 'output');
deleteDirectoryWithContents(outputDirectoryPath).then(() => {
  fs.mkdirSync(outputDirectoryPath, { recursive: true });
  postProcessor.process(recordingFileName, recordingsDirecoryPath, outputDirectoryPath, []);
}).catch((err) => {
  console.error("Error deleting directory: ", err);
  fs.mkdirSync(outputDirectoryPath, { recursive: true });
  postProcessor.process(recordingFileName, recordingsDirecoryPath, outputDirectoryPath, []);
});


