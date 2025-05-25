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

final class ScreenRecorder: NSObject {
  //MARK: - Configuration
  private var logger: Logger
  private var namedPipeFileHandle: FileHandle?
  private var captureEngine: CaptureEngine

  //MARK: - Capture Targets
  private(set) var availableDisplays = [SCDisplay]()
  var activeDisplay: SCDisplay? {
    didSet { updateEngine() }
  }

  //MARK: - Running State
  private var isRunning = false
  private var stopCaptureCalled = false


  //MARK: Segment duration
  private let defaultSegmentDuration: TimeInterval = 15 //seconds
  private var segmentDuration: TimeInterval

  //MARK: - Segment State
  private var segmentIndex: Int = 1
  private var segmentStartTime: CMTime?
  private var baseUrl: URL? //stripped of mp4

  private var scaleFactor: Int { Int(NSScreen.main?.backingScaleFactor ?? 2) }


  //MARK: - AVAssetWriter State
  private var currentWriter: AVAssetWriter?
  private var currentInput: AVAssetWriterInput?
  private var currentAdaptor: AVAssetWriterInputPixelBufferAdaptor?
  private var firstFrameTime: CMTime?
  private var lastBuffer: CVPixelBuffer? //store last received frame

  //MARK: -
  private var videoWriteQueue: DispatchQueue?
  private var startTime: Date?



