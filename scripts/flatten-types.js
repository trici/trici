// flatten-types.js
const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Please provide the source directory');
  process.exit(1);
}

const packageDir = process.argv[2];
const sourceDir = path.join(packageDir, 'dist');
const targetDir = path.join(packageDir, 'dist');

function deleteDirectory(directory) {
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const fullPath = path.join(directory, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      deleteDirectory(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  });

  fs.rmdirSync(directory);
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const fullPath = path.join(directory, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      processDirectory(fullPath);
      deleteDirectory(fullPath);
    } else if (stats.isFile() && fullPath.endsWith('.d.ts')) {
      const targetPath = path.join(targetDir, path.basename(fullPath));
      fs.renameSync(fullPath, targetPath);
    }
  });
}

processDirectory(sourceDir);
