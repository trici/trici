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

    private var logger: Logger
    private(set) var stream: SCStream?
    private var streamOutput: CaptureEngineStreamOutput?
    private let videoSampleBufferQueue = DispatchQueue(label: "com.gettrici.Recorder.VideoSampleBufferQueue")
    private var continuation: AsyncThrowingStream<CaptureOutput, Error>.Continuation?
    private let cleanupQueue = DispatchQueue(label: "com.gettrici.Recorder.CleanupQueue")
    private var isShuttingDown = false

    var lastFrameTime: Date?

    init(logger: Logger) {
        self.logger = logger
        super.init()
    }
  
  deinit {
    logger.warn(" CaptureEngine DEINIT")
  }

    func startCapture(configuration: SCStreamConfiguration, filter: SCContentFilter, outputMode: Bool = false) -> AsyncThrowingStream<CaptureOutput, Error> {
        AsyncThrowingStream<CaptureOutput, Error> { continuation in
            self.continuation = continuation

            weak var weakSelf = self

            // Inject the logger into the stream output instance.
            let streamOutput = CaptureEngineStreamOutput(continuation: continuation, logger: self.logger)
            self.streamOutput = streamOutput

            streamOutput.sampleBufferHandler = { [weak self] sampleBuffer in
                guard let self = self, !self.isShuttingDown else { return }

                autoreleasepool {
                    if outputMode {
                        if let pixelBuffer = sampleBuffer.imageBuffer {
                            continuation.yield(.pixelBuffer(pixelBuffer))
                        }
                    } else {
                        if let data = self.processSampleBuffer(sampleBuffer) {
                            continuation.yield(.rawData(data))
                        }
                    }
                }
            }

            do {
                let stream = SCStream(filter: filter, configuration: configuration, delegate: streamOutput)
                self.stream = stream

                try stream.addStreamOutput(streamOutput, type: .screen, sampleHandlerQueue: self.videoSampleBufferQueue)

                stream.startCapture { error in
                    if let error = error {
                        weakSelf?.logger.error("Failed to start capture: \(String(describing: error))")
                        continuation.finish(throwing: error)
                    }
                }
            } catch {
                self.logger.error("Failed to create stream: \(String(describing: error))")
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

        guard let baseAddressY = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0) else { return nil }
        let yPlaneBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0)
        let yPlaneSize = yPlaneBytesPerRow * height
        let yPlaneData = Data(bytes: baseAddressY, count: yPlaneSize)

        guard let baseAddressCbCr = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1) else { return nil }
        let cbCrPlaneBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1)
        let cbCrPlaneSize = cbCrPlaneBytesPerRow * height
        let cbCrPlaneData = Data(bytes: baseAddressCbCr, count: cbCrPlaneSize)

        var pixelData = Data()
        pixelData.append(yPlaneData)
        pixelData.append(cbCrPlaneData)

        let expectedSize = yPlaneSize + cbCrPlaneSize
        if pixelData.count != expectedSize {
            logger.warn("Warning: YUV 4:2:2 pixel data size mismatch!")
        }
        return pixelData
    }

    private func processNv12PixelData(_ pixelBuffer: CVPixelBuffer) -> Data? {
        let height = CVPixelBufferGetHeight(pixelBuffer)

        guard let baseAddressY = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0) else { return nil }
        let yPlaneBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0)
        let yPlaneSize = yPlaneBytesPerRow * height
        let yPlaneData = Data(bytes: baseAddressY, count: yPlaneSize)

        guard let baseAddressUV = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1) else { return nil }
        let uvPlaneBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1)
        let uvPlaneHeight = height / 2
        let uvPlaneSize = uvPlaneBytesPerRow * uvPlaneHeight
        let uvPlaneData = Data(bytes: baseAddressUV, count: uvPlaneSize)

        var pixelData = Data()
        pixelData.append(yPlaneData)
        pixelData.append(uvPlaneData)

        let expectedSize = yPlaneSize + uvPlaneSize
        if pixelData.count != expectedSize {
            logger.warn("Warning: NV12 pixel data size mismatch!")
        }
        return pixelData
    }

    private func processBgraPixelData(_ pixelBuffer: CVPixelBuffer) -> Data? {
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)

        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else { return nil }
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        let dataSize = bytesPerRow * height
        let bgraData = Data(bytes: baseAddress, count: dataSize)

        if bgraData.count != dataSize {
            logger.warn("Warning: BGRA pixel data size mismatch!")
        }
        return bgraData
    }

    func update(configuration: SCStreamConfiguration, filter: SCContentFilter) async {
        do {
            let startTime = Date()
            logger.debug("Starting configuration update at \(startTime)")
            try await stream?.updateConfiguration(configuration)
            let afterConfigUpdateTime = Date()
            let configUpdateDuration = afterConfigUpdateTime.timeIntervalSince(startTime)
            logger.debug("Configuration update completed at \(afterConfigUpdateTime), duration: \(configUpdateDuration) seconds")
            try await stream?.updateContentFilter(filter)
        } catch {
          logger.error("Error updating the strea configuration")
            logger.error("Failed to update the stream session: \(String(describing: error))")
        }
    }

    func stopCapture() async {
        isShuttingDown = true

        let currentStream = self.stream
        let currentOutput = self.streamOutput
        let currentContinuation = self.continuation

        do {
            if let stream = currentStream {
                try await stream.stopCapture()
                logger.info("Stream stopped successfully")
            }
            self.stream = nil
            self.streamOutput = nil
            if let continuation = currentContinuation {
                continuation.finish()
                self.continuation = nil
            }
            logger.info("Capture Engine cleanup completed")
        } catch {
            logger.error("Error during stream cleanup: \(error.localizedDescription)")
            currentContinuation?.finish(throwing: error)
        }
        isShuttingDown = false
    }
}

