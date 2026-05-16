const childProcess = require('child_process');
const path = require('path');

const profile = createPackageProfile();
profile.installChildProcessTimers();

const fsExtra = require('fs-extra');
profile.installFsExtraTimers(fsExtra);

const packager = require('@electron/packager');
const setLanguages = require('electron-packager-languages');

const keptLocalePaks = new Set(['en-US.pak']);
const keptLocaleDirs = new Set(['en.lproj', 'en-US.lproj', 'Base.lproj']);

process.on('unhandledRejection', err => {
  profile.total('unhandled rejection');
  console.error(err);
  process.exitCode = 1;
});

process.on('uncaughtException', err => {
  profile.total('uncaught exception');
  console.error(err);
  process.exitCode = 1;
});

process.on('beforeExit', code => {
  profile.mark(`beforeExit code=${code}`);
});

process.on('exit', code => {
  profile.mark(`exit code=${code}`);
});

function createPackageProfile() {
  const startTime = process.hrtime.bigint();
  let lastMark = startTime;
  const commandSummaries = new Map();

  function elapsedMs(from, to = process.hrtime.bigint()) {
    return Number(to - from) / 1_000_000;
  }

  function formatMs(ms) {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function log(message) {
    console.log(`[package-profile] ${message}`);
  }

  function formatPathForLog(value) {
    if (typeof value !== 'string') {
      return '';
    }

    const basename = path.basename(value);
    return basename ? ` ${basename}` : '';
  }

  function summarizeCommand(command, args) {
    const basename = path.basename(command || '');
    const interestingCommands = new Set(['codesign', 'security', 'spctl', 'xcrun']);
    if (!interestingCommands.has(basename)) {
      return null;
    }

    const stringArgs = Array.isArray(args) ? args.map(String) : [];
    const target = [...stringArgs].reverse().find(arg => !arg.startsWith('-')) || '';
    if (!target) {
      return basename;
    }

    const targetName = path.basename(target);
    const parentName = path.basename(path.dirname(target));
    return parentName && targetName === 'locale.pak' ? `${basename} ${parentName}/${targetName}` : `${basename} ${targetName}`;
  }

  function addCommandTiming(commandLabel, durationMs) {
    const summary = commandSummaries.get(commandLabel) || { count: 0, totalMs: 0 };
    summary.count += 1;
    summary.totalMs += durationMs;
    commandSummaries.set(commandLabel, summary);
  }

  function wrapCallback(commandLabel, startedAt, callback) {
    if (typeof callback !== 'function') {
      return callback;
    }

    return function profiledCallback(...callbackArgs) {
      const durationMs = elapsedMs(startedAt);
      addCommandTiming(commandLabel, durationMs);
      log(`${commandLabel} finished in ${formatMs(durationMs)}`);
      return callback.apply(this, callbackArgs);
    };
  }

  return {
    installChildProcessTimers() {
      const originalSpawn = childProcess.spawn;
      const originalExecFile = childProcess.execFile;

      childProcess.spawn = function profiledSpawn(command, args, options) {
        const commandLabel = summarizeCommand(command, args);
        const startedAt = process.hrtime.bigint();
        const child = originalSpawn.apply(this, arguments);

        if (commandLabel) {
          child.once('close', () => {
            const durationMs = elapsedMs(startedAt);
            addCommandTiming(commandLabel, durationMs);
            log(`${commandLabel} finished in ${formatMs(durationMs)}`);
          });
        }

        return child;
      };

      childProcess.execFile = function profiledExecFile(command, args, options, callback) {
        const commandLabel = summarizeCommand(command, args);
        if (!commandLabel) {
          return originalExecFile.apply(this, arguments);
        }

        const startedAt = process.hrtime.bigint();
        const profiledArgs = Array.from(arguments);
        const lastArg = profiledArgs[profiledArgs.length - 1];
        if (typeof lastArg === 'function') {
          profiledArgs[profiledArgs.length - 1] = wrapCallback(commandLabel, startedAt, lastArg);
        }

        return originalExecFile.apply(this, profiledArgs);
      };
    },

    installFsExtraTimers(fsExtra) {
      for (const methodName of ['move', 'copy', 'remove', 'rename', 'ensureDir', 'mkdtemp']) {
        const originalMethod = fsExtra[methodName];
        if (typeof originalMethod !== 'function') {
          continue;
        }

        fsExtra[methodName] = async function profiledFsExtraMethod(...args) {
          const label = `fs.${methodName}${formatPathForLog(args[0])}${formatPathForLog(args[1])}`;
          const startedAt = process.hrtime.bigint();
          log(`${label} started`);
          try {
            return await originalMethod.apply(this, args);
          } finally {
            log(`${label} finished in ${formatMs(elapsedMs(startedAt))}`);
          }
        };
      }
    },

    mark(label) {
      const now = process.hrtime.bigint();
      log(`${label}: +${formatMs(elapsedMs(lastMark, now))} (${formatMs(elapsedMs(startTime, now))} total)`);
      lastMark = now;
    },

    heartbeat() {
      const now = process.hrtime.bigint();
      log(`still running (${formatMs(elapsedMs(startTime, now))} total, ${formatMs(elapsedMs(lastMark, now))} since last phase)`);
    },

    hook(label) {
      return (...args) => {
        this.mark(label);
        const callback = args[args.length - 1];
        if (typeof callback === 'function') {
          callback();
        }
      };
    },

    total(label) {
      this.mark(label);
      if (!commandSummaries.size) {
        log('No codesign/security/spctl/xcrun subprocesses were observed.');
        return;
      }

      log('Subprocess summary:');
      [...commandSummaries.entries()]
        .sort((a, b) => b[1].totalMs - a[1].totalMs)
        .forEach(([commandLabel, summary]) => {
          log(`  ${commandLabel}: ${summary.count} run(s), ${formatMs(summary.totalMs)} total`);
        });
    },
  };
}

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
  afterInitialize: [profile.hook('afterInitialize')],
  afterExtract: [profile.hook('afterExtract'), stripElectronLocalePaks],
  beforeCopy: [profile.hook('beforeCopy')],
  afterCopy: [setLanguages(['en']), profile.hook('afterCopy')],
  afterPrune: [profile.hook('afterPrune')],
  afterComplete: [profile.hook('afterComplete')],
};