  init(logger:Logger) {
    self.logger = logger
    self.captureEngine = CaptureEngine(logger:logger)
    self.segmentDuration = defaultSegmentDuration
    super.init()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleActiveScreenChange(notification:)),
      name: .activeScreenDidChange,
      object: nil
    )
  }

  private func createSegmentWriter(index: Int, config: SCStreamConfiguration) throws {
    guard let baseUrl = baseUrl else { return }
    let dir = baseUrl.deletingLastPathComponent()
    let name = baseUrl.lastPathComponent
    let segmentName = String(format:"%@_%04d.mp4", name, index)
    let outURL = dir.appendingPathComponent(segmentName)

    try? FileManager.default.removeItem(at: outURL)

    let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true
    writer.movieFragmentInterval = CMTime(seconds: 1, preferredTimescale: 1)

    let videoSettings: [String:Any] = [
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

    let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
    input.expectsMediaDataInRealTime = true

    let adaptorAttrs: [String: Any] = [
      kCVPixelBufferPixelFormatTypeKey as String: config.pixelFormat,
      kCVPixelBufferWidthKey as String: config.width,
      kCVPixelBufferHeightKey as String: config.height,
      kCVPixelBufferIOSurfacePropertiesKey as String: [:]
    ]

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
      assetWriterInput: input,
      sourcePixelBufferAttributes: adaptorAttrs
    )

    writer.add(input)

    self.currentWriter = writer
    self.currentInput = input
    self.currentAdaptor = adaptor

  }


  private var streamConfiguration: SCStreamConfiguration {
    let streamConfig = SCStreamConfiguration()

    streamConfig.width = 1920
    streamConfig.height = 1080

    streamConfig.showsCursor = true
    streamConfig.pixelFormat = kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange
    streamConfig.minimumFrameInterval = CMTime(value: 1, timescale: 7)
    streamConfig.scalesToFit = true

    streamConfig.queueDepth = 5

    return streamConfig

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



  func start(outputPath: String, segmentDuration: TimeInterval? = nil) async {
    // Exit if already running
    guard !isRunning else { return }

    // Validate and set segment duration if provided
    if let duration = segmentDuration {
      if duration >= 15 && duration <= 180 {
        self.segmentDuration = duration
      } else {
        logger.warn("Invalid segment duration (\(duration)s). Using default value (\(defaultSegmentDuration)s). Valid range is 15-180 seconds.")
        self.segmentDuration = defaultSegmentDuration
      }
    } else {
      self.segmentDuration = defaultSegmentDuration
    }

    isRunning = true
    stopCaptureCalled = false

    let config = streamConfiguration
    let filter = contentFilter

    // Prepare baseURL (no segment suffix)
    let fileURL = URL(fileURLWithPath: outputPath)
    baseUrl = fileURL.deletingPathExtension()
    segmentIndex = 0
    segmentStartTime = nil
    firstFrameTime = nil
    lastBuffer = nil
    startTime = Date()
    videoWriteQueue = DispatchQueue(label: "com.gettrici.Recorder.VideoWriteQueue", qos: .userInteractive)

    do {

      // Create the first segment writer
      try createSegmentWriter(index: segmentIndex, config: config)
      guard let writer = currentWriter else { throw NSError(domain: "TriciRecorder", code: -1, userInfo: nil)}


      writer.startWriting()
      writer.startSession(atSourceTime: .zero)

      var frameCount = 0
      var firstFrameTime: CMTime?


      logger.info("Starting segmented MP4 video capture to \(outputPath)")

      Task {
        do {
          for try await output in captureEngine.startCapture(configuration: config, filter: filter, outputMode: true) {
            guard let input = currentInput,
                  let adaptor = currentAdaptor,
                  input.isReadyForMoreMediaData else { continue }

            if case .pixelBuffer(let pixelBuffer) = output {

              //Keep a warmup frame
              self.lastBuffer = pixelBuffer

              // Get the actual timestamp for this frame
              let timestamp = CMClockGetTime(CMClockGetHostTimeClock())
              if firstFrameTime == nil {
                firstFrameTime = timestamp
                segmentStartTime = .zero
              }

              // Calculate the presentation time relative to the first frame
              let presentationTime = CMTimeSubtract(timestamp, firstFrameTime!)

              videoWriteQueue?.async {

                // Re-fetch writer/input/adaptor each time
                guard let writer = self.currentWriter,
                      let input = self.currentInput,
                      let adaptor = self.currentAdaptor
                else { return }

                let elapsed = CMTimeGetSeconds(CMTimeSubtract(presentationTime, self.segmentStartTime!))

                if elapsed >= self.segmentDuration {
                  // 1️⃣ Move boundary *before* we call finishWriting
                  self.segmentStartTime = presentationTime
                  self.segmentIndex += 1

                  // 2️⃣ Create & start the new writer
                  do {
                    try self.createSegmentWriter(index: self.segmentIndex, config: config)
                    if let newWriter = self.currentWriter,
                       let newInput  = self.currentInput,
                       let newAdaptor = self.currentAdaptor
                    {
                      newWriter.startWriting()
                      // Start new session with the current global presentation time
                      newWriter.startSession(atSourceTime: presentationTime)
                      // warm‑up frame with the same global presentation time
                      if let warm = self.lastBuffer {
                        newAdaptor.append(warm, withPresentationTime: presentationTime)
                      }
                    }
                  } catch {
                    self.logger.error("Failed to create new segment writer: \(error.localizedDescription)")
                  }

                  // 3️⃣ Now finish the *old* writer
                  if writer.status == .writing {
                    input.markAsFinished()
                    writer.finishWriting {
                      let finishedSegment = String(format:"%04d", self.segmentIndex - 1)

                      switch writer.status {
                              case .completed:
                                  // ✔️ Everything was flushed, trailer written, FD closed.
                                  self.logger.info("✅ Successfully finished segment \(finishedSegment)")
                                  LoggingService.writeToStandardOutput(message: [
                                    "message": "finishedWritingSegment",
                                    "data": finishedSegment
                                  ])


                              case .failed:
                                  // ❌ Something went wrong
                                  let err = writer.error?.localizedDescription ?? "Unknown"
                                  self.logger.error("❌ Failed to finish segment \(finishedSegment): \(err)")
                                  LoggingService.writeToStandardOutput(message: [
                                    "message": "failedWritingSegment",
                                    "data": finishedSegment,
                                    "error": err
                                  ])

                              default:
                                  // Shouldn't happen, but good to know if you see `.cancelled` or `.unknown`
                                  self.logger.error("⚠️ Unexpected writer status \(writer.status) for segment \(finishedSegment)")
                              }
                      self.logger.info("Finished segment \(finishedSegment)")
                    }
                  }
                }

                // 4️⃣ Append this frame with global presentation time
                adaptor.append(pixelBuffer, withPresentationTime: presentationTime)
              }

              frameCount += 1

              if frameCount % 70 == 0 {
                let currentTime = CMTimeGetSeconds(presentationTime)
                let currentFPS = Double(frameCount) / currentTime
                self.logger.info("Processed \(frameCount) frames. Current FPS: \(String(format: "%.2f", currentFPS))")
              }
            }
          }
          if (!stopCaptureCalled) {
            logger.info("Capture continuation finished due to null pointer error. stopCurrentRecording")
            await stopRecording()
            LoggingService.writeToStandardOutput(message: ["message": "screenRecorderStoppedByOS"])
          } else {
            logger.info("Capture continuation finished due to stop")
          }
        } catch {
          logger.error("Error during video capture: \(error.localizedDescription)")
          await stopRecording()
          LoggingService.writeToStandardOutput(message: ["message": "screenRecorderStoppedByError"])
        }
      }


    } catch {
      logger.error("\(error.localizedDescription)")
      isRunning = false
    }
  }




  private func stopRecording() async {
    guard let writer = self.currentWriter,
          let writerInput = self.currentInput,
          let writeQueue = videoWriteQueue,
          let startTime = startTime else {
      return
    }

    // Wait for all pending write operations to complete
    await withCheckedContinuation { continuation in
      writeQueue.async {
        writerInput.markAsFinished()
        writer.finishWriting {
         //  ┌── emit our "last segment done" event
         let lastSegIndex = String(format: "%04d", self.segmentIndex)
         LoggingService.writeToStandardOutput(message: [
         "message": "finishedWritingSegment",
         "data": lastSegIndex
         ])

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
          self.currentWriter = nil
          self.currentInput = nil
          self.currentAdaptor = nil
          self.videoWriteQueue = nil
          self.startTime = nil
          self.baseUrl = nil

          continuation.resume()
        }
      }
    }
  }

  func stop() async {
    stopCaptureCalled = true
    guard isRunning else { return }

    // Call the asynchronous stopCapture method
    logger.debug("Stopping Capture")
    await captureEngine.stopCapture()

    // If we were recording video, finalize it
    if self.currentWriter != nil {
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
