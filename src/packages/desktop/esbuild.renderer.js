const esbuild = require('esbuild');
// const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

const isProdBuild = process.env.NODE_ENV === 'production';

console.log('Renderer Process Bundles:');
console.log('isProdBuild:', isProdBuild);

async function buildJs() {
  await esbuild.build({
    entryPoints: [path.join(ROOT_DIR, 'src', 'preload.ts')],
    bundle: false,
    outfile: path.join(ROOT_DIR, 'dist', 'preload.js'),
    sourcemap: !isProdBuild,
    minify: isProdBuild,
    platform: 'node',
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    target: 'node16',
  });

  console.log('Preload Build finished!!');

  await esbuild.build({
    entryPoints: [path.join(ROOT_DIR, 'src', 'app', 'windows', 'settings', 'settingsBundleEntry.js')],
    bundle: true,
    outfile: !isProdBuild
      ? path.join(ROOT_DIR, 'dist', 'dev', 'settings.app.js')
      : path.join(ROOT_DIR, 'dist', 'settings.app.js'),
    sourcemap: !isProdBuild,
    minify: isProdBuild,
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    target: ['chrome94'],
  });

  console.log('Settings Window Build finished!!');

  await esbuild.build({
    entryPoints: [path.join(ROOT_DIR, 'src', 'app', 'windows', 'alert', 'alertBundleEntry.js')],
    bundle: true,
    outfile: !isProdBuild
      ? path.join(ROOT_DIR, 'dist', 'dev', 'alert.app.js')
      : path.join(ROOT_DIR, 'dist', 'alert.app.js'),
    sourcemap: !isProdBuild,
    minify: isProdBuild,
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    target: ['chrome94'],
  });

  console.log('Alert Window build finished!!');

  await esbuild.build({
    entryPoints: [path.join(ROOT_DIR, 'src', 'app', 'windows', 'onboarding', 'onboardingBundleEntry.js')],
    bundle: true,
    outfile: !isProdBuild
      ? path.join(ROOT_DIR, 'dist', 'dev', 'onboarding.app.js')
      : path.join(ROOT_DIR, 'dist', 'onboarding.app.js'),
    sourcemap: !isProdBuild,
    minify: isProdBuild,
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    target: ['chrome94'],
  });

  console.log('Onboarding Window build finished!!');

  await esbuild.build({
    entryPoints: [path.join(ROOT_DIR, 'src', 'app', 'windows', 'eventviewer', 'eventViewerBundleEntry.js')],
    bundle: true,
    outfile: !isProdBuild
      ? path.join(ROOT_DIR, 'dist', 'dev', 'eventviewer.app.js')
      : path.join(ROOT_DIR, 'dist', 'eventviewer.app.js'),
    sourcemap: !isProdBuild,
    minify: isProdBuild,
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    target: ['chrome94'],
  });

  console.log('EventViewer Window build finished!!');
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
