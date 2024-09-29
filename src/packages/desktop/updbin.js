// updbin.js
const fs = require('fs');
const path = require('path');

const dest = path.resolve(__dirname, 'bin');

function deleteDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        deleteDir(entryPath);
      } else {
        fs.unlinkSync(entryPath);
      }
    }

    fs.rmdirSync(dirPath);
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}


console.log(`Deleting ${dest}...`);
deleteDir(dest);

// make bin/dev
// make bin/triciobserver
console.log(`Creating bin directory and bin/dev directory...`);
fs.mkdirSync(path.resolve(__dirname, 'bin'));
fs.mkdirSync(path.resolve(__dirname, 'bin', 'dev'));

// copy app-observer binary from app-observer/bin to bin
// check if the binary exists in app-observer/bin/dev/triciobserver then copy else print not copied

const triciobserverDevSrc = path.resolve(__dirname, '..', 'app-observer', 'bin', 'dev', 'triciobserver');
const triciobserverDevDest = path.resolve(__dirname, 'bin', 'dev', 'triciobserver');
fs.stat(triciobserverDevSrc, (err, stats) => {
  if (err) {
    console.log('Binary not found in app-observer/bin/dev/triciobserver....');
  } else {
    console.log(`Copying ${triciobserverDevSrc} to ${triciobserverDevDest}...`);
    fs.copyFileSync(triciobserverDevSrc, triciobserverDevDest);
  }
});

const triciobserverSrc = path.resolve(__dirname, '..', 'app-observer', 'bin', 'triciobserver');
const triciobserverDest = path.resolve(__dirname, 'bin', 'triciobserver');
fs.stat(triciobserverSrc, (err, stats) => {
  if (err) {
    console.log('Binary not found in app-observer/bin/triciobserver....');
  } else {
    console.log(`Copying ${triciobserverSrc} to ${triciobserverDest}...`);
    fs.copyFileSync(triciobserverSrc, triciobserverDest);
  }
});

// copy recorder binary from recorder/bin to bin
const recorderDevSrc = path.resolve(__dirname, '..', 'recorder', 'bin', 'dev', 'recorder');
const recorderDevDest = path.resolve(__dirname, 'bin', 'dev', 'recorder');
fs.stat(recorderDevSrc, (err, stats) => {
  if (err) {
    console.log('Binary not found in recorder/bin/dev/recorder....');
  } else {
    console.log(`Copying ${recorderDevSrc} to ${recorderDevDest}...`);
    fs.copyFileSync(recorderDevSrc, recorderDevDest);
  }
});

const recorderSrc = path.resolve(__dirname, '..', 'recorder', 'bin', 'recorder');
const recorderDest = path.resolve(__dirname, 'bin', 'recorder');
fs.stat(recorderSrc, (err, stats) => {
  if (err) {
    console.log('Binary not found in recorder/bin/recorder....');
  } else {
    console.log(`Copying ${recorderSrc} to ${recorderDest}...`);
    fs.copyFileSync(recorderSrc, recorderDest);
  }
});


//copy ffmpeg binary from node_modules to bin
const ffmpegSrc = path.resolve(__dirname, '..', 'desktop', 'node_modules', 'ffmpeg-static', 'ffmpeg');
const ffmpegDest = path.resolve(__dirname, 'bin', 'ffmpeg');
console.log(`Copying ${ffmpegSrc} to ${ffmpegDest}...`);
fs.copyFileSync(ffmpegSrc, ffmpegDest);
console.log('Done!');
