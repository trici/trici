const packager = require('electron-packager');

const options = {
  dir: './',
  out: './testBuild',
  name: 'TriciTest',
  executableName: 'TriciTest',
  asar: {
    unpackDir: 'bin',
    unpack: '{trici_watermark.png,*.node}',
  },
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
    'logs',
    'dist/dev',
    '__tests__',
    'bin/dev',
    'dist/live',
    'cleanTestBuild.js',
    'installTestBuild.js',
    'packageTestBuild.js',
    'entitlements.plist',
    'prepackage.js',
    'package-lock.json',
    'out',
  ],
};

async function packageTestBuild() {
  try {
    const appPaths = await packager(options);
    console.log(`Packaged app paths: ${appPaths}`);
  } catch (err) {
    console.error(err);
  }
}

packageTestBuild();
