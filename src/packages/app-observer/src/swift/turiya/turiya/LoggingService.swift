//
//  LoggingService.swift
//  turiya
//
//  Created by Shashi Singh on 21/09/24.
//

import CocoaLumberjackSwift
import Foundation


class Logger {
    // Logging methods
    func verbose(_ message: @autoclosure () -> DDLogMessageFormat,
                    level: DDLogLevel = .all,
                    context: Int = 0,
                    file: StaticString = #fileID,
                    function: StaticString = #function,
                    line: UInt = #line,
                    tag: Any? = nil,
                    asynchronous: Bool = true) {
        DDLogVerbose(message(),
                     level: level,
                     context: context,
                     file: file,
                     function: function,
                     line: line,
                     tag: tag,
                     asynchronous: asynchronous)
    }

    func debug(_ message: @autoclosure () -> DDLogMessageFormat,
                  level: DDLogLevel = .all,
                  context: Int = 0,
                  file: StaticString = #fileID,
                  function: StaticString = #function,
                  line: UInt = #line,
                  tag: Any? = nil,
                  asynchronous: Bool = true) {
        DDLogDebug(message(),
                   level: level,
                   context: context,
                   file: file,
                   function: function,
                   line: line,
                   tag: tag,
                   asynchronous: asynchronous)
    }

    func info(_ message: @autoclosure () -> DDLogMessageFormat,
                 level: DDLogLevel = .all,
                 context: Int = 0,
                 file: StaticString = #fileID,
                 function: StaticString = #function,
                 line: UInt = #line,
                 tag: Any? = nil,
                 asynchronous: Bool = true) {
        DDLogInfo(message(),
                  level: level,
                  context: context,
                  file: file,
                  function: function,
                  line: line,
                  tag: tag,
                  asynchronous: asynchronous)
    }

    func warn(_ message: @autoclosure () -> DDLogMessageFormat,
                    level: DDLogLevel = .all,
                    context: Int = 0,
                    file: StaticString = #fileID,
                    function: StaticString = #function,
                    line: UInt = #line,
                    tag: Any? = nil,
                    asynchronous: Bool = true) {
        DDLogWarn(message(),
                  level: level,
                  context: context,
                  file: file,
                  function: function,
                  line: line,
                  tag: tag,
                  asynchronous: asynchronous)
    }

    func error(_ message: @autoclosure () -> DDLogMessageFormat,
                  level: DDLogLevel = .all,
                  context: Int = 0,
                  file: StaticString = #fileID,
                  function: StaticString = #function,
                  line: UInt = #line,
                  tag: Any? = nil,
                  asynchronous: Bool = false) { // Errors are typically logged synchronously
        DDLogError(message(),
                   level: level,
                   context: context,
                   file: file,
                   function: function,
                   line: line,
                   tag: tag,
                   asynchronous: asynchronous)
    }
}

class CustomLogFormatter: NSObject, DDLogFormatter {
    private let dateFormatter: DateFormatter

    override init() {
        dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "HH:mm:ss.SSS" // Set your desired date format
        super.init()
    }

    func format(message logMessage: DDLogMessage) -> String? {
        // Format the timestamp
        let timestamp = dateFormatter.string(from: logMessage.timestamp)

        // Map log levels to strings
        let logLevel: String
        switch logMessage.flag {
        case .error:   logLevel = "ERROR"
        case .warning: logLevel = "WARN"
        case .info:    logLevel = "INFO"
        case .debug:   logLevel = "DEBUG"
        default:       logLevel = "VERBOSE"
        }

        // Get the file name without extension
        let fileName = (logMessage.fileName as NSString).lastPathComponent

        // Get the function name
        let functionName = logMessage.function ?? "Unknown"

        // Get the line number
        let lineNumber = logMessage.line

        // Get the log message
        let message = logMessage.message

        // Construct the formatted log string
        return "\(timestamp) \(logLevel) \(fileName).\(functionName):\(lineNumber) - \(message)"
    }
}


class LoggingService {

    // Singleton instance
    static let shared = LoggingService()
    
    private let logger = Logger()
    
    private static var initialized = false

    // Private initializer to prevent direct instantiation
    private init() {
        // Do nothing here; setupLogging should be called separately
    }
    
    static func initializeLogging(logsDirectoryPath:String, logFilePrefix: String) {
        let fileManager = FileManager.default
        let homeDirectory = fileManager.homeDirectoryForCurrentUser
        let logDirectoryURL = homeDirectory.appendingPathComponent(logsDirectoryPath)
        let logDirectoryPath = logDirectoryURL.path
        let logFileName =  logFilePrefix

        // Create the log directory if it doesn't exist
        if !fileManager.fileExists(atPath: logDirectoryPath) {
            do {
                try fileManager.createDirectory(atPath: logDirectoryPath, withIntermediateDirectories: true, attributes: nil)
                print("Log directory created at path: \(logDirectoryPath)")
            } catch {
                print("Failed to create log directory: \(error.localizedDescription)")
                initialized = false
                return
            }
        }

        // Set up logging
        shared.setupLogging(logDirectoryPath: logDirectoryPath, logFileName: logFileName)
        initialized = true
    }
    
    static func isInitialized() -> Bool {
        return initialized
    }
    
