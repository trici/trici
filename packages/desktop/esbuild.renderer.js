const esbuild = require('esbuild');
// const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

async function buildJs() {
  await esbuild.build({
    entryPoints: [path.join(ROOT_DIR, 'src', 'app', 'windows', 'settings', 'settingsBundleEntry.js')],
    bundle: true,
    outfile: path.join(ROOT_DIR, 'dist', 'dev', 'settings.app.js'),
    sourcemap: true,
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    target: ['chrome94'],
  });

  console.log('Settings Window Build finished!!');

  await esbuild.build({
    entryPoints: [path.join(ROOT_DIR, 'src', 'app', 'windows', 'alert', 'alertBundleEntry.js')],
    bundle: true,
    outfile: path.join(ROOT_DIR, 'dist', 'dev', 'alert.app.js'),
    sourcemap: true,
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    target: ['chrome94'],
  });

  console.log('Alert Window build finished!!');
}

async function build(args) {
  console.log('Starting build using esbuild...');
  console.log('args:', args);
  await Promise.all([
    buildJs()
      .then(() => {
        console.log('✅ Build JS complete');
      })
      .catch(err => {
        console.error('❌ Build JS failed', err);
      }),
  ]);

  console.log('🎉 Build complete');
}

if (require.main === module) {
  build(process.argv.slice(2));
}

module.exports = build;
