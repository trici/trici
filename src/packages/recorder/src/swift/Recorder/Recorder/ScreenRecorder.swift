//
//  ScreenRecorder.swift
//  Recorder
//
//  Created by Shashi Singh on 23/05/24.
//


import Foundation
import ScreenCaptureKit
import AVFoundation


class ScreenRecorder: NSObject {
  private let logger = LoggingService.shared.getLogger()
  private var namedPipeFileHandle: FileHandle?
    
    private(set) var availableDisplays = [SCDisplay]()
    
    var activeDisplay: SCDisplay? {
        didSet { updateEngine() }
    }
    
    override init() {
        super.init()
          NotificationCenter.default.addObserver(
              self,
              selector: #selector(handleActiveScreenChange(notification:)),
              name: .activeScreenDidChange,
              object: nil
          )
//          setupStreamConfiguration()
      }
    
    var isRunning = false
  
  private var scaleFactor: Int { Int(NSScreen.main?.backingScaleFactor ?? 2) }
  
  // The object that manages the SCStream.
    private let captureEngine = CaptureEngine()
  
  // Properties for managing the asset writer
  private var assetWriter: AVAssetWriter?
  private var assetWriterInput: AVAssetWriterInput?
  private var pixelBufferAdaptor: AVAssetWriterInputPixelBufferAdaptor?
  private var outputURL: URL?
    
    private var streamConfiguration: SCStreamConfiguration {
        let streamConfig = SCStreamConfiguration()
        
        let largestResolution = getHighestScreenResolution()
      
      streamConfig.width = Int(largestResolution.width)
      streamConfig.height = Int(largestResolution.height)
      
      streamConfig.width = 1920
      streamConfig.height = 1080
//      if let display = activeDisplay {
//        streamConfig.width = display.width * scaleFactor
//        streamConfig.height = display.height * scaleFactor
//      } else {
//        streamConfig.width = Int(largestResolution.width)
//        streamConfig.height = Int(largestResolution.height)
//        
//      }
        
        streamConfig.showsCursor = true
        streamConfig.pixelFormat = kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange
//        streamConfig.pixelFormat = kCVPixelFormatType_32BGRA
        streamConfig.minimumFrameInterval = CMTime(value: 1, timescale: 30)
        streamConfig.scalesToFit = true
        
        return streamConfig
        
        // capturesAudio etc is available only from Mac 13.0 onwards.
//        streamConfig.capturesAudio = false
//        streamConfig.excludesCurrentProcessAudio = true
    }
    
    private var contentFilter : SCContentFilter {
        var filter: SCContentFilter
        guard let display = activeDisplay else { fatalError("No active display found")}
        
        let excludedApps = [SCRunningApplication]()
//        // If a user chooses to exclude the app from the stream,
//        // exclude it by matching its bundle identifier.
//        if isAppExcluded {
//            excludedApps = availableApps.filter { app in
//                Bundle.main.bundleIdentifier == app.bundleIdentifier
//            }
//        }
        filter = SCContentFilter(display: display, excludingApplications: excludedApps, exceptingWindows: [])
        return filter
    }
    


    var canRecord: Bool {
        get async {
            do {
                // If the app doesn't have screen recording permission, this call generates an exception.
                try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
                return true
            } catch {
                return false
            }
        }
    }
    
    func refreshAvailableContent() async {
        do {
            // Retrieve the available screen content to capture.
            let availableContent = try await SCShareableContent.excludingDesktopWindows(false,
                                                                                        onScreenWindowsOnly: true)
            availableDisplays = availableContent.displays
            
            
            if activeDisplay == nil {
                activeDisplay = availableDisplays.first
            }
        } catch {
            logger.error("Failed to get the shareable content: \(error.localizedDescription)")
        }
    }
  
  func setActiveDisplay(activeDisplayId: NSNumber) {
      if let display = availableDisplays.first(where: { $0.displayID == activeDisplayId.uint32Value }) {
          activeDisplay = display
      } else {
        logger.error("Dispaly with ID \(activeDisplayId) not found in availabledDisplays")
      }
  }
  
    
    
    
    /// - Tag: UpdateCaptureConfig
    private func updateEngine() {
      logger.debug("UpdaingCaptureEngine")
        guard isRunning else { return }
      logger.debug("CaptureEngineUpdate")
        Task {
            let filter = contentFilter
            await captureEngine.update(configuration: streamConfiguration, filter: filter)
        }
    }
    