    static func getLogger() -> Logger? {
        if (isInitialized()) {
            return shared.logger
        } else {
            return nil
        }
    }
    
    
    // Method to set up logging destinations
    func setupLogging(logDirectoryPath: String, logFileName: String) {
        // Remove existing loggers to prevent duplicates
        DDLog.removeAllLoggers()

        // Optionally, add console logger (logs to Xcode console)
        DDLog.add(DDOSLogger.sharedInstance) // Uses os_log

        // Create a custom log file manager with the specified directory and file name
        let customLogFileManager = CustomLogFileManager(logsDirectory: logDirectoryPath, logFileName: logFileName)
        
        let customFormatter = CustomLogFormatter()

        // Initialize the file logger with the custom log file manager
        let fileLogger = DDFileLogger(logFileManager: customLogFileManager)

        // Configure file logger
        fileLogger.rollingFrequency = TimeInterval(60 * 60 * 24) // Roll logs every 24 hours
        fileLogger.logFileManager.maximumNumberOfLogFiles = 7     // Keep logs for 7 days
        fileLogger.logFormatter = customFormatter

        // Add the file logger to CocoaLumberjack
        DDLog.add(fileLogger)

        // Optional: Print the log file path for debugging
        if let currentLogFileInfo = fileLogger.currentLogFileInfo {
            print("Current log file path: \(currentLogFileInfo.filePath)")
        } else {
            print("Could not retrieve the current log file path.")
        }
    }
    
    // Custom log file manager to specify log file naming and location
    class CustomLogFileManager: DDLogFileManagerDefault {
        let customLogFileName: String

        init(logsDirectory: String, logFileName: String) {
            self.customLogFileName = logFileName
            super.init(logsDirectory: logsDirectory)
        }

        // Override the method with the correct signature
        override func createNewLogFile() throws -> String {
            // Create a date formatter for the log file naming
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"

            // Get the formatted date string
            let formattedDate = dateFormatter.string(from: Date())

            // Construct the new log file name
            let fileName = "\(customLogFileName)-\(formattedDate).log"

            // Get the full file path
            let filePath = (logsDirectory as NSString).appendingPathComponent(fileName)

            // Check if the file already exists to avoid overwriting
            if FileManager.default.fileExists(atPath: filePath) {
                // If the file already exists, return the file name
                return filePath
            }

            // Attempt to create the file
            do {
                let success = FileManager.default.createFile(atPath: filePath, contents: nil, attributes: nil)
                if success {
                    return filePath
                } else {
                    // If the file could not be created, throw an error
                    throw NSError(domain: "CustomLogFileManager", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to create log file at path: \(filePath)"])
                }
            } catch {
                // Rethrow any errors that occurred during file creation
                throw error
            }
        }

        override func isLogFile(withName fileName: String) -> Bool {
            // Check if the file name matches the custom log file naming pattern
            return fileName.hasPrefix(customLogFileName) && fileName.hasSuffix(".log")
        }
    }

    // Updated logging methods using the new API
        func logVerbose(_ message: @autoclosure () -> DDLogMessageFormat,
                        level: DDLogLevel = .all,
                        context: Int = 0,
                        file: StaticString = #fileID,
                        function: StaticString = #function,
                        line: UInt = #line,
                        tag: Any? = nil,
                        asynchronous: Bool = true) {
            DDLogVerbose(message(), level: level, context: context, file: file, function: function, line: line, tag: tag, asynchronous: asynchronous)
        }

        func logDebug(_ message: @autoclosure () -> DDLogMessageFormat,
                      level: DDLogLevel = .all,
                      context: Int = 0,
                      file: StaticString = #fileID,
                      function: StaticString = #function,
                      line: UInt = #line,
                      tag: Any? = nil,
                      asynchronous: Bool = true) {
            DDLogDebug(message(), level: level, context: context, file: file, function: function, line: line, tag: tag, asynchronous: asynchronous)
        }

        func logInfo(_ message: @autoclosure () -> DDLogMessageFormat,
                     level: DDLogLevel = .all,
                     context: Int = 0,
                     file: StaticString = #fileID,
                     function: StaticString = #function,
                     line: UInt = #line,
                     tag: Any? = nil,
                     asynchronous: Bool = true) {
            DDLogInfo(message(), level: level, context: context, file: file, function: function, line: line, tag: tag, asynchronous: asynchronous)
        }

        func logWarning(_ message: @autoclosure () -> DDLogMessageFormat,
                        level: DDLogLevel = .all,
                        context: Int = 0,
                        file: StaticString = #fileID,
                        function: StaticString = #function,
                        line: UInt = #line,
                        tag: Any? = nil,
                        asynchronous: Bool = true) {
            DDLogWarn(message(), level: level, context: context, file: file, function: function, line: line, tag: tag, asynchronous: asynchronous)
        }

        func logError(_ message: @autoclosure () -> DDLogMessageFormat,
                      level: DDLogLevel = .all,
                      context: Int = 0,
                      file: StaticString = #fileID,
                      function: StaticString = #function,
                      line: UInt = #line,
                      tag: Any? = nil,
                      asynchronous: Bool = false) { // Errors are typically logged synchronously
            DDLogError(message(), level: level, context: context, file: file, function: function, line: line, tag: tag, asynchronous: asynchronous)
        }
}
