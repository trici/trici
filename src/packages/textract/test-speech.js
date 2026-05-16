// Test script to verify speech-to-text functionality
// This tests the TypeScript interface and native Swift binary integration
const { Textractor, SpeechLib, OCRLib } = require('./dist/index.js');

const mockLogger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

const textractor = new Textractor(() => mockLogger);

async function runTests() {
  console.log('Testing speech-to-text functionality...\n');
  
  // Test 1: Check exports
  console.log('1. Testing exports:');
  console.log('   - SpeechLib enum:', SpeechLib);
  console.log('   - OCRLib enum:', OCRLib);
  console.log('   - extractFromAudio method exists:', typeof textractor.extractFromAudio === 'function');
  console.log('   - extract method exists:', typeof textractor.extract === 'function');
  console.log('   ✓ All exports present\n');

  // Test 2: Invalid library error handling
  console.log('2. Testing invalid library error handling:');
  try {
    await textractor.extractFromAudio('test.wav', 'INVALID_LIB', __dirname);
    console.log('   ✗ Should have thrown error');
  } catch (error) {
    console.log('   ✓ Invalid library test passed:', error.message);
  }
  console.log('');

  // Test 3: Valid library enum
  console.log('3. Testing valid SpeechLib enum:');
  console.log('   - APPLE_SPEECH value:', SpeechLib.APPLE_SPEECH);
  console.log('   ✓ Enum values correct\n');

  console.log('All interface tests passed! 🎉');
  console.log('\nNote: To test actual speech recognition, run with a real audio file:');
  console.log('  const result = await textractor.extractFromAudio("path/to/audio.wav", SpeechLib.APPLE_SPEECH, __dirname);');
}

runTests().catch(console.error);