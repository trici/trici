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

async function runTest() {
  const triciRecorder = new TriciRecorder(
    ffmpegPath,
    getConsoleLogger,
    path.join(__dirname, '..', 'bin', 'dev', 'Recorder'),
  );

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
    process.exit(0);
  });

  setTimeout(() => {
    console.log('Stopping recording after 25 seconds');
    triciRecorder.stopLiveRecording();
  }, 25000);
}

async function runAudioRecordingTest() {
  const triciRecorder = new TriciRecorder(
    ffmpegPath,
    getConsoleLogger,
    path.join(__dirname, '..', 'bin', 'dev', 'Recorder'),
  );

  const audioRecordingFileName = `audio_${Date.now()}`;

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
        }

        process.exit(0);
      } catch (error) {
        console.log('Error stopping audio recording: ', error);
        process.exit(1);
      }
    }, 10000);
  } catch (error) {
    console.log('Error starting audio recording: ', error);
    process.exit(1);
  }
}

// Uncomment the line below to run audio recording test instead of screen recording test
runAudioRecordingTest();

deleteDirectoryWithContents(recordingStorageLocation)
  .then(async () => {
    fs.mkdirSync(recordingStorageLocation, { recursive: true });
    try {
      await runTest();
    } catch (error) {
      console.log('Error running test: ', error);
    }
  })
  .catch(err => {
    console.error('Error deleting directory: ', err);
    fs.mkdirSync(recordingStorageLocation, { recursive: true });
    runTest();
  });
