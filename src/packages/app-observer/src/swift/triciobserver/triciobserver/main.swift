//
//  main.swift
//  turiya
//
//  Created by Shashi Singh on 31/01/23.
//

import Foundation

let logger: Logger

let env = ProcessInfo.processInfo.environment["APP_ENV"] ?? "devon"

let isProd = env == "prod"

var defaultLogsDirectoryPath: String

if let libraryDirectory = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first {

  let logsDirectory = isProd ? libraryDirectory.appendingPathComponent("Logs/trici") :  libraryDirectory.appendingPathComponent("Logs/TriciDev")
        defaultLogsDirectoryPath = logsDirectory.path
    } else {
        // Fallback to a hardcoded path if the Library directory cannot be resolved
      defaultLogsDirectoryPath = NSHomeDirectory() + (isProd ? "/Library/Logs/trici" : "/Library/Logs/TriciDev")
    }

LoggingService.logToStandardOutput(message: ["defaultLogsDirectoryPath": defaultLogsDirectoryPath])


var logsDirectoryPath: String

if CommandLine.arguments.count > 1 {
  LoggingService.logToStandardOutput(message: ["logsDirPathArg": "\(CommandLine.arguments[1])"])
//  print("logsDirPathArg:\(CommandLine.arguments[1])")
    logsDirectoryPath = CommandLine.arguments[1] // Use the first argument after the app name
} else {
    logsDirectoryPath = defaultLogsDirectoryPath // Fallback to default path
}


LoggingService.initializeLogging(logsDirectoryPath: logsDirectoryPath, logFilePrefix: "trici_observer")
if (!LoggingService.isInitialized()) {
    LoggingService.logToStandardError(message: [
        "errorMsg": "Logger initialization failed",
        "path": logsDirectoryPath
    ])
    exit(1)
}
logger = LoggingService.getLogger()

logger.info("Logger initialized. env:\(env)")

let frontmostObserver = FrontmostObserver(logger: logger)
let appObserverMethods = AppObserverMethods(logger: logger)




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
      let lines = strData.components(separatedBy: .newlines)
      for line in lines {
          let command = line.trimmingCharacters(in: .whitespacesAndNewlines)
          if command.isEmpty { continue }   // skip empty lines if needed

        logger.info("command:\(command)")

        switch command {
            case "getInstalledApps":
                DispatchQueue.global().async {
                    appObserverMethods.outputInstalledApps()
                }
            case "getActiveBrowserOpenedUrl":
                DispatchQueue.global().async {
                    appObserverMethods.getActiveBrowserOpenedURL()
                }
            case "getSystemIdleTime":
                DispatchQueue.global().async {
                    appObserverMethods.getSystemIdleTime()
                }
            case "exit":
                exit(0)
            default:
                DispatchQueue.global().async {
                    logger.error("{\"error\": \"Unknown command: \(command)\"}")
                    LoggingService.logToStandardError(
                      message: ["errorMsg": "Unknown command: \(command)"]
                    )
                }
        }
      }
  }

}
inputSource.resume()

RunLoop.current.run()
