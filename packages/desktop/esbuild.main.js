const esbuild = require('esbuild');
// const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

async function buildJs() {
  esbuild.build({
    entryPoints: [path.join(ROOT_DIR, 'src', 'desktopServices', 'desktopServices.ts')],
    bundle: true,
    outfile: path.join(ROOT_DIR, 'dist', 'dev', 'desktopServices.js'),
    platform: 'node',
    sourcemap: true,
    target: 'node16',
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    external: ['pouchdb', 'winston', 'macos-notification-state', 'electron', 'shelljs', 'mac-screen-capture-permissions']
  });
}

async function build(args) {
  console.log('Starting build using esbuild...');
  console.log('args:', args);
  await Promise.all([
    buildJs()
      .then(() => {
        console.log('✅ Build JS complete');
      })
      .catch((err) => {
        console.error('❌ Build JS failed', err);
      }),
  ]);

  console.log('🎉 Build complete');
}

if (require.main === module) {
  build(process.argv.slice(2));
}

module.exports = build;
