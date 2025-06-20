# @trici/recorder

A package for recording screen and audio using FFmpeg.

## Features

- Screen recording with watermark support
- Audio recording from system microphone
- Screenshot capture
- Cross-platform support (macOS, Windows, Linux)

## Usage

### Audio Recording

```typescript
import { TriciRecorder } from '@trici/recorder';
import { getConsoleLogger } from '@trici/logger';

const recorder = new TriciRecorder(
  '/path/to/ffmpeg',
  getConsoleLogger,
  '/path/to/recorder/binary'
);

// Start audio recording
await recorder.startAudioRecording('my-audio', '/path/to/recordings');

// Check if recording is active
if (recorder.isAudioRecording()) {
  console.log('Audio recording is active');
}

// Stop audio recording
await recorder.stopAudioRecording();
```

### Screen Recording

```typescript
// Start screen recording
await recorder.startLiveRecording(
  'my-recording',
  '/path/to/recordings',
  true, // include watermark
  '/path/to/watermark.png'
);

// Check if recording is active
if (recorder.isRecording()) {
  console.log('Screen recording is active');
}

// Stop screen recording
await recorder.stopLiveRecording();
```

### Screenshot

```typescript
// Take a screenshot
await recorder.takeScreenshot('screenshot.png', '/path/to/screenshots');
```

## Events

The recorder emits the following events:

- `finishedWritingSegment` - When a recording segment is completed
- `recordingProcessCrashed` - When the recording process crashes unexpectedly
- `recordingProcessExitedUnexpectedly` - When the recording process exits unexpectedly
- `audioRecordingError` - When an error occurs during audio recording
- `audioRecordingProcessCrashed` - When the audio recording process crashes unexpectedly
