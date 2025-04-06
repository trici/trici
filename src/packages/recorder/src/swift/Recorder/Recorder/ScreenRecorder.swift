//
//  ScreenRecorder.swift
//  Recorder
//
//  Created by Shashi Singh on 23/05/24.
//


import Foundation
import ScreenCaptureKit
import AVFoundation
import CoreGraphics
import ImageIO
import VideoToolbox

class ScreenRecorder: NSObject {
  private var logger: Logger
  private var namedPipeFileHandle: FileHandle?
  private var captureEngine: CaptureEngine

    private(set) var availableDisplays = [SCDisplay]()

    var activeDisplay: SCDisplay? {
        didSet { updateEngine() }
    }

  init(logger:Logger) {
    self.logger = logger
    self.captureEngine = CaptureEngine(logger:logger)
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


  // Properties for managing the asset writer
  private var assetWriter: AVAssetWriter?
  private var assetWriterInput: AVAssetWriterInput?
  private var pixelBufferAdaptor: AVAssetWriterInputPixelBufferAdaptor?
  private var outputURL: URL?
  private var videoWriteQueue: DispatchQueue?
  private var startTime: Date?


    private var streamConfiguration: SCStreamConfiguration {
        let streamConfig = SCStreamConfiguration()

        let largestResolution = getHighestScreenResolution()

      streamConfig.width = Int(largestResolution.width)
      streamConfig.height = Int(largestResolution.height)

      streamConfig.width = 1920
      streamConfig.height = 1080

        streamConfig.showsCursor = true
        streamConfig.pixelFormat = kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange
//        streamConfig.pixelFormat = kCVPixelFormatType_32BGRA
        streamConfig.minimumFrameInterval = CMTime(value: 1, timescale: 7)
        streamConfig.scalesToFit = true

        streamConfig.queueDepth = 5

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


  func startraw() async {
      // Exit if already running
      guard !isRunning else { return }

      do {
          isRunning = true
          let config = streamConfiguration
          let filter = contentFilter
          logger.info("streamConfig: \(config)")
          logger.info("Opening named pipe")

        logger.debug("Checking namedPipeFileHandle: \(namedPipeFileHandle == nil ? "nil" : "not nil")")

        if namedPipeFileHandle == nil {
            let path = "/tmp/tricistream"

            if !FileManager.default.fileExists(atPath: path) {
                logger.error("Named pipe does not exist at \(path)")
            } else {
                logger.debug("Named pipe exists at \(path), but FileHandle initialization still failed.")
            }

            if let handle = FileHandle(forWritingAtPath: path) {
                namedPipeFileHandle = handle
            } else {
                logger.error("Failed to open named pipe: The pipe might not be ready for writing.")
                logger.debug("Returning early due to failed named pipe opening.")
                return
            }
        }

        let writeQueue = DispatchQueue(label: "com.gettrici.Recorder.WriteQueue")

        logger.info("Starting capture")

          Task {
              var frameCounter = 0
              let startTime = Date()
              do {
                  for try await output in captureEngine.startCapture(configuration: config, filter: filter, outputMode: false) {
                      if case .rawData(let rawData) = output {
                          let frameReceivedTime = Date()

                          // create a copy of the data so that the object is discarded and the surface is returned to the pool
                          // this prevents frame loss
                          let copiedData = Data(rawData)

                          // Dispatch the write operation to the writeQueue
                          writeQueue.async {
                              self.namedPipeFileHandle?.write(copiedData)
                              do {
                                  try self.namedPipeFileHandle?.synchronize()
                              } catch {
                                  self.logger.error("Failed to synchronize data to pipe: \(error.localizedDescription)")
                              }
                          }
                          frameCounter += 1
                      }
                  }

                  // Wait for all pending write operations to complete
                  writeQueue.sync {
                      // All write operations have completed
                    logger.info("Finished writing all frames from queue")
                  }
                  let endTime = Date()
                  let totalDuration = endTime.timeIntervalSince(startTime)
                  self.logger.info("Total duration: \(totalDuration) seconds")
                  self.logger.info("Total frames written: \(frameCounter)")
              } catch {
                  logger.error("Error during capture: \(error.localizedDescription)")
              }
              // Close the named pipe file handle
              namedPipeFileHandle?.closeFile()
              self.namedPipeFileHandle = nil  // Clear the handle after closing
              logger.info("Capture finished.")
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

          if !FileManager.default.fileExists(atPath: rawFilePath) {
              FileManager.default.createFile(atPath: rawFilePath, contents: nil, attributes: nil)
          }
          guard let fileHandle = try? FileHandle(forWritingTo: rawFileURL) else {
              logger.error("Failed to open raw data file for writing.")
              return
          }

          let writeQueue = DispatchQueue(label: "com.gettrici.Recorder.WriteQueue")
          logger.info("Starting Debug capture")
          Task {
              var frameCount = 0
              let expectedFrameSize = config.width * config.height * 3 / 2
              logger.info("Expected frame size: \(expectedFrameSize) bytes")
              logger.info("Configured resolution: \(config.width)x\(config.height)")

              // Log the start time
              let startTime = Date()
              logger.info("Capture started at: \(startTime)")

              for try await output in captureEngine.startCapture(configuration: config, filter: filter, outputMode: false) {
                  if case .rawData(let rawData) = output {
                      writeQueue.async {
                          fileHandle.write(rawData)
                      }
                      frameCount += 1

                      if frameCount == 1 || frameCount == 40 {
                          let actualSize = rawData.count
                          logger.info("Actual data size: \(actualSize) bytes")
                      }

                      if frameCount % 30 == 0 {  // Log every 30 frames
                          logger.info("Processed \(frameCount) frames. Last frame size: \(rawData.count) bytes")
                      }
                  }
              }

              writeQueue.sync {
                  logger.info("Finished writing queue contents")
              }

              // Log the end time
              let endTime = Date()
              logger.info("Capture ended at: \(endTime)")

              // Calculate total duration
              let totalDuration = endTime.timeIntervalSince(startTime)  // Duration in seconds
              logger.info("Total duration: \(totalDuration) seconds")

              // Calculate expected frames
              let frameRate: Double = 7.0
              let expectedFrames = totalDuration * frameRate
              logger.info("Expected frames (Total Duration x Frame Rate): \(expectedFrames)")

              logger.info("Total frames written: \(frameCount)")
              logger.info("Capture Engine stopped frames")
              fileHandle.closeFile()
              logger.info("Finished writing raw data to \(rawFilePath)")
          }

      } catch {
          logger.error("\(error.localizedDescription)")
          isRunning = false
      }
  }

  func start(outputPath: String) async {
      // Exit if already running
      guard !isRunning else { return }

      do {
          isRunning = true
          let config = streamConfiguration
          let filter = contentFilter

          // Setup Asset Writer
          outputURL = URL(fileURLWithPath: outputPath)
          // Remove existing file if it exists
          try? FileManager.default.removeItem(at: outputURL!)

          guard let writer = try? AVAssetWriter(outputURL: outputURL!, fileType: .mp4) else {
              logger.error("Failed to create asset writer.")
              isRunning = false
              return
          }
          assetWriter = writer

          // Configure video settings for fragmented MP4
          let videoSettings: [String: Any] = [
              AVVideoCodecKey: AVVideoCodecType.h264,
              AVVideoWidthKey: config.width,
              AVVideoHeightKey: config.height,
              AVVideoCompressionPropertiesKey: [
                  AVVideoAverageBitRateKey: 2000000, // 2 Mbps
                  AVVideoMaxKeyFrameIntervalKey: 50,
                  AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                  AVVideoAllowFrameReorderingKey: false, // Disable frame reordering for real-time
                  AVVideoExpectedSourceFrameRateKey: 7, // Tell encoder our expected frame rate
                  kVTCompressionPropertyKey_RealTime as String: true
              ]
          ]

          // Enable fragmented MP4 writing
          writer.movieFragmentInterval = CMTime(seconds: 1, preferredTimescale: 1) // Create fragments every second
          writer.shouldOptimizeForNetworkUse = true // This enables fragmented MP4

          let writerInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
          writerInput.expectsMediaDataInRealTime = true
          assetWriterInput = writerInput

          // Create pixel buffer adaptor
          let sourcePixelBufferAttributes: [String: Any] = [
              kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
              kCVPixelBufferWidthKey as String: config.width,
              kCVPixelBufferHeightKey as String: config.height,
              kCVPixelBufferIOSurfacePropertiesKey as String: [:]
          ]

          let adaptor = AVAssetWriterInputPixelBufferAdaptor(
              assetWriterInput: writerInput,
              sourcePixelBufferAttributes: sourcePixelBufferAttributes
          )
          pixelBufferAdaptor = adaptor

          writer.add(writerInput)
          writer.startWriting()

          videoWriteQueue = DispatchQueue(label: "com.gettrici.Recorder.VideoWriteQueue", qos: .userInteractive)
          var frameCount = 0
          var firstFrameTime: CMTime?

          logger.info("Starting fragmented MP4 video capture to \(outputPath)")
          startTime = Date()

          Task {
              do {
                  for try await output in captureEngine.startCapture(configuration: config, filter: filter, outputMode: true) {
                      if case .pixelBuffer(let pixelBuffer) = output {
                          if writerInput.isReadyForMoreMediaData {
                              // Get the actual timestamp for this frame
                              let timestamp = CMClockGetTime(CMClockGetHostTimeClock())

                              if firstFrameTime == nil {
                                  firstFrameTime = timestamp
                                  writer.startSession(atSourceTime: .zero)
                              }

                              // Calculate the presentation time relative to the first frame
                              let presentationTime = CMTimeSubtract(timestamp, firstFrameTime ?? timestamp)

                              videoWriteQueue?.async {
                                  adaptor.append(pixelBuffer, withPresentationTime: presentationTime)
                              }
                              frameCount += 1

                              if frameCount % 70 == 0 {
                                  let currentTime = CMTimeGetSeconds(presentationTime)
                                  let currentFPS = Double(frameCount) / currentTime
                                  self.logger.info("Processed \(frameCount) frames. Current FPS: \(String(format: "%.2f", currentFPS))")
                              }
                          } else {
                              self.logger.warn("Dropped frame - writer not ready")
                          }
                      }
                  }
              } catch {
                  logger.error("Error during video capture: \(error.localizedDescription)")
                  await stopRecording()
              }
          }

      } catch {
          logger.error("\(error.localizedDescription)")
          isRunning = false
      }
  }

  private func stopRecording() async {
      guard let writer = assetWriter,
            let writerInput = assetWriterInput,
            let writeQueue = videoWriteQueue,
            let startTime = startTime else {
          return
      }

      // Wait for all pending write operations to complete
      await withCheckedContinuation { continuation in
          writeQueue.async {
              writerInput.markAsFinished()
              writer.finishWriting {
                  let endTime = Date()
                  let duration = endTime.timeIntervalSince(startTime)
                  let status = writer.status
                  let error = writer.error

                  self.logger.info("Finished recording. Duration: \(duration) seconds")
                  if let error = error {
                      self.logger.error("AssetWriter finished with error: \(error.localizedDescription)")
                  }
                  if status == .failed {
                      self.logger.error("AssetWriter failed")
                  }

                  // Clean up resources
                  self.assetWriter = nil
                  self.assetWriterInput = nil
                  self.pixelBufferAdaptor = nil
                  self.videoWriteQueue = nil
                  self.startTime = nil
                  self.outputURL = nil

                  continuation.resume()
              }
          }
      }
  }

  func stop() async {
      guard isRunning else { return }

      // Call the asynchronous stopCapture method
      logger.debug("Stopping Capture")
      await captureEngine.stopCapture()

      // If we were recording video, finalize it
      if assetWriter != nil {
          await stopRecording()
      }

      isRunning = false
      logger.info("Stopped Recording")

      // Close named pipe if it was being used
      if let handle = self.namedPipeFileHandle {
          handle.closeFile()
          self.namedPipeFileHandle = nil
      }
  }

  func takeScreenshot(path: String) async {
      guard let display = activeDisplay else {
          let errorResponse: [String: Any] = [
              "type": "screenshot",
              "response": ["error": "No active display found"],
              "timestamp": Date().timeIntervalSince1970
          ]
          sendResponse(errorResponse)
          return
      }

      if let image = CGDisplayCreateImage(display.displayID) {
          let url = URL(fileURLWithPath: path)

          if let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) {
              CGImageDestinationAddImage(destination, image, nil)

              if CGImageDestinationFinalize(destination) {
                  let successResponse: [String: Any] = [
                      "type": "screenshot",
                      "response": ["status": "success", "path": path],
                      "timestamp": Date().timeIntervalSince1970
                  ]
                  sendResponse(successResponse)
              } else {
                  let errorResponse: [String: Any] = [
                      "type": "screenshot",
                      "response": ["error": "Failed to save screenshot"],
                      "timestamp": Date().timeIntervalSince1970
                  ]
                  sendResponse(errorResponse)
              }
          } else {
              let errorResponse: [String: Any] = [
                  "type": "screenshot",
                  "response": ["error": "Failed to create image destination"],
                  "timestamp": Date().timeIntervalSince1970
              ]
              sendResponse(errorResponse)
          }
      } else {
          let errorResponse: [String: Any] = [
              "type": "screenshot",
              "response": ["error": "Failed to capture screenshot"],
              "timestamp": Date().timeIntervalSince1970
          ]
          sendResponse(errorResponse)
      }
  }

  // Helper function to send JSON response
  private func sendResponse(_ response: [String: Any]) {
      if let data = try? JSONSerialization.data(withJSONObject: response),
         let jsonString = String(data: data, encoding: .utf8) {
          FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
      }
  }

}