    @objc private func handleActiveScreenChange(notification: Notification) {
        logger.info("Inside handleActiveScreenChange")
            if let screen = notification.object as? NSScreen {
                let activeDisplayID = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as! CGDirectDisplayID
                // Iterate over available displays to find the main display
                        for display in availableDisplays {
                            if display.displayID == activeDisplayID {
                                activeDisplay = display
                              logger.info("Found and set active display: \(display)")
                                break
                            }
                        }
            }
        }
  
 
    
    func getHighestScreenResolution() -> CGSize {
   
        let screenSizes = NSScreen.screens.map { $0.frame.size }
           if let largestResolution = screenSizes.max(by: { $0.width * $0.height < $1.width * $1.height }) {
               return largestResolution
           } else {
               // Fallback, although this should never be hit due to always having at least one screen
               return NSScreen.main?.frame.size ?? CGSize.zero
           }
    }
    
    
    func start() async {
        // Exit if already running
        guard !isRunning else { return }
        
        do {
          isRunning = true
          let config = streamConfiguration
          let filter = contentFilter
          logger.info("streamConfig:\(config)")
          logger.info("Opening named pipe")
          // Attempt to open the file handle
              if namedPipeFileHandle == nil {
                  do {
                      let path = "/tmp/tricistream"
                    if let handle = FileHandle(forWritingAtPath: path) {
                            namedPipeFileHandle = handle
                        } else {
                            logger.error("Failed to open named pipe: The pipe might not be ready for writing.")
                            return
                        }
                    
                  }
              }
          
          logger.info("Starting capture")
          Task {
            for try await rawData in captureEngine.startCapture(configuration: config, filter: filter) {
              namedPipeFileHandle?.write(rawData)
            }
            logger.info("Capture Engine stopped frames")
            namedPipeFileHandle?.closeFile()
//            logger.info("Finished writing raw data to \(rawFilePath)")
          }
         
        } catch {
            logger.error("\(error.localizedDescription)")
            // Unable to start the stream. Set the running state to false.
            isRunning = false
        }
    }
  
  func startDebug() async {
      // Exit if already running
      guard !isRunning else { return }
      
      do {
        isRunning = true
        let config = streamConfiguration
        let filter = contentFilter

          let rawFilePath = "/Users/shashi/projects/trici/src/packages/recorder/recordings/testRecording.raw"
          let rawFileURL = URL(fileURLWithPath: rawFilePath)
          guard let fileHandle = try? FileHandle(forWritingTo: rawFileURL) else {
                   logger.error("Failed to open raw data file for writing.")
                   return
               }
        
        logger.info("Starting Debug capture")
        Task {
          var frameCount = 0;
          let expectedSize = config.width * config.height * 3 / 2
          logger.info("Expected frame size:\(expectedSize) bytes")
          logger.info("Configured resolution:\(config.width)x\(config.height)")
          
          for try await rawData in captureEngine.startCapture(configuration: config, filter: filter) {
            fileHandle.write(rawData)
            frameCount += 1
            
            if (frameCount == 1 || frameCount == 40) {
              let actualWidth = rawData.count/(config.height * 3/2)
              logger.info("Actual capture width (based on data size): \(actualWidth)")
              logger.info("Actual capture height (based on config): \(config.height)")
              logger.info("Actual data size: \(rawData.count)")
            }
            
            if frameCount % 30 == 0 {  // Log every 30 frames
              logger.info("Processed \(frameCount) frames. Last frame size: \(rawData.count)")
            }
          }
          logger.info("Capture Engine stopped frames")
          fileHandle.closeFile()
            logger.info("Finished writing raw data to \(rawFilePath)")
        }
       
      } catch {
          logger.error("\(error.localizedDescription)")
          // Unable to start the stream. Set the running state to false.
          isRunning = false
      }
  }
  
  func stop() async {
      guard isRunning else { return }

      // Attempt to stop the capture engine asynchronously
      do {
          // Call the asynchronous stopCapture method
        logger.debug("Stopping Capture")
          await captureEngine.stopCapture()
          isRunning = false
        
        
        logger.info("Stopped Recording")

//           Assuming fileHandle is managed and should be closed after stopping the capture
          if let handle = self.namedPipeFileHandle {
              handle.closeFile()
              self.namedPipeFileHandle = nil // Clear the handle after closing
          }

      } catch {
          // Log error if stopping the capture failed
          logger.error("Failed to stop capture: \(error.localizedDescription)")
      }
  }
    
}
