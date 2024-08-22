//
//  LoggingService.swift
//  Recorder
//
//  Created by Shashi Singh on 23/06/24.
//

import SwiftyBeaver

class LoggingService {
    
    // Singleton instance
    static let shared = LoggingService()
    
    // SwiftyBeaver logger instance
    private let log = SwiftyBeaver.self
    
    // Private initializer to set up logging destinations
    private init() {
        setupLogging()
    }
    
    // Method to set up logging destinations
    private func setupLogging() {
        
        // Add file log destination
        let file = FileDestination()
        file.minLevel = .verbose
      // Print the default log file URL
            if let logFileURL = file.logFileURL {
                print("Default log file path: \(logFileURL.path)")
            }
        log.addDestination(file)

        // Optionally, add other destinations like cloud logging
        // let cloud = SBPlatformDestination(appID: "appID", appSecret: "appSecret", encryptionKey: "encryptionKey")
        // log.addDestination(cloud)
    }
    
    // Method to return the logger instance
    func getLogger() -> SwiftyBeaver.Type {
        return log
    }
}

