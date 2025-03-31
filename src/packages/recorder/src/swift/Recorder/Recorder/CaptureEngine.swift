//
//  CaptureEngine.swift
//  Recorder
//
//  Created by Shashi Singh on 03/08/24.
//

import Foundation
import AVFAudio
import AVFoundation
import ScreenCaptureKit

enum CaptureOutput {
    case rawData(Data)
    case pixelBuffer(CVPixelBuffer)
}

class CaptureEngine: NSObject, @unchecked Sendable {

  private var logger: Logger;
    private(set) var stream: SCStream?
    private var streamOutput: CaptureEngineStreamOutput?
    private let videoSampleBufferQueue = DispatchQueue(label: "com.gettrici.Recorder.VideoSampleBufferQueue")

    private var continuation: AsyncThrowingStream<CaptureOutput, Error>.Continuation?

  var lastFrameTime: Date?

  init(logger:Logger) {
    self.logger = logger
  }

  func startCapture(configuration: SCStreamConfiguration, filter: SCContentFilter, outputMode: Bool = false) -> AsyncThrowingStream<CaptureOutput, Error> {
      AsyncThrowingStream<CaptureOutput, Error> { continuation in
          self.continuation = continuation

          // The stream output object.
          let streamOutput = CaptureEngineStreamOutput(continuation: continuation)
          self.streamOutput = streamOutput

          // Initialize lastFramePTS
          var lastFramePTS: CMTime?

          streamOutput.sampleBufferHandler = { sampleBuffer in
              if outputMode {
                  // For video recording, pass the CVPixelBuffer directly
                  if let pixelBuffer = sampleBuffer.imageBuffer {
                      continuation.yield(.pixelBuffer(pixelBuffer))
                  }
              } else {
                  // For raw data output (pipe writing), convert to raw NV12 data
                  if let data = self.processSampleBuffer(sampleBuffer) {
                      continuation.yield(.rawData(data))
                  }
              }
          }

          do {
              self.stream = SCStream(filter: filter, configuration: configuration, delegate: streamOutput)

              // Add a stream output to capture screen content.
              try self.stream?.addStreamOutput(streamOutput, type: .screen, sampleHandlerQueue: self.videoSampleBufferQueue)
              self.stream?.startCapture()
          } catch {
              continuation.finish(throwing: error)
          }
      }
  }

  private func processSampleBuffer(_ sampleBuffer: CMSampleBuffer) -> Data? {
      guard let pixelBuffer = sampleBuffer.imageBuffer else { return nil }

      CVPixelBufferLockBaseAddress(pixelBuffer, [])
      defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }

      let pixelFormat = CVPixelBufferGetPixelFormatType(pixelBuffer)

