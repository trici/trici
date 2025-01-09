const esbuild = require('esbuild');
// const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;

const isProdBuild = process.env.NODE_ENV === 'production';

async function buildJs() {
  esbuild.build({
    entryPoints: [path.join(ROOT_DIR, 'src', 'desktopServices', 'desktopServices.ts')],
    bundle: true,
    outfile: !isProdBuild
      ? path.join(ROOT_DIR, 'dist', 'dev', 'desktopServices.js')
      : path.join(ROOT_DIR, 'dist', 'desktopServices.js'),
    platform: 'node',
    sourcemap: !isProdBuild,
    target: 'node16',
    minify: isProdBuild,
    tsconfig: path.join(ROOT_DIR, 'tsconfig.json'),
    external: [
      'pouchdb',
      'sqlite3',
      'winston',
      'macos-notification-state',
      'electron',
      'shelljs',
      'mac-screen-capture-permissions',
      'node-mac-permissions',
      'knex',
    ],
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
