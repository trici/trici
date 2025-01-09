/**
 * This file contains utility functions that use the shelljs library
 * Sheljs uses dynamic require so it cannot be bundled and has to be
 * declared as an external dependency in the esbuild config. See https://github.com/evanw/esbuild/issues/1510#issuecomment-895616497
 * For this reason, we have a separate file for shelljs functions. This
 * will allow us to import other utility functions from the utils package
 * without the code failing. Earlier when there was a single file then we were
 * unable to import other utility functions from the utils package because
 * the code would fail when it tried to import shelljs.
 */
import fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec, ExecException } from 'child_process';

const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);
const execAsync = promisify(exec);

export declare type userDataDirectoryCheckResult = {
  workspacesDir: { exists: boolean; path: string; created: boolean };
  workspaceDir: { exists: boolean; path: string; created: boolean };
  recordingsDir: { exists: boolean; path: string; created: boolean };
  dataDir: { exists: boolean; path: string; created: boolean };
};

/**
 * Checks the user data directory and creates the required directories if they do not exist
 * @param userDataDirectoryPath This is typically the app.getPath('userData') value
 * @param workspaceName If there are multiple workspaces, then the name of the workspace. By default, it is 'default'
 * @returns Promise<userDataDirectoryCheckResult>
 * @example userDataDirectoryCheckResult = {
 *  workspacesDir: { exists: false, path: "/Users/username/Library/Application Support/Trici/workspaces", created: true },
 *  workspaceDir: { exists: false, path: "/Users/username/Library/Application Support/Trici/worskpaces/default", created: true },
 *  recordingsDir: { exists: false, path: "/Users/username/Library/Application Support/Trici/workspaces/default/recordings", created: true},
 *  dataDir: { exists: false, path: "/Users/username/Library/Application Support/Trici/workspaces/default/data", created: true },
 * }
 */
export async function checkUserDataDirectory(
  userDataDirectoryPath: string,
  workspaceName: string = 'default',
): Promise<userDataDirectoryCheckResult> {
  const result = {
    workspacesDir: { exists: false, path: '', created: false },
    workspaceDir: { exists: false, path: '', created: false },
    recordingsDir: { exists: false, path: '', created: false },
    dataDir: { exists: false, path: '', created: false },
  };

  const workspacesDir = `${userDataDirectoryPath}/workspaces`;
  result.workspacesDir.path = workspacesDir;

  try {
    await accessAsync(workspacesDir, fs.constants.F_OK);
    console.log('Trici workspaces data directory exists');
    result.workspacesDir.exists = true;
  } catch {
    await mkdirAsync(workspacesDir, { recursive: true });
    result.workspacesDir.created = true;
  }

  const workspaceDir = `${workspacesDir}/${workspaceName}`;
  result.workspaceDir.path = workspaceDir;

  try {
    await accessAsync(workspaceDir, fs.constants.F_OK);
    result.workspaceDir.exists = true;
  } catch {
    await mkdirAsync(workspaceDir, { recursive: true });
    result.workspaceDir.created = true;
  }

  const recordingsDir = `${workspaceDir}/recordings`;
  result.recordingsDir.path = recordingsDir;

  try {
    await accessAsync(recordingsDir, fs.constants.F_OK);
    result.recordingsDir.exists = true;
  } catch {
    await mkdirAsync(recordingsDir, { recursive: true });
    result.recordingsDir.created = true;
  }

  const dataDir = `${workspaceDir}/data`;
  result.dataDir.path = dataDir;

  try {
    await accessAsync(dataDir, fs.constants.F_OK);
    result.dataDir.exists = true;
  } catch {
    await mkdirAsync(dataDir, { recursive: true });
    result.dataDir.created = true;
  }

  return result;
}

export async function execShellCommandAsync(command: string, timeoutInSeconds: number = 0) {
  try {
    const { stdout } = await execAsync(command, { timeout: timeoutInSeconds * 1000 });
    return stdout;
  } catch (error) {
    const execError = error as ExecException & { stderr?: string };
    throw { code: execError.code, command: command, err: execError.stderr || 'Unknown Error' };
  }
}

/**
 * Get the version of the app based on the VERSION file
 * @returns {string} - The version of the package
 */
export function getVersion(): string {
  const versionFilePath = path.join(process.cwd(), 'VERSION');

  if (fs.existsSync(versionFilePath)) {
    const version = fs.readFileSync(versionFilePath, 'utf-8');
    return version.trim();
  } else {
    return 'NaN';
  }
}

/**
 * Deletes aa directory and the content inside it
 * @param dirPath Path to the directory to be deleted
 * @returns void
 */
export function deleteDirectoryWithContents(dirPath: string) {
  return new Promise((resolve, reject) => {
    // delete the logs directory
    try {
      fs.rm(dirPath, { recursive: true }, err => {
        if (err) {
          // throw err;
          reject(err);
        }
        console.log('Deleted logs directory');
        resolve(true);
      });
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}