      switch pixelFormat {
      case kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
          return processNv12PixelData(pixelBuffer)

      case kCVPixelFormatType_32BGRA:
          return processBgraPixelData(pixelBuffer)

      case kCVPixelFormatType_422YpCbCr8:
           return processYuv422PixelData(pixelBuffer)

      default:
          logger.error("Unsupported pixel format: \(pixelFormat)")
          return nil
      }
  }

  private func processYuv422PixelData(_ pixelBuffer: CVPixelBuffer) -> Data? {
      let width = CVPixelBufferGetWidth(pixelBuffer)
      let height = CVPixelBufferGetHeight(pixelBuffer)

      // Y Plane
      guard let baseAddressY = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0) else { return nil }
      let yPlaneBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0)
      let yPlaneSize = yPlaneBytesPerRow * height
      let yPlaneData = Data(bytes: baseAddressY, count: yPlaneSize)

      // CbCr Plane
      guard let baseAddressCbCr = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1) else { return nil }
      let cbCrPlaneBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1)
      let cbCrPlaneSize = cbCrPlaneBytesPerRow * height // YUV 4:2:2 has the same height for Y and CbCr planes
      let cbCrPlaneData = Data(bytes: baseAddressCbCr, count: cbCrPlaneSize)

      // Combine Y and CbCr planes
      var pixelData = Data()
      pixelData.append(yPlaneData)
      pixelData.append(cbCrPlaneData)

      // Print the size of the pixel data to debug
      let expectedSize = yPlaneSize + cbCrPlaneSize
      let actualSize = pixelData.count

      if actualSize != expectedSize {
        logger.warn("Warning: YUV 4:2:2 pixel data size mismatch!")
      }

      return pixelData
  }

  private func processNv12PixelData(_ pixelBuffer: CVPixelBuffer) -> Data? {
      let height = CVPixelBufferGetHeight(pixelBuffer)

      // Y Plane
      guard let baseAddressY = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0) else { return nil }
      let yPlaneBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0)
      let yPlaneSize = yPlaneBytesPerRow * height
      let yPlaneData = Data(bytes: baseAddressY, count: yPlaneSize)

      // UV Plane
      guard let baseAddressUV = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1) else { return nil }
      let uvPlaneBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1)
      let uvPlaneHeight = height / 2
      let uvPlaneSize = uvPlaneBytesPerRow * uvPlaneHeight
      let uvPlaneData = Data(bytes: baseAddressUV, count: uvPlaneSize)

      // Combine Y and UV planes
      var pixelData = Data()
      pixelData.append(yPlaneData)
      pixelData.append(uvPlaneData)

      // Print the size of the pixel data to debug
      let expectedSize = yPlaneSize + uvPlaneSize
      let actualSize = pixelData.count

      if actualSize != expectedSize {
          logger.warn("Warning: NV12 pixel data size mismatch!")
      }

      return pixelData
  }

  private func processBgraPixelData(_ pixelBuffer: CVPixelBuffer) -> Data? {
      let width = CVPixelBufferGetWidth(pixelBuffer)
      let height = CVPixelBufferGetHeight(pixelBuffer)

      // BGRA Plane
      guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else { return nil }
      let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
      let dataSize = bytesPerRow * height
      let bgraData = Data(bytes: baseAddress, count: dataSize)

      // Print the size of the pixel data to debug
      let expectedSize = dataSize
      let actualSize = bgraData.count

      if actualSize != expectedSize {
          logger.warn("Warning: BGRA pixel data size mismatch!")
      }

      return bgraData
  }


  func update(configuration: SCStreamConfiguration, filter: SCContentFilter) async {
      do {
        let startTime = Date()
                logger.debug("Starting configuration update at \(startTime)")

                // Update the stream configuration
                try await stream?.updateConfiguration(configuration)
                let afterConfigUpdateTime = Date()
                let configUpdateDuration = afterConfigUpdateTime.timeIntervalSince(startTime)
                logger.debug("Configuration update completed at \(afterConfigUpdateTime), duration: \(configUpdateDuration) seconds")

//          try await stream?.updateConfiguration(configuration)
          try await stream?.updateContentFilter(filter)
      } catch {
          logger.error("Failed to update the stream session: \(String(describing: error))")
      }
  }

  func stopCapture() async {
      do {
          try await stream?.stopCapture()
          logger.info("Capture Engine stream stopCapture successful")
          continuation?.finish()  // Signal the stream has ended
      } catch {
          logger.error("Error stopping capture: \(error.localizedDescription)")
          continuation?.finish(throwing: error)  // Signal an error occurred
      }
  }
}

private class CaptureEngineStreamOutput: NSObject, SCStreamOutput, SCStreamDelegate {

    var sampleBufferHandler: ((CMSampleBuffer) -> Void)?
    private var continuation: AsyncThrowingStream<CaptureOutput, Error>.Continuation?

    init(continuation: AsyncThrowingStream<CaptureOutput, Error>.Continuation?) {
        self.continuation = continuation
    }

    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of outputType: SCStreamOutputType) {
      switch outputType {
      case .screen:
        guard sampleBuffer.isValid else { return }
        sampleBufferHandler?(sampleBuffer)
      @unknown default:
        logger.error("Encountered unknown stream output type \(outputType)")
      }

    }

  func stream(_ stream: SCStream, didStopWithError error: Error) {
          if let error = error as NSError?, error.code != 0 {
              continuation?.finish(throwing: error)
          } else {
              continuation?.finish()
          }
      }
}