function isLocalePak(fileName) {
  return /^[a-z]{2,3}(-[A-Z]{2})?\.pak$/.test(fileName);
}

function findLocaleDirs(rootPath) {
  const localeDirs = [];
  const entries = fsExtra.readdirSync(rootPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry.name);
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name.endsWith('.lproj') && fsExtra.existsSync(path.join(entryPath, 'locale.pak'))) {
      localeDirs.push(entryPath);
      continue;
    }

    localeDirs.push(...findLocaleDirs(entryPath));
  }

  return localeDirs;
}

function stripElectronLocalePaks(buildPath, electronVersion, platform, arch, callback) {
  if (platform !== 'darwin' && platform !== 'mas') {
    callback();
    return;
  }

  const frameworkResourcesPath = path.join(
    buildPath,
    'Electron.app',
    'Contents',
    'Frameworks',
    'Electron Framework.framework',
    'Resources',
  );

  try {
    if (!fsExtra.existsSync(frameworkResourcesPath)) {
      console.warn(`[package-profile] Electron framework resources not found: ${frameworkResourcesPath}`);
      callback();
      return;
    }

    const removedLooseLocales = fsExtra
      .readdirSync(frameworkResourcesPath)
      .filter(fileName => isLocalePak(fileName) && !keptLocalePaks.has(fileName));

    for (const localePak of removedLooseLocales) {
      fsExtra.removeSync(path.join(frameworkResourcesPath, localePak));
    }

    const removedLocaleDirs = findLocaleDirs(frameworkResourcesPath).filter(
      localeDir => !keptLocaleDirs.has(path.basename(localeDir)),
    );

    for (const localeDir of removedLocaleDirs) {
      fsExtra.removeSync(localeDir);
    }

    console.log(
      `[package-profile] Removed ${removedLooseLocales.length} loose Electron locale .pak file(s) and ${removedLocaleDirs.length} Electron locale folder(s); kept ${[
        ...keptLocalePaks,
        ...keptLocaleDirs,
      ].join(', ')}`,
    );
    callback();
  } catch (err) {
    callback(err);
  }
}

async function packageTestBuild() {
  try {
    const appPaths = await packager(options);
    profile.total('packager complete');
    console.log(`Packaged app paths: ${appPaths}`);
  } catch (err) {
    profile.total('packager failed');
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('packageTestBuild option:', options);

const keepAlive = setInterval(() => profile.heartbeat(), 10000);

packageTestBuild().catch(err => {
  profile.total('top-level package failure');
  console.error(err);
  process.exitCode = 1;
}).finally(() => {
  clearInterval(keepAlive);
});
