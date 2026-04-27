const packager = require('@electron/packager');
const setLanguages = require('electron-packager-languages');
const options = {
  dir: './',
  out: './testBuild',
  name: 'TriciTest',
  executableName: 'TriciTest',
  // asar: {
  //   unpackDir: 'bin',
  //   unpack: '{trici_watermark.png,*.node}',
  // },
  overwrite: true,
  icon: './resources/images/trici_icon.icns',
  quiet: false,
  appBundleId: 'com.gettrici.tricitest',
  appCategoryType: 'public.app-category.developer-tools',
  osxSign: {
    identity: 'Developer ID Application: Shashi Singh (23LU9PB5VN)',
    hardenedRuntime: true,
    'gatekeeper-assess': false,
    entitlements: 'entitlements.plist',
    'entitlements-inherit': 'entitlements.plist',
    'signature-flags': 'library',
  },
  extendInfo: {
    LSUIElement: true,
  },
  ignore: [
    'forge.config.js',
    'logs/',
    /^logs$/,
    '__tests__',
    'cleanTestBuild.js',
    'installTestBuild.js',
    'packageTestBuild.js',
    'entitlements.plist',
    'prepackage.js',
    'package-lock.json',
    'out/',
    /^out$/,
    /\.map$/,            // Exclude source maps
    /test/,              // Exclude test files
    /.*\.md$/,           // Exclude markdown docs
    /node_modules\/dev/
  ],
  afterCopy: [setLanguages(['en'])],
};

async function packageTestBuild() {
  try {
    const appPaths = await packager(options);
    console.log(`Packaged app paths: ${appPaths}`);
  } catch (err) {
    console.error(err);
  }
}

console.log('packageTestBuild option:', options);

packageTestBuild();
