//
//  FrameProcessor.swift
//  Recorder
//
//  Created by Shashi Singh on 17/06/24.
//

import Foundation
import AVFoundation
import CoreGraphics
import AVFAudio
import ScreenCaptureKit
import Combine


struct FrameProcessor {
  
  private static let logger = LoggingService.shared.getLogger()
  
  static func createPixelBuffer(from frame: CapturedFrame) -> CVPixelBuffer? {
      guard let surface = frame.surface else { return nil }
      
      var pixelBuffer: CVPixelBuffer?
      
      // Create an Unmanaged instance of CVPixelBuffer
      var unmanagedPixelBuffer: Unmanaged<CVPixelBuffer>?
      
      let attributes: [CFString: Any] = [
          kCVPixelBufferIOSurfacePropertiesKey: [:]
      ]
      
      // Create the pixel buffer using Unmanaged
      let status = CVPixelBufferCreateWithIOSurface(nil, surface, attributes as CFDictionary, &unmanagedPixelBuffer)
      
      if status == kCVReturnSuccess {
          // If creation was successful, take ownership of the object
          pixelBuffer = unmanagedPixelBuffer?.takeRetainedValue()
      } else {
        logger.error("Error creating pixel buffer: \(status)")
      }
      
      return pixelBuffer
  }

  


//  static func processFrameToRawData(_ frame: CapturedFrame) -> Data? {
//    guard let pixelBuffer = createPixelBuffer(from: frame) else { return nil }
//        
//        CVPixelBufferLockBaseAddress(pixelBuffer, [])
//        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }
//        
//        guard let baseAddressY = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0),
//              let baseAddressUV = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1) else {
//            return nil
//        }
//        
//        let width = Int(frame.size.width)
//        let height = Int(frame.size.height)
//        let yPlaneSize = width * height
//        let uvPlaneSize = width * height / 2
//        
//        // Create Data objects for Y and UV planes
//        let yPlane = Data(bytes: baseAddressY, count: yPlaneSize)
//        let uvPlane = Data(bytes: baseAddressUV, count: uvPlaneSize)
//        
//        // Combine Y and UV planes into a single Data object
//        var pixelData = Data()
//        pixelData.append(yPlane)
//        pixelData.append(uvPlane)
//    
//    // Verify the combined size
//      let expectedFrameSize = width * height * 3 / 2 // For NV12 format
////    logger.info("frame size: expected \(expectedFrameSize), got \(pixelData.count)")
//      if pixelData.count != expectedFrameSize {
//          logger.error("Invalid frame size: expected \(expectedFrameSize), got \(pixelData.count)")
//      }
//        
//        return pixelData
//  }
  
  static func processFrameToRawData(_ frame: CapturedFrame) -> Data? {
        guard let pixelBuffer = createPixelBuffer(from: frame) else { return nil }
        
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }
        
        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else { return nil }
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        let totalBytes = bytesPerRow * Int(frame.size.height)
        
        logger.info("bytesPerRow:\(bytesPerRow)")
    logger.info("totalBytes:\(totalBytes)")
        let pixelData = Data(bytes: baseAddress, count: totalBytes)
        return pixelData
    }
  
  
  static func setupAssetWriter(outputURL: URL, width: Int, height: Int) throws -> (AVAssetWriter, AVAssetWriterInput, AVAssetWriterInputPixelBufferAdaptor) {
      let assetWriter = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)

      let outputSettings: [String: Any] = [
          AVVideoCodecKey: AVVideoCodecType.h264,
          AVVideoWidthKey: width,
          AVVideoHeightKey: height,
//          AVVideoCompressionPropertiesKey: [
//            AVVideoAverageBitRateKey: 
//          ]
      ]

      let assetWriterInput = AVAssetWriterInput(mediaType: .video, outputSettings: outputSettings)
      assetWriterInput.expectsMediaDataInRealTime = true

      let sourcePixelBufferAttributes: [String: Any] = [
          kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
          kCVPixelBufferWidthKey as String: width,
          kCVPixelBufferHeightKey as String: height
      ]

      let pixelBufferAdaptor = AVAssetWriterInputPixelBufferAdaptor(
          assetWriterInput: assetWriterInput,
          sourcePixelBufferAttributes: sourcePixelBufferAttributes
      )

      assetWriter.add(assetWriterInput)

      return (assetWriter, assetWriterInput, pixelBufferAdaptor)
  }

//  static func setupAssetWriter(outputURL: URL, width: Int, height: Int) throws -> (AVAssetWriter, AVAssetWriterInput, AVAssetWriterInputPixelBufferAdaptor) {
//      let assetWriter = try AVAssetWriter(outputURL: outputURL, fileType: .mov)
//      
//      let outputSettings: [String: Any] = [
//          AVVideoCodecKey: AVVideoCodecType.h264,
//          AVVideoWidthKey: width,
//          AVVideoHeightKey: height,
//          AVVideoCompressionPropertiesKey: [
//              AVVideoAverageBitRateKey: 6000000
//          ]
//      ]
//      
//      let assetWriterInput = AVAssetWriterInput(mediaType: .video, outputSettings: outputSettings)
//      assetWriterInput.expectsMediaDataInRealTime = true
//      
//      let sourcePixelBufferAttributes: [String: Any] = [
//          kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
//          kCVPixelBufferWidthKey as String: width,
//          kCVPixelBufferHeightKey as String: height
//      ]
//      
//      let pixelBufferAdaptor = AVAssetWriterInputPixelBufferAdaptor(
//          assetWriterInput: assetWriterInput,
//          sourcePixelBufferAttributes: sourcePixelBufferAttributes
//      )
//      
//      if assetWriter.canAdd(assetWriterInput) {
//          assetWriter.add(assetWriterInput)
//      }
//      
//      assetWriter.startWriting()
//      assetWriter.startSession(atSourceTime: .zero)
//      
//      return (assetWriter, assetWriterInput, pixelBufferAdaptor)
//  }

  static func appendFrameToAssetWriter(_ frame: CapturedFrame, pixelBufferAdaptor: AVAssetWriterInputPixelBufferAdaptor, frameCount: Int) -> Bool {
      autoreleasepool {
          let time = CMTimeMake(value: Int64(frameCount), timescale: 30)
          guard let pixelBuffer = createPixelBuffer(from: frame) else { return false }
          return pixelBufferAdaptor.append(pixelBuffer, withPresentationTime: time)
      }
  }



  static func finishAssetWriter(_ assetWriter: AVAssetWriter, assetWriterInput: AVAssetWriterInput) {
      assetWriterInput.markAsFinished()
      assetWriter.finishWriting {
        logger.info("Recording finished")
      }
  }

}
