//
//  main.swift
//  Recorder
//
//  Created by Shashi Singh on 23/05/24.
//

import Foundation

let logger = LoggingService.shared.getLogger()

let now = Date()
let dateFormatter = DateFormatter()

dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"

let dateString = dateFormatter.string(from: now)
// ScreenRecorder has to be initialized before activeScreenObserver
let screenRecorder = ScreenRecorder()
Task {
    await screenRecorder.refreshAvailableContent()
    let canRecord = await screenRecorder.canRecord
    logger.info("Can record: \(canRecord)")
    print("TriciRecorder v1.0 Current Time: \(dateString)")
}



let activeScreenObserver = ActiveScreenObserver()
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
        let command = strData.trimmingCharacters(in: .whitespacesAndNewlines)
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
        case "getResolution":
          let resolution = screenRecorder.getHighestScreenResolution()
          let logMessage = "{\"resolution\": \"\(resolution)\"}"
          logger.info(logMessage)
          FileHandle.standardOutput.write("\(logMessage)\n".data(using: .utf8)!)
        case "getActiveScreen":
          let activeDisplay = screenRecorder.activeDisplay
        case "exit":
            exit(0)
        default:
          let msg = "{\"error\": \"Unknown command: \(command)\"}"
          if (screenRecorder.isRunning) {
            logger.error(msg)
          } else {
            print("{\"error\": \"Unknown command: \(command)\"}") 
          }
           
        }
    }
}
inputSource.resume()

RunLoop.main.run()

