console.log('Publishing to build... ');

// This will run after the bin folder has been updated and the build dev has been run
// Thus this is only copying the artifacts to the build folder
// Copy the bundled files and main.js, preload.js etc.

// Use nodejs fs to copy the files from bin to ../../builds/darwin or linux or win32 etc.

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { platform } = require('os');

const buildPath = path.join(__dirname, '..', '..', '..', 'builds', platform());
const binPath = path.join(__dirname, 'bin');

// Ensure builds folder exists
fs.ensureDirSync(buildPath);

//delete the build bin folder
fs.removeSync(path.join(buildPath, 'bin'));
// Copy the bin folder to build
fs.copySync(binPath, path.join(buildPath, 'bin'));
console.log(`Copied bin ${binPath} to build ${buildPath}`);

//delete the build dist folder
fs.removeSync(path.join(buildPath, 'dist'));
// Copy the contents of the dist folder to build, excluding dev and live subfolders
const distPath = path.join(__dirname, 'dist');
const buildDistPath = path.join(buildPath, 'dist');

fs.copySync(distPath, buildDistPath, {
  filter: src => {
    const base = path.basename(src);
    return base !== 'dev' && base !== 'live';
  },
});
console.log(`Copied dist contents (excluding dev and live) from ${distPath} to build ${buildDistPath}`);

//copy the resources folder to build
//copy the @trici/config node module to build/node_modules
fs.copySync(
  path.join(__dirname, '..', '..', '..', 'src', 'packages', 'config'),
  path.join(buildPath, 'node_modules', '@trici', 'config'),
);

console.log(`Copied @trici/config to build ${path.join(buildPath, 'node_modules', '@trici', 'config')}`);
const resourcesPath = path.join(__dirname, 'resources');
fs.copySync(resourcesPath, path.join(buildPath, 'resources'));

console.log(`Copied resources ${resourcesPath} to build ${path.join(buildPath, 'resources')}`);

const versionFile = path.join(__dirname, 'VERSION');
fs.copySync(versionFile, path.join(buildPath, 'VERSION'));