private class CaptureEngineStreamOutput: NSObject, SCStreamOutput, SCStreamDelegate {
    private let logger: Logger
    var sampleBufferHandler: ((CMSampleBuffer) -> Void)?
    private var continuation: AsyncThrowingStream<CaptureOutput, Error>.Continuation?
    private var isStopped = false

    init(continuation: AsyncThrowingStream<CaptureOutput, Error>.Continuation?, logger: Logger) {
        self.continuation = continuation
        self.logger = logger
        super.init()
    }
  
  deinit {
    logger.warn("StreamOutput DEINIT")
  }

    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of outputType: SCStreamOutputType) {
        guard !isStopped, sampleBuffer.isValid else { return }
        switch outputType {
        case .screen:
            autoreleasepool {
                sampleBufferHandler?(sampleBuffer)
            }
        @unknown default:
            break
        }
    }

    func stream(_ stream: SCStream, didStopWithError error: Error) {
      
      logger.error("Stream didStopWithError")
      // Attempt to treat the error as an AnyObject.
         let errorObject: AnyObject? = unsafeBitCast(error, to: AnyObject?.self)
         if errorObject == nil {
             logger.error("Stream stopped with a null error pointer; skipping processing.")
             // Finish the continuation safely.
             objc_sync_enter(self)
             defer { objc_sync_exit(self) }
             if let cont = continuation {
                 cont.finish()
                 continuation = nil
             }
             sampleBufferHandler = nil
             return
         }
         
         // Otherwise, log a generic message.
         logger.error("Stream stopped with an error.")

         objc_sync_enter(self)
         defer { objc_sync_exit(self) }

         guard !isStopped else { return }
         isStopped = true

         if let cont = continuation {
             let nsError = error as NSError
             if nsError.domain != NSCocoaErrorDomain || nsError.code != 0 {
                 cont.finish(throwing: error)
             } else {
                 cont.finish()
             }
             continuation = nil
         }
         sampleBufferHandler = nil
    
    }
}

