//
//  main.swift
//  turiya
//
//  Created by Shashi Singh on 31/01/23.
//

import Foundation

let logger: Logger

let env = ProcessInfo.processInfo.environment["APP_ENV"] ?? "dev"

let isProd = env == "prod"

var logsDirectoryPath = isProd ? "/Library/Logs/trici" :  "/Library/Logs/TriciDev"

LoggingService.initializeLogging(logsDirectoryPath: logsDirectoryPath, logFilePrefix: "trici_observer")
if (!LoggingService.isInitialized()) {
  print("Logger not initialized")
  exit(1)
} else {
  logger = LoggingService.getLogger()
}

logger.info("Logger initialized")

let frontmostObserver = FrontmostObserver()
let appObserverMethods = AppObserverMethods()



let fileManager = FileManager.default
let isReadable = fileManager.isReadableFile(atPath: "/Applications")
print("isReadable: ", isReadable)
print(isReadable)  // true if readable, false otherwise

frontmostObserver.startObserver()

// Setup input handler using DispatchSource
let inputSource = DispatchSource.makeReadSource(fileDescriptor: STDIN_FILENO, queue: DispatchQueue.main)
inputSource.setEventHandler {
    let inputData = FileHandle.standardInput.availableData
    if let strData = String(data: inputData, encoding: .utf8) {
        let command = strData.trimmingCharacters(in: .whitespacesAndNewlines)
        switch command {
        case "getInstalledApps":
            appObserverMethods.outputInstalledApps()
        case "getActiveBrowserOpenedUrl":
            appObserverMethods.getActiveBrowserOpenedURL()
        case "exit":
            exit(0)
        default:
            print("{\"error\": \"Unknown command: \(command)\"}")
        }
    }
}
inputSource.resume()

RunLoop.current.run()
