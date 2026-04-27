// This will delete the build in the buildPath and create a new build from scratch
// To update an existing build use updateBuildForPackaging.js

// Use nodejs fs to copy the files from bin to ../../builds/darwin or linux or win32 etc.

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { platform } = require('os');

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};
const log = msg => console.log(`${c.cyan}ℹ️  ${msg}${c.reset}`);
const ok = msg => console.log(`${c.green}✅ ${msg}${c.reset}`);
const warn = msg => console.warn(`${c.yellow}⚠️  ${msg}${c.reset}`);
const err = msg => console.error(`${c.red}❌ ${msg}${c.reset}`);

log(`${c.bold}Creating Build for Packaging${c.reset}`);

const buildPath = path.join(__dirname, '..', '..', '..', 'builds', platform());
const binPath = path.join(__dirname, 'bin');

// Delete the entire build folder and create a new one
fs.removeSync(buildPath);
fs.ensureDirSync(buildPath);

// Copy the bin folder to build
fs.ensureDirSync(path.join(buildPath, 'bin'));
fs.copySync(binPath, path.join(buildPath, 'bin'));
ok(`Copied bin → ${buildPath}/bin`);

// Copy the contents of the dist folder to build, excluding dev and live subfolders
const distPath = path.join(__dirname, 'dist');
const buildDistPath = path.join(buildPath, 'dist');

fs.copySync(distPath, buildDistPath, {
  filter: src => {
    const base = path.basename(src);
    return base !== 'dev' && base !== 'live';
  },
});
ok(`Copied dist (excl. dev/live) → ${buildDistPath}`);

//copy the resources folder to build
//copy the @trici/config node module to build/node_modules
fs.copySync(
  path.join(__dirname, '..', '..', '..', 'src', 'packages', 'config'),
  path.join(buildPath, 'node_modules', '@trici', 'config'),
);

ok(`Copied @trici/config → ${path.join(buildPath, 'node_modules', '@trici', 'config')}`);
const resourcesPath = path.join(__dirname, 'resources');
fs.copySync(resourcesPath, path.join(buildPath, 'resources'));

ok(`Copied resources → ${path.join(buildPath, 'resources')}`);

const versionFile = path.join(__dirname, 'VERSION');
fs.copySync(versionFile, path.join(buildPath, 'VERSION'));

// Create package.json for the build
const templatePackageJson = fs.readJsonSync(path.join(__dirname, 'godown', 'templatePackageJsonForBuilds.json'));
const desktopPackageJson = fs.readJsonSync(path.join(__dirname, 'package.json'));

// Sync version from desktop package.json
templatePackageJson.version = desktopPackageJson.version;

// Sync all dep versions listed in the template from desktop's package.json.
// The template is the authority on WHICH packages belong in the build;
// this only updates versions so they stay in sync with the source.
log('Syncing dependency versions from desktop/package.json...');
for (const section of ['dependencies', 'devDependencies']) {
  for (const pkg of Object.keys(templatePackageJson[section] ?? {})) {
    const desktopVersion = desktopPackageJson[section]?.[pkg];
    if (desktopVersion) {
      const oldVersion = templatePackageJson[section][pkg];
      templatePackageJson[section][pkg] = desktopVersion;
      if (oldVersion !== desktopVersion) {
        ok(`Updated ${pkg}  ${oldVersion} → ${desktopVersion}`);
      }
    } else {
      warn(`"${pkg}" is in the build template's ${section} but not found in desktop/package.json`);
    }
  }
}

// Write the updated package.json to build path
fs.writeJsonSync(path.join(buildPath, 'package.json'), templatePackageJson, { spaces: 2 });
ok(`Created package.json in ${buildPath}`);

// Copy forge.config.js and entitlements.plist for Darwin builds
if (platform() === 'darwin') {
  const forgeConfigPath = path.join(__dirname, 'godown', 'darwin', 'forge.config.js');
  const entitlementsPath = path.join(__dirname, 'godown', 'darwin', 'entitlements.plist');
  const playwrightConfigPath = path.join(__dirname, 'godown', 'darwin', 'playwright.config.js');
  const packageTestBuildSriptPath = path.join(__dirname, 'godown', 'darwin', 'packageTestBuild.js');
  const installTestBuildScriptPath = path.join(__dirname, 'godown', 'darwin', 'installTestBuild.js');
  const prepackageBuildScriptPath = path.join(__dirname, 'godown', 'darwin', 'prepackage.js');
  const cleanTestBuildScriptPath = path.join(__dirname, 'godown', 'darwin', 'cleanTestBuild.js');
  const testsPath = path.join(__dirname, 'godown', 'darwin', '__tests__');

  fs.copySync(forgeConfigPath, path.join(buildPath, 'forge.config.js'));
  fs.copySync(entitlementsPath, path.join(buildPath, 'entitlements.plist'));
  fs.copySync(playwrightConfigPath, path.join(buildPath, 'playwright.config.js'));
  fs.copySync(packageTestBuildSriptPath, path.join(buildPath, 'packageTestBuild.js'));
  fs.copySync(installTestBuildScriptPath, path.join(buildPath, 'installTestBuild.js'));
  fs.copySync(prepackageBuildScriptPath, path.join(buildPath, 'prepackage.js'));
  fs.copySync(cleanTestBuildScriptPath, path.join(buildPath, 'cleanTestBuild.js'));
  fs.copySync(testsPath, path.join(buildPath, '__tests__'));

  ok(`Copied forge.config.js, entitlements.plist, playwright.config.js, packageTestBuild.js, installTestBuild.js, prepackage.js, cleanTestBuild.js, __tests__ → ${buildPath}`);
}

// Delete node_modules before installing to ensure a clean install
fs.removeSync(path.join(buildPath, 'node_modules'));
log('Deleted node_modules from build directory');

// Run npm install in the build directory
log('Running npm install in build directory...');
exec('npm install --include=dev', { cwd: buildPath }, (error, stdout, stderr) => {
  if (error) {
    err(`npm install failed: ${error}`);
    return;
  }
  ok('npm install completed successfully');
  if (stdout) console.log(stdout);
  if (stderr) warn(stderr);
});
