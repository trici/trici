import * as fs from 'fs';
import * as path from 'path';
import config from '@trici/config';
import type { Logger } from '@trici/logger';
import { v5 as uuidv5 } from 'uuid';
import { generateSystemFingerprint } from './fingerprint';
import { Constants, IPC_SERVER_EVENTS } from '@trici/models';

import ipc from 'node-ipc';

function _getIpcConfig(showLogs: boolean = true, logger?: Logger): any {
  let ipcLogger = logger ? logger.info.bind(logger) : console.log.bind(console);
  return {
    id: config.ipcConfigId,
    retry: 500,
    maxRetries: 0,
    appspace: config.ipcConfigAppSpace,
    socketRoot: config.ipcConfigSocketRoot,
    silent: !showLogs,
    logger: ipcLogger,
    delimiter: config.ipcConfigDelimiter,
    stopRetrying: true,
  };
}

export interface ITriciIpcClient {
  connectAndPing: () => Promise<{ type: string; data: any }>;
  connectAndSendMessage: (msg: any) => Promise<{ success: boolean; message: string; data: any }>;
  disconnect: () => void;
}

/**
 * Create an IPC client
 * @param showLogs - Whether to show logs
 * @param logger - A logger instance
 * @returns {ITriciIpcClient} - An IPC client
 */
export function createIpcClient(showLogs: boolean = true, logger?: Logger): ITriciIpcClient {
  ipc.config = _getIpcConfig(showLogs, logger);
  const client = {
    connectAndPing: (): Promise<{ type: string; data: any }> => {
      return new Promise((resolve, reject) => {
        const ipcConfigId = config.ipcConfigId;
        ipc.connectTo(ipcConfigId, () => {
          ipc.of[ipcConfigId].on(IPC_SERVER_EVENTS.CONNECT, () => {
            ipc.of[ipcConfigId].emit(IPC_SERVER_EVENTS.PING, { msg: 'ping' });
          });
          ipc.of[ipcConfigId].on(IPC_SERVER_EVENTS.DISCONNECT, () => {
            // console.log("Client disconnected from node-ipc server");
          });
          ipc.of[ipcConfigId].on(IPC_SERVER_EVENTS.PING, message => {
            console.log('Client received message from node-ipc server: ', message);
            // const response = JSON.parse(message);
            // console.log("Client received message from node-ipc server: ", response);

            if (message.type === 'pong') {
              resolve(message);
            }
          });
        });
      });
    },
    connectAndSendMessage: (msg: any): Promise<{ success: boolean; message: string; data: any }> => {
      return new Promise((resolve, reject) => {
        const ipcConfigId = config.ipcConfigId;
        let connectionTimeout: NodeJS.Timeout;

        // Set a timeout to handle connection failures or unresponsive servers
        connectionTimeout = setTimeout(() => {
          if (ipc.of[ipcConfigId]) {
            ipc.disconnect(ipcConfigId);
          }
          reject(new Error('Connection timed out.'));
        }, 1500); // Adjust the timeout duration (in milliseconds) as needed

        ipc.connectTo(ipcConfigId, () => {
          ipc.of[ipcConfigId].on(IPC_SERVER_EVENTS.CONNECT, () => {
            clearTimeout(connectionTimeout);
            ipc.of[ipcConfigId].emit(IPC_SERVER_EVENTS.CLI_MESSAGE, msg);
          });

          ipc.of[ipcConfigId].on(IPC_SERVER_EVENTS.DISCONNECT, () => {
            console.log('Client disconnected from node-ipc server');
          });

          ipc.of[ipcConfigId].on(IPC_SERVER_EVENTS.ERROR, err => {
            clearTimeout(connectionTimeout);
            const connectError = new Error(`${err.message}`);
            connectError.name = 'ConnectError';
            reject(connectError);
          });

          ipc.of[ipcConfigId].on(IPC_SERVER_EVENTS.CLI_MESSAGE, response => {
            // console.log("got resp: " + JSON.stringify(response));
            resolve(response);
          });
        });
      });
    },
    disconnect: () => {
      // ipc.of[config.ipcConfigId].removeAllListeners();
      ipc.disconnect(config.ipcConfigId);
    },
    getConfig: () => {
      return ipc.config;
    },
  };
  return client;
}

// /**
//  * Deletes aa directory and the content inside it
//  * @param dirPath Path to the directory to be deleted
//  * @returns void
//  */
// export function deleteDirectoryWithContents(dirPath: string) {
//   return new Promise((resolve, reject) => {
//     // delete the logs directory
//     try {
//       fs.rm(dirPath, { recursive: true }, (err) => {
//         if (err) {
//           // throw err;
//           reject(err);
//         }
//         console.log("Deleted logs directory");
//         resolve(true);
//       });
//     } catch (err) {
//       console.error(err);
//       reject(err);
//     }
//   });
// }

// /**
//  * Get the version of the app based on the VERSION file
//  * @returns {string} - The version of the package
//  */
// export function getVersion(): string {
//   const versionFilePath = path.join(process.cwd(), 'VERSION');

//   if (fs.existsSync(versionFilePath)) {
//     const version = fs.readFileSync(versionFilePath, 'utf-8');
//     return version.trim();
//   } else {
//     return 'NaN';
//   }
// }

