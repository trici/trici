/**
 * Test for logger.
 */

import LoggingService from "../dist/index";
import fs from "fs";
import path from "path";
import { config as Config } from "@trici/config";

function getLogFileName() {
  const now = new Date();
  return `test-${now.toISOString().slice(0, 10)}-${now.getHours()}.log`;
}

describe("Logging library", () => {
  beforeAll((done) => {
    // delete the logs directory
    const dirPath = path.join(__dirname, "logs");
    try {
      fs.rm(dirPath, { recursive: true }, (err) => {
        if (err) {
          // throw err;
        }
        console.log("Deleted logs directory");
        // Initialize the logging library with a test logs directory and log file name format
        LoggingService.init(path.join(__dirname, "logs"), "test-%DATE%.log", {
          installationId: Config.defaultInstallationId,
          appDetails: "darwin-dev-2.1.1",
        });
        done();
      });
    } catch (err) {
      console.log("Error deleting logs directory: ", err);
      done();
    }
  });

  it("should create a log file", (done) => {
    // Get the logger
    const logger = LoggingService.getLogger();

    // Log a message
    logger.info("Test log message");

    // Wait for the log file to be written
    setTimeout(() => {
      // Read the contents of the log file
      const logFilePath = path.join(__dirname, "logs", getLogFileName());
      const logFileContent = fs.readFileSync(logFilePath, "utf-8");

      // Verify that the log file contains the expected message
      expect(logFileContent).toContain("Logger initialized");
      expect(logFileContent).toContain("Test log message");

      done();
    }, 1000);
    logger.close();
  });
});
