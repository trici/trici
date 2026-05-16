const TriciRecorder = require('../dist/index').TriciRecorder;
const getConsoleLogger = require('@trici/logger').getConsoleLogger;
const path = require('path');
const fs = require('fs');
const deleteDirectoryWithContents = require('@trici/utils').deleteDirectoryWithContents;

/**
 * This package had no real logic and was directly using ffmpeg to record the screen, which is why it did not have a proper unit test.
 * The code now has logic for initializing the recorder and starting the recording process, so perhaps the unit test should be added here.
 * But for now, I am just usign the previous logic that the screen recording code works fine.
 */

const ffmpegPath = path.join(__dirname, '..', 'bin', 'ffmpeg');
const waterMarkImagePath = path.join(__dirname, '..', 'temp', 'trici_watermark.png');
const recordingStorageLocation = path.join(__dirname, '..', 'recordings');

const triciRecorder = new TriciRecorder(
  ffmpegPath,
  getConsoleLogger,
  path.join(__dirname, '..', 'bin', 'dev', 'Recorder'),
);

async function startVideoRecording() {
  const recordingFileName = `${Date.now()}`;

  const includeWatermark = true;
  try {
    await triciRecorder.startLiveRecording(
      recordingFileName,
      recordingStorageLocation,
      includeWatermark,
      waterMarkImagePath,
    );
  } catch (error) {
    console.log('Error starting live recording: ', error);
  }

  triciRecorder.on('recordingProcessExited', code => {
    console.log('Encoding process exited with code: ', code);
    if (triciRecorder.isRecording()) {
      console.log('Stopping recording since recordingProcessExited event was received');
      triciRecorder.stopLiveRecording();
    }
  });

  setTimeout(() => {
    console.log('Stopping recording after 25 seconds');
    triciRecorder.stopLiveRecording();
  }, 25000);
}

async function startAudioRecording() {
  const audioRecordingFileName = `${Date.now()}`;

  try {
    console.log('Starting audio recording test...');
    await triciRecorder.startAudioRecording(audioRecordingFileName, recordingStorageLocation);
    console.log('Audio recording started successfully');

    // Check if recording is active
    if (triciRecorder.isAudioRecording()) {
      console.log('Audio recording is active');
    } else {
      console.log('Audio recording is not active');
    }

    // Stop recording after 10 seconds
    setTimeout(async () => {
      console.log('Stopping audio recording after 10 seconds');
      try {
        await triciRecorder.stopAudioRecording();
        console.log('Audio recording stopped successfully');

        // Check if recording file was created
        const expectedFilePath = path.join(recordingStorageLocation, `${audioRecordingFileName}.m4a`);
        if (fs.existsSync(expectedFilePath)) {
          console.log('Audio recording file created successfully:', expectedFilePath);
        } else {
          console.log('Audio recording file not found:', expectedFilePath);
          // create a blank file AUDIO_FAILED
          fs.writeFileSync(path.join(recordingStorageLocation, 'AUDIO_FAILED'), '');
        }
      } catch (error) {
        console.log('Error stopping audio recording: ', error);
        // create a blank file AUDIO_FAILED
        fs.writeFileSync(path.join(recordingStorageLocation, 'AUDIO_FAILED'), '');
      }
    }, 10000);
  } catch (error) {
    console.log('Error starting audio recording: ', error);
    // create a blank file AUDIO_FAILED
    fs.writeFileSync(path.join(recordingStorageLocation, 'AUDIO_FAILED'), '');
  }
}

async function startRecording() {
  return new Promise((resolve, reject) => {
    try {
      startVideoRecording();
      setTimeout(() => {
        startAudioRecording();
      }, 2000);
    } catch (error) {
      console.log('Error running test: ', error);
      reject(error);
    }
  });
}

async function runTest() {
  try {
    await startRecording();
    process.exit(0);
  } catch (error) {
    console.log('Error running test: ', error);
    process.exit(1);
  }
}

deleteDirectoryWithContents(recordingStorageLocation)
  .then(async () => {
    fs.mkdirSync(recordingStorageLocation, { recursive: true });
    runTest();
  })
  .catch(err => {
    console.error('Error deleting directory: ', err);
    fs.mkdirSync(recordingStorageLocation, { recursive: true });
    runTest();
  });
