const esbuild = require('esbuild');
// const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

let playSoundOnBuildErrorPlugin = {
  name: 'play-sound-on-build-error',
  setup(build) {
    build.onEnd(result => {
      if (result.errors.length > 0) {
        console.log('\x07\x07'); // beep
        console.log('Build Failed...');
      } else {
        console.log('Build Succeeded!');
      }
    });
  },
};

async function buildJs() {
  let settingsWindowContext = await esbuild.context({
    entryPoints: [path.join(ROOT_DIR, 'src', 'app', 'windows', 'settings', 'settingsBundleEntry.js')],
    bundle: true,
    outfile: path.join(ROOT_DIR, 'dist', 'live', 'settings.app.js'),
    sourcemap: true,
    target: ['chrome94'],
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    plugins: [playSoundOnBuildErrorPlugin],
  });

  await settingsWindowContext.watch();

  let { host, port } = await settingsWindowContext.serve({
    servedir: path.join(ROOT_DIR, 'dist', 'live'),
    port: 8080,
    host: 'localhost',
  });

  console.log(`Serving Settings bundle on http://${host}:${port}`);

  let alertWindowContext = await esbuild.context({
    entryPoints: [path.join(ROOT_DIR, 'src', 'app', 'windows', 'alert', 'alertBundleEntry.js')],
    bundle: true,
    outfile: path.join(ROOT_DIR, 'dist', 'live', 'alert.app.js'),
    sourcemap: true,
    target: ['chrome94'],
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    plugins: [playSoundOnBuildErrorPlugin],
  });

  await alertWindowContext.watch();

  let { host: alertHost, port: alertPort } = await alertWindowContext.serve({
    servedir: path.join(ROOT_DIR, 'dist', 'live'),
    port: 8081,
    host: 'localhost',
  });

  console.log(`Serving Alert bundle on http://${alertHost}:${alertPort}`);
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
