const Config = {
  recordingsDirectoryPath: '/trici/recordings/',
  logsDirectoryPath: '/trici/logs/',
  builtFor: 'prod',
  localOnly: true,
  pacHttpPort: 3030,
  defaultInstallationId: '22d860cd-07e1-4d7f-bd9a-ca5ed5c242f9',
  macAutoUpdateFeedUrl: 'https://download.gettrici.com/darwin-x64/releases.json',
  macAutoUpdateFeedUrlArm64: 'https://download.gettrici.com/darwin-x64/releases-arm64.json',
  winAutoUpdateFeedUrl: 'https://download.gettrici.com/win-x64/',
  ipcConfigAppSpace: 'trici.',
  ipcConfigSocketRoot: '/tmp/',
  ipcConfigId: 'trici-pm',
  ipcConfigDelimiter: '\u{000C}',
  mainProcessBuiltModuleReferencePath: '../dist/desktopServices.js',
};

module.exports = Config;
