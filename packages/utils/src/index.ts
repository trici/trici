import * as fs from "fs";
import * as path from "path";
import { config } from "@trici/config";

import ipc from "node-ipc";

function _getIpcConfig(): any {
  return {
    id: config.ipcConfigId,
    retry: 500,
    maxRetries: 0,
    appspace: config.ipcConfigAppSpace,
    socketRoot: config.ipcConfigSocketRoot,
    logger: console.log,
    delimiter: config.ipcConfigDelimiter,
  };
}
ipc.config = _getIpcConfig();

export function createIpcClient() {
  const client = {
    connectAndPing: (): Promise<{ type: string; id: string }> => {
      return new Promise((resolve, reject) => {
        const ipcConfigId = config.ipcConfigId;
        ipc.connectTo(ipcConfigId, () => {
          ipc.of[ipcConfigId].on("connect", () => {
            console.log("Client connected to node-ipc server");
            console.log("sending ping");
            ipc.of[ipcConfigId].emit("ping", {msg: "ping"});
          });
          ipc.of[ipcConfigId].on("disconnect", () => {
            // console.log("Client disconnected from node-ipc server");
          });
          ipc.of[ipcConfigId].on("ping", (message) => {
            console.log("got ping: " + JSON.stringify(message));
            // const message = JSON.parse(data);

            if (message.type === "pong") {
              resolve(message);
            }
          });

        });
      });
    },
    disconnect: () => {
      // ipc.of[config.ipcConfigId].removeAllListeners();
      ipc.disconnect(config.ipcConfigId);
    }
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