/**
 * Generate a UUIDv5
 * @description Generates a UUIDv5 based on the system fingerprint and the name parameter
 * @param name The name parameter to be used as the seed for the UUIDv5
 * @returns a uuid v5
 */
export async function generateUUIDv5(name: string) {
  try {
    let fingerprint = await generateSystemFingerprint();
    if (fingerprint === null) {
      throw new Error('Could not generate system fingerprint');
    }
    const uuidNamespace = uuidv5(fingerprint, uuidv5.DNS);
    const uuid = uuidv5(name, uuidNamespace);
    return uuid;
  } catch (error) {
    throw new Error(`Error generating UUIDv5: ${error}`);
  }
}

/**
 * Generate a new trici id for the given uuid and type
 * @description A trici is is a string of the form uuid_type_createdAtDate_muton_mutatedAtDate
 * @param uuid The uuid of the trici id
 * @param type The type of the trici id
 * @returns a trici id like 22d860cd-07e1-4d7f-bd9a-ca5ed5c242f_fss_1681757187_muton_1681757187
 *
 */
export function generateNewTriciId(uuid: string, type: string) {
  let createdAt = Date.now();
  let triciId = `${uuid}_${type}_${createdAt}_muton_${createdAt}`;
  return triciId;
}

/**
 * Generaet an uninitalized trici id for the given type
 * @description An unitialized trici id contains the keypart as well as the uninitialized part. By doing this we
 * know that this uninitialized trici id is of which type and for which keypart.
 * @param type The type of the trici id
 * @returns an uninitialized trici id like u22d860cd-07e1-4d7f-bd9a-ca5ed5c242f_fss_1681757187_muton_-1
 */
export function generateUninitializedTriciId(installationId: string, type: string) {
  let triciId = `${installationId}_${type}_${Date.now()}_muton_-1`;
  return triciId;
}

/**
 *  Generate an updated trici id for the given trici id
 * @description A trici is is a string of the form uuid_type_createdAtDate_muton_mutatedAtDate
 * @param triciId The trici id to be updated
 * @returns an updated trici id like 22d860cd-07e1-4d7f-bd9a-ca5ed5c242f9_fss_1681757187_muton_1681757187
 */
export function generateUpdatedTriciId(triciId: string) {
  if (!isValidTriciId(triciId)) {
    throw new Error(`Invalid trici id: ${triciId}`);
  }

  let mutatedAt = Date.now();
  let triciIdParts = triciId.split('_');
  triciIdParts[triciIdParts.length - 1] = mutatedAt.toString();
  let updatedTriciId = triciIdParts.join('_');
  return updatedTriciId;
}

/**
 * Tests the given id for the Trici ID format
 * @param id
 * @returns boolean
 */
// function isValidTriciId(id: string) {
//   let regex = /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})_(\w+)_(\d+)_muton_(\d+|-1)$/;
//   console.log('isValidTriciId: id: ' + id);
//   const isValid = regex.test(id.trim());
//   console.log('isValidTriciId: isValid: ' + isValid);
//   return isValid;
// }
function isValidTriciId(id: string) {
  const match = id
    .trim()
    .match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})_(\w+)_(\d+)_muton_(\d+|-1)$/);
  return match !== null;
}

/*
 * Check whether the given trici id is valid for today. A trici id is valid for today if the createdAt date is today
 * @param triciId The trici id to be checked
 * @returns true if the trici id is valid for today, false otherwise
 */
export function isTriciIdValidForToday(triciId: string) {
  let triciIdParts = triciId.split('_');
  let createdAt = parseInt(triciIdParts[2]);
  let createdAtDate = new Date(createdAt);
  let today = new Date();
  if (
    createdAtDate.getDate() === today.getDate() &&
    createdAtDate.getMonth() === today.getMonth() &&
    createdAtDate.getFullYear() === today.getFullYear()
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * Clear the node-ipc server socket
 * @param socketPath The path to the socket
 * @returns true if the socket was cleared, false otherwise
 * @description This function is used to clear the socket file that is used by the node-ipc server
 */
export function clearNodeIpcServerSocket(socketPath: string): boolean {
  console.log(`Clearing node-ipc server socket at ${socketPath}`);
  try {
    if (fs.existsSync(socketPath)) {
      fs.unlinkSync(socketPath);
      console.log('Socket file removed.');
      return true;
    } else {
      console.log('Socket file does not exist.');
      return false;
    }
  } catch (error) {
    console.error('Error removing socket file: ', error);
    return false;
  }
}

/**
 * Checks a condition and logs an error if the condition is false
 */
export function invariant(condition: boolean, message: string) {
  if (!condition) {
    console.error(message);
    throw Error(message);
  }
}

/**
 * Checks whether the passed application name is a web browser
 * @param appName The name of the application
 * @returns true if the application is a web browser, false otherwise
 */
export function isWebBrowser(appName: string): boolean {
  if (appName === undefined) {
    return false;
  }
  appName = appName.toLowerCase();
  return (
    appName.includes('chrome') ||
    appName.includes('firefox') ||
    appName.includes('safari') ||
    appName.includes('opera') ||
    appName.includes('edge') ||
    appName.includes('brave') ||
    appName.includes('arc')
  );
}
