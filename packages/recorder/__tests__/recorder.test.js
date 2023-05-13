const TriciRecorder = require("../dist/index").TriciRecorder;
const getConsoleLogger = require("@trici/logger").getConsoleLogger;
const path = require("path");
const fs = require("fs");
const deleteDirectoryWithContents = require("@trici/utils").deleteDirectoryWithContents;

const ffmpegPath = path.join(__dirname, "..", "bin", "ffmpeg");
const waterMarkImagePath = path.join(__dirname, "..", "bin", "trici_watermark.png");
const recordingStorageLocation = path.join(__dirname, "..", "recordings");

function runTest() {

  const triciRecorder = new TriciRecorder(ffmpegPath, getConsoleLogger());

  const recordingFileName = `${Date.now()}`;

  const includeWatermark = true;
  triciRecorder.startLiveRecording(
    recordingFileName,
    recordingStorageLocation,
    4,
    includeWatermark,
    waterMarkImagePath
  );

  triciRecorder.on("recordingProcessExited", (code) => {
    console.log("Recording process exited with code: ", code);
    process.exit(0);
  });

  setTimeout(() => {
    console.log("Stopping recording");
    triciRecorder.stopLiveRecording();
  }, 30000);
}

deleteDirectoryWithContents(recordingStorageLocation).then(() => {
  fs.mkdirSync(recordingStorageLocation, { recursive: true });
  runTest();
}).catch((err) => {
  console.error("Error deleting directory: ", err);
  fs.mkdirSync(recordingStorageLocation, { recursive: true });
  runTest();
});

