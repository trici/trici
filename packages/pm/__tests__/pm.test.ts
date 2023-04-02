/**
 * Test for the ProcessManager class
 */

import { ProcessManager } from "../src/ProcessManager";
import LoggingService from "@trici/logger";

describe("ProcessManager", () => {
  let processManager: ProcessManager;

  beforeAll(() => {
    // Initialize the logger with the logs directory path to be the current directory
    LoggingService.init(__dirname, "test-%DATE%.log", {installationId: "test-installation-id", appDetails: "darwin-dev-2.1.1"})
    console.log("Initialized logger");
    processManager = new ProcessManager();
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

  it("should stop the primary process if registered", () => {
    processManager.killPrimaryProcess();
    expect(processManager.isPrimaryProcessRegistered()).toBe(false);
  });

  it("should throw an error if primary process is not registered", () => {
    expect(() => processManager.killPrimaryProcess()).toThrowError("Primary process not registered");
  });

});
