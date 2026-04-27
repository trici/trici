/**
 * Files which are not bundled but are used should be copied to the dist folder
 * 1. Delete the node_modules folder at this level. Ignore if it does not exist
 * 2. create a node_modules folder at this level
 * 3. Copy node modules which are not bundled and are declared as external to the node_modules folder at this level
 */

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const ROOT_DIR = __dirname;
const PROJECT_DIR = path.join(ROOT_DIR, '..', '..');

const isProdBuild = process.env.NODE_ENV === 'production';

const externalModules = ['winston', 'mac-screen-capture-permissions'];

async function copyUnbundledFiles() {
  console.log('Copying unbundled files...');

  // // 1. Delete the node_modules folder at this level
  // await fs.promises.rm(path.join(ROOT_DIR, 'node_modules'), { recursive: true, force: true });
  // console.log('Deleted node_modules folder');

  // // 2. create a node_modules folder at this level
  // console.log('Creating node_modules folder');
  // await fs.promises.mkdir(path.join(ROOT_DIR, 'node_modules'));

  // // 3. Copy node modules which are not bundled and are declared as external
  // for (const module of externalModules) {
  //   const srcPath = path.join(PROJECT_DIR, 'node_modules', module);
  //   const destPath = path.join(ROOT_DIR, 'node_modules', module);
  //   console.log('Copying', srcPath, 'to', destPath);
  //   try {
  //     await fse.copy(srcPath, destPath);
  //   } catch (err) {
  //     console.error('Error copying', srcPath, 'to', destPath, err);
  //   }
  // }

  console.log('Copying index.html, main.js');
  await fse.copy(path.join(ROOT_DIR, 'src', 'index.html'), path.join(ROOT_DIR, 'dist', 'index.html'));
  await fse.copy(path.join(ROOT_DIR, 'src', 'main.js'), path.join(ROOT_DIR, 'dist', 'main.js'));
  console.log('Copying unbundled files complete!!');
}

async function build(args) {
  console.log('Starting build using esbuild...');
  console.log('args:', args);
  await Promise.all([
    copyUnbundledFiles()
      .then(() => {
        console.log('✅ Copy unbundled files complete');
      })
      .catch(err => {
        console.error('❌ Copy unbundled files failed', err);
      }),
  ]);

  console.log('🎉 Build complete');
}

if (require.main === module) {
  build(process.argv.slice(2));
}
