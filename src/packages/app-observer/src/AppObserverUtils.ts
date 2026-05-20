import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { parse as parsePlist } from 'plist';

export interface InstalledApp {
  name: string;
  iconPath: string;
  appIdentifier: string;
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  if (process.platform === 'darwin') {
    return getMacOSInstalledApps();
  }
  if (process.platform === 'win32') {
    throw new Error('getInstalledApps: Windows not yet implemented');
  }
  if (process.platform === 'linux') {
    throw new Error('getInstalledApps: Linux not yet implemented');
  }
  throw new Error(`getInstalledApps: Unsupported platform: ${process.platform}`);
}

async function getMacOSInstalledApps(): Promise<InstalledApp[]> {
  const appDirs = [
    '/Applications',
    '/System/Applications',
    path.join(os.homedir(), 'Applications'),
  ];

  const results = await Promise.all(
    appDirs.map(dir => scanAppDirectory(dir))
  );

  return results.flat();
}

async function scanAppDirectory(dir: string): Promise<InstalledApp[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }

  const apps: InstalledApp[] = [];
  for (const entry of entries) {
    if (!entry.endsWith('.app')) continue;
    const appPath = path.join(dir, entry);
    try {
      const app = await parseApp(appPath);
      apps.push(app);
    } catch (err) {
      // Skip apps that fail to parse — e.g. broken bundles or asset-catalog-only icons
    }
  }
  return apps;
}

async function parseApp(appPath: string): Promise<InstalledApp> {
  const plistPath = path.join(appPath, 'Contents', 'Info.plist');
  const plistContent = await fs.readFile(plistPath, 'utf-8');
  const info = parsePlist(plistContent) as Record<string, unknown>;

  const name =
    (info['CFBundleDisplayName'] as string | undefined) ??
    (info['CFBundleName'] as string | undefined) ??
    path.basename(appPath, '.app');

  const appIdentifier = info['CFBundleIdentifier'] as string | undefined;
  if (!appIdentifier) {
    throw new Error(`No CFBundleIdentifier in Info.plist for ${appPath}`);
  }

  const iconPath = extractIcon(appPath, appIdentifier, info);

  return { name, iconPath, appIdentifier };
}

function extractIcon(appPath: string, appIdentifier: string, info: Record<string, unknown>): string {
  const iconFile =
    (info['CFBundleIconFile'] as string | undefined) ??
    (info['CFBundleIconName'] as string | undefined);

  if (!iconFile) {
    throw new Error(`No icon entry in Info.plist for ${appPath}`);
  }

  const icnsName = iconFile.endsWith('.icns') ? iconFile : `${iconFile}.icns`;
  const icnsPath = path.join(appPath, 'Contents', 'Resources', icnsName);
  const iconOutPath = path.join(os.tmpdir(), `${appIdentifier}.png`);

  execSync(`sips -s format png "${icnsPath}" --out "${iconOutPath}" --resampleWidth 100`, {
    stdio: 'ignore',
  });

  return iconOutPath;
}
