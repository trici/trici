import * as fs from "fs";
import * as path from "path";
import config from "@trici/config";
import type { Logger } from "@trici/logger";
import { v5 as uuidv5 } from "uuid";
import { generateSystemFingerprint } from "./fingerprint";
import ipc from "node-ipc";

function _getIpcConfig(showLogs: boolean = true, logger?: Logger): any {
  let ipcLogger = logger ?  logger.info.bind(logger) : console.log.bind(console);
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

export function createIpcClient(showLogs: boolean, logger?: Logger) {
  ipc.config = _getIpcConfig(showLogs,logger);
  const client = {
    connectAndPing: (): Promise<{ type: string; id: string }> => {
      return new Promise((resolve, reject) => {
        const ipcConfigId = config.ipcConfigId;
        ipc.connectTo(ipcConfigId, () => {
          ipc.of[ipcConfigId].on("connect", () => {
            ipc.of[ipcConfigId].emit("ping", { msg: "ping" });
          });
          ipc.of[ipcConfigId].on("disconnect", () => {
            // console.log("Client disconnected from node-ipc server");
          });
          ipc.of[ipcConfigId].on("ping", (message) => {
            // const message = JSON.parse(data);

            if (message.type === "pong") {
              resolve(message);
            }
          });
        });
      });
    },
    connectAndSendMessage: (msg: any): Promise<{ type: string; id: string }> => {
      return new Promise((resolve, reject) => {
        const ipcConfigId = config.ipcConfigId;
        let connectionTimeout;

        // Set a timeout to handle connection failures or unresponsive servers
        connectionTimeout = setTimeout(() => {
          if (ipc.of[ipcConfigId]) {
            ipc.disconnect(ipcConfigId);
          }
          reject(new Error('Connection timed out.'));
        }, 1500); // Adjust the timeout duration (in milliseconds) as needed

        ipc.connectTo(ipcConfigId, () => {
          ipc.of[ipcConfigId].on('connect', () => {
            clearTimeout(connectionTimeout);
            ipc.of[ipcConfigId].emit('cli.message', msg);
          });

          ipc.of[ipcConfigId].on('disconnect', () => {
            // console.log('Client disconnected from node-ipc server');
          });

          ipc.of[ipcConfigId].on('error', (err) => {
            clearTimeout(connectionTimeout);
            const connectError = new Error(`${err.message}`);
            connectError.name = "ConnectError";
            reject(connectError);
          });

          ipc.of[ipcConfigId].on('cli.message', (response) => {
            console.log('got resp: ' + JSON.stringify(response));
            resolve(response);
          });
        });
      });
    },
    disconnect: () => {
      // ipc.of[config.ipcConfigId].removeAllListeners();
      ipc.disconnect(config.ipcConfigId);
    },
  };
  return client;
}

export function cleanDirectory(dirPath) {
  return new Promise((resolve, reject) => {
    // delete the logs directory
    try {
      fs.rm(dirPath, { recursive: true }, (err) => {
        if (err) {
          // throw err;
          reject(err);
        }
        console.log("Deleted logs directory");
        resolve(true);
      });
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}

export function getVersion(): string {
  const versionFilePath = path.join(process.cwd(), "VERSION");

  if (fs.existsSync(versionFilePath)) {
    const version = fs.readFileSync(versionFilePath, "utf-8");
    return version.trim();
  } else {
    return "NaN";
  }
}

export async function generateUUIDv5(name) {
  try {
    const fingerprint = await generateSystemFingerprint();
    const uuidNamespace = uuidv5(fingerprint, uuidv5.DNS);
    const uuid = uuidv5(name, uuidNamespace);
    return uuid;
  } catch (error) {
    throw new Error(`Error generating UUIDv5: ${error}`);
  }
}
