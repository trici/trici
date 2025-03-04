const fs = require('fs');
const path = require('path');
const { DataWriter } = require('./dist');

async function main() {
  try {
    // Read the sample data
    const sampleData = JSON.parse(fs.readFileSync(path.join(__dirname, 'sampledata', 'sampleItp.json'), 'utf8'));

    // Create out directory if it doesn't exist
    const outDir = path.join(__dirname, 'out');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
    }

    // Convert to protobuf and write to file
    const protobufData = DataWriter.convertIdleTimeProfile(sampleData);
    const pbFile = path.join(outDir, 'idle_time_profile.pb');
    fs.writeFileSync(pbFile, protobufData);
    console.log(`Successfully wrote protobuf data to ${pbFile}`);

    // Read back the protobuf file and convert to JSON
    const readBuffer = fs.readFileSync(pbFile);
    const convertedData = DataWriter.readIdleTimeProfileFromBuffer(readBuffer);
    const jsonFile = path.join(outDir, 'out.json');
    fs.writeFileSync(jsonFile, JSON.stringify(convertedData, null, 2));
    console.log(`Successfully wrote JSON data to ${jsonFile}`);

    // Compare the files
    const originalStr = JSON.stringify(sampleData);
    const convertedStr = JSON.stringify(convertedData);

    if (originalStr === convertedStr) {
      console.log('✅ Files are identical!');
    } else {
      console.log('❌ Files differ!');
      // Log first different entry for debugging
      sampleData.forEach((original, i) => {
        const converted = convertedData[i];
        if (JSON.stringify(original) !== JSON.stringify(converted)) {
          console.log('First difference at index', i);
          console.log('Original:', original);
          console.log('Converted:', converted);
          return;
        }
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
