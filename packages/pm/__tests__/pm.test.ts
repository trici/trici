/**
 * Test for the ProcessManager class
 */

import { ProcessManager } from "../src/ProcessManager";
import LoggingService from "@trici/logger";
import type { Logger } from "winston";
import { createIpcClient, cleanDirectory } from "@trici/utils";
import * as path from "path";

describe("ProcessManager", () => {
  let processManager: ProcessManager;
  let logger: Logger;

  // beforeAll(async () => {
  //   processManager = new ProcessManager();
  //   try {
  //     await cleanTestLogsDirectory();
  //     // Initialize the logger with the logs directory path to be the current directory
  //     const dirPath = path.join(__dirname, "logs");
  //     LoggingService.init(dirPath, "test-%DATE%.log", {
  //       installationId: "test-installation-id",
  //       appDetails: "darwin-dev-2.1.1",
  //     });
  //     console.log("Initialized logger");
  //   } catch (err) {
  //     console.log("Error initializing logger: ", err);
  //   }
  //   // delete the logs directory
  // });

  beforeAll(() => {
    console.log("Inside beforeAll");
    const dirPath = path.join(__dirname, "logs");
    // Return a Promise that resolves after the logger has been initialized
    return new Promise(async (resolve, reject) => {
      try {
        console.log("Cleaning test logs directory");
        await cleanDirectory(dirPath);
        console.log("Cleaned test logs directory");
      } catch (err) {
        console.log("Error initializing logger: ", err);
        reject(err);
      }

        // Initialize the logger with the logs directory path to be the current directory
        console.log("dirPath: ", dirPath);
        logger = LoggingService.init(dirPath, "test-%DATE%.log", {
          installationId: "test-installation-id",
          appDetails: "darwin-dev-2.1.1",
        });
        console.log("Initialized logger");
        processManager = new ProcessManager(logger);
        resolve(true);
    });
  });

  it("should return false if primary process is not registered", () => {
    expect(processManager.isPrimaryProcessRegistered()).toBe(false);
  });

  it("should register the primary process", () => {
    const processId = 123;
    processManager.registerPrimaryProcess(processId);
    expect(processManager.isPrimaryProcessRegistered()).toBe(true);
  });

  it("should throw an error if primary process is already registered", () => {
    const processId2 = 456;
    expect(() => processManager.registerPrimaryProcess(processId2)).toThrowError("Primary process already registered");
  });

  it("should accept connections and messages from ipc clients", async () => {
    const client = createIpcClient();
    try {
      const resp = await client.connectAndPing();
      expect(resp.type).toBe("pong");
      client.disconnect();
    } catch (error) {
      console.log(error);
      expect(error).toBe(null);
    }
  });

  it("should stop the primary process if registered", () => {
    processManager.killPrimaryProcess();
    setTimeout(() => {
      expect(processManager.isPrimaryProcessRegistered()).toBe(false);
    });
  });

  it("should throw an error if primary process is not registered", () => {
    expect(() => processManager.killPrimaryProcess()).toThrowError("Primary process not registered");
  });
});
