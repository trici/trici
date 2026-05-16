// Update and copy godown tests into the platform-specific build folder.
// Invoked via run-script-os which selects the correct platform variant.
// Usage: pnpm run sync-tests-to-build

const fs = require('fs-extra');
const path = require('path');
const { platform: osPlatform } = require('os');

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

// determine target platform from os
const osP = osPlatform();
let targetPlatform;
if (osP === 'darwin') targetPlatform = 'darwin';
else if (osP === 'linux') targetPlatform = 'linux';
else if (osP === 'win32') targetPlatform = 'win32';
else targetPlatform = osP;

log(`Target platform: ${targetPlatform}`);

const pkgDir = __dirname; // src/packages/desktop
const godownTestsPath = path.join(pkgDir, 'godown', targetPlatform, '__tests__');
const alternateGodownPath = path.join(pkgDir, 'godown');
const buildPath = path.join(pkgDir, '..', '..', '..', 'builds', targetPlatform);

// locate source tests
let srcTestsExists = fs.existsSync(godownTestsPath);
let srcTestsPath = godownTestsPath;
if (!srcTestsExists) {
  // try to find any __tests__ under godown/<platform> or godown/**
  warn(`${godownTestsPath} not found. Searching godown for __tests__`);
  if (fs.existsSync(alternateGodownPath)) {
    const entries = fs.readdirSync(alternateGodownPath, { withFileTypes: true });
    for (const e of entries) {
      const candidate = path.join(alternateGodownPath, e.name, '__tests__');
      if (fs.existsSync(candidate)) {
        srcTestsPath = candidate;
        srcTestsExists = true;
        ok(`Found tests at ${srcTestsPath}`);
        break;
      }
    }
  }
}

if (!srcTestsExists) {
  err('No source __tests__ directory found under godown for the target platform. Nothing to copy.');
  process.exit(1);
}

// ensure build path exists
fs.ensureDirSync(buildPath);

const destTestsPath = path.join(buildPath, '__tests__');

try {
  // remove existing tests in build and copy fresh
  if (fs.existsSync(destTestsPath)) {
    log(`Removing existing tests at ${destTestsPath}`);
    fs.removeSync(destTestsPath);
  }

  log(`Copying tests from ${srcTestsPath} → ${destTestsPath}`);
  fs.copySync(srcTestsPath, destTestsPath, { overwrite: true });
  ok('Tests copied successfully');

  const srcPlaywrightConfig = path.join(path.dirname(srcTestsPath), 'playwright.config.js');
  if (fs.existsSync(srcPlaywrightConfig)) {
    const destPlaywrightConfig = path.join(buildPath, 'playwright.config.js');
    log(`Copying playwright.config.js → ${destPlaywrightConfig}`);
    fs.copySync(srcPlaywrightConfig, destPlaywrightConfig, { overwrite: true });
    ok('playwright.config.js copied successfully');
  } else {
    warn(`playwright.config.js not found at ${srcPlaywrightConfig} — skipping`);
  }

  // Basic normalization: convert any .feature or step files if a lightweight edit is needed
  // (safe no-op unless specific placeholder exists). Example: replace __BUILD_PLACEHOLDER__ if present.
  const walk = dir => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) {
        if (p.endsWith('.feature') || p.endsWith('.js') || p.endsWith('.ts')) {
          let content = fs.readFileSync(p, 'utf8');
          if (content.includes('__BUILD_PLACEHOLDER__')) {
            content = content.replace(/__BUILD_PLACEHOLDER__/g, buildPath);
            fs.writeFileSync(p, content, 'utf8');
            ok(`Patched placeholders in ${p}`);
          }
        }
      }
    }
  };

  walk(destTestsPath);

  ok(`Updated build tests in ${destTestsPath}`);
  process.exit(0);
} catch (e) {
  err(`Failed updating tests: ${e.message}`);
  process.exit(2);
}
