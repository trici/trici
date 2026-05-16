const path = require('path');
const fs = require('fs');
const setLanguages = require('electron-packager-languages');
const packageJson = require('./package.json');
const { version } = packageJson;

const isTestBuild = process.env.BUILD_ENV === 'test';

const config = {
  hooks: {
    // generateAssets: require('./build/generateAssets'),
    // postStart: require('./build/postStart'),
  },

  packagerConfig: {
    name: isTestBuild ? 'TriciTest' : 'Trici',
    executableName: isTestBuild ? 'TriciTest' : 'Trici',
    asar: {
      unpackDir: 'bin',
      unpack: '{trici_watermark.png,*.node}',
    },
    overwrite: true,
    icon: path.resolve(__dirname, 'resources', 'images', 'trici_icon'),
    quiet: false,
    appBundleId: 'com.gettrici.trici',
    usageDescription: {
      Camera: 'Access is needed by certain built-in fiddles in addition to any custom fiddles that use the Camera',
      Microphone:
        'Access is needed by certain built-in fiddles in addition to any custom fiddles that use the Microphone',
    },
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
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
      },
    },
    // {
    //   name: '@electron-forge/maker-zip',
    // },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-s3',
      platforms: ['darwin'],
      config: {
        bucket: 'download.gettrici.com',
        folder: 'darwin-x64',
        accessKeyId: 'AKIA43C6ATJFU6ZW6WF6',
        secretAccessKey: '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',
        region: 'ap-south-1',
      },
    },
  ],
};

function notarizeMaybe() {
  if (process.platform !== 'darwin') {
    return;
  }
  if (isTestBuild) {
    return;
  }

  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.warn('Should be notarizing, but environment variables APPLE_ID or APPLE_ID_PASSWORD are missing!');
    return;
  }

  config.packagerConfig.osxNotarize = {
    appBundleId: 'com.gettrici.trici',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: '23LU9PB5VN',
  };
}

notarizeMaybe();

// Finally, export it
module.exports = config;
