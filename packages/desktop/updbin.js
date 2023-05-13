// updbin.js
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'app-observer', 'bin');
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
console.log(`Deleting ${dest}...`)
deleteDir(dest);
console.log(`Copying ${src} to ${dest}...`)
copyDir(src, dest);
