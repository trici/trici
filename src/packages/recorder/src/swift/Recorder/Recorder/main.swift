//
//  main.swift
//  Recorder
//
//  Created by Shashi Singh on 23/05/24.
//

import Foundation

let logger: Logger

let env = ProcessInfo.processInfo.environment["APP_ENV"] ?? "dev"

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

//let isProd = env == "prod"
//
//var logsDirectoryPath = isProd ? "/Library/Logs/trici" :  "/Library/Logs/TriciDev"
//
LoggingService.initializeLogging(logsDirectoryPath: logsDirectoryPath, logFilePrefix: "trici_recorder")
if (!LoggingService.isInitialized()) {
    LoggingService.logToStandardError(message: [
        "errorMsg": "Logger initialization failed",
        "path": logsDirectoryPath
    ])
    exit(1)
}
logger = LoggingService.getLogger()

logger.info("Logger initialized")

let now = Date()
let dateFormatter = DateFormatter()

dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"

let dateString = dateFormatter.string(from: now)
// ScreenRecorder has to be initialized before activeScreenObserver
let screenRecorder = ScreenRecorder(logger:logger)
Task {
    await screenRecorder.refreshAvailableContent()
    let canRecord = await screenRecorder.canRecord
    logger.info("Can record: \(canRecord)")
    print("TriciRecorder v1.0 Current Time: \(dateString)")
}



let activeScreenObserver = ActiveScreenObserver(logger: logger)
activeScreenObserver.startObserver()

if let activeScreenId = activeScreenObserver.getActiveScreenID() {
  screenRecorder.setActiveDisplay(activeDisplayId: activeScreenId)
} else {
  logger.error("Active screenID is null")
}




// Setup input handler using DispatchSource
let inputSource = DispatchSource.makeReadSource(fileDescriptor: STDIN_FILENO, queue: DispatchQueue.main)
inputSource.setEventHandler {
    let inputData = FileHandle.standardInput.availableData
    if let strData = String(data: inputData, encoding: .utf8) {
        let commandLine = strData.trimmingCharacters(in: .whitespacesAndNewlines)
        let components = commandLine.split(separator: " ", maxSplits: 1)
        let command = String(components[0])

        switch command {
        case "start":
          Task {
            await screenRecorder.start()
          }

        case "startdebug":
          Task {
            await screenRecorder.startDebug()
          }
        case "stop":
          Task {
            await screenRecorder.stop()
          }
        case "screenshot":
          if components.count > 1 {
              let screenshotPath = String(components[1])
              Task {
                  await screenRecorder.takeScreenshot(path: screenshotPath)
              }
          } else {
            LoggingService.logToStandardError(message: ["error": "Screenshot command requires a path"])
          }
        case "getResolution":
          let resolution = screenRecorder.getHighestScreenResolution()
          let logMessage = "{\"resolution\": \"\(resolution)\"}"
          LoggingService.logToStandardOutput(message: ["resolution": "\(resolution)"])
        case "getActiveScreen":
          let activeDisplay = screenRecorder.activeDisplay
        case "exit":
            exit(0)
        default:
          LoggingService.logToStandardError(message: ["error": "Unknown command: \(command)"])
        }
    }
}
inputSource.resume()

RunLoop.main.run()

