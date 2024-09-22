//
//  main.swift
//  turiya
//
//  Created by Shashi Singh on 31/01/23.
//

import Foundation

let frontmostObserver = FrontmostObserver()
let appObserverMethods = AppObserverMethods()

let logger: Logger?

// Initialize the logger
LoggingService.initializeLogging(logsDirectoryPath: "Library/Logs/TriciDev", logFilePrefix: "trici_turiya")

if (!LoggingService.isInitialized()) {
    print("Logger not initialized")
    exit(1)
} else {
    logger = LoggingService.getLogger()
}

logger?.info("Logger initialized")

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
