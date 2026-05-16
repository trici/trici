//
//  main.swift
//  Textractor
//
//  Created by Shashi Singh on 22/06/25.
//

import Foundation
import Vision
import AppKit
import Speech


/// Lower-case, trim punctuation the simple way.
/// For English UI screens this is good enough.
extension String {
    var ocrToken: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
            .trimmingCharacters(in: CharacterSet(charactersIn: ".,:;!?()[]{}"))
    }
}

func recognizeTextInImage(at url: URL, completionHandler: @escaping ([VNRecognizedTextObservation]) -> Void) {
    let requestHandler = VNImageRequestHandler(url: url, options: [:])
    let request = VNRecognizeTextRequest { request, error in
        guard let observations = request.results as? [VNRecognizedTextObservation] else {
            completionHandler([])
            return
        }
        completionHandler(observations)
    }

    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true

    do {
        try requestHandler.perform([request])
    } catch {
        completionHandler([])
    }
}

func recognizeSpeechInAudio(at url: URL, completionHandler: @escaping (String?, Float) -> Void) {
    // Check authorization first
    SFSpeechRecognizer.requestAuthorization { authStatus in
        // Send debug info to stderr so it doesn't interfere with JSON output
        fputs("Speech recognition authorization status: \(authStatus.rawValue)\n", stderr)

        guard authStatus == .authorized else {
            fputs("Speech recognition not authorized\n", stderr)
            completionHandler(nil, 0.0)
            return
        }

        let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))

        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            fputs("Speech recognizer not available\n", stderr)
            completionHandler(nil, 0.0)
            return
        }

        fputs("Starting speech recognition for file: \(url.path)\n", stderr)

        // Check if file exists and get info
        let fileExists = FileManager.default.fileExists(atPath: url.path)
        fputs("File exists: \(fileExists)\n", stderr)

        if fileExists {
            do {
                let fileSize = try FileManager.default.attributesOfItem(atPath: url.path)[.size] as? Int64 ?? 0
                fputs("File size: \(fileSize) bytes\n", stderr)
            } catch {
                fputs("Could not get file attributes: \(error.localizedDescription)\n", stderr)
            }
        }

        let request = SFSpeechURLRecognitionRequest(url: url)
        request.shouldReportPartialResults = false
        
        // Try server-based recognition first (more reliable)
        request.requiresOnDeviceRecognition = false
        fputs("Using server-based recognition (requiresOnDeviceRecognition = false)\n", stderr)
        
        // Check if recognizer supports on-device recognition
        fputs("Recognizer supports on-device recognition: \(recognizer.supportsOnDeviceRecognition)\n", stderr)
        
        // Log the exact locale being used
        fputs("Recognizer locale: \(recognizer.locale.identifier)\n", stderr)

        // Log supported locales for debugging
        let supportedLocales = SFSpeechRecognizer.supportedLocales()
        fputs("Supported locales count: \(supportedLocales.count)\n", stderr)
        fputs("Current locale supported: \(supportedLocales.contains(Locale(identifier: "en-US")))\n", stderr)

        fputs("Creating recognition task...\n", stderr)
        fputs("Request requires on-device: \(request.requiresOnDeviceRecognition)\n", stderr)
        fputs("Request should report partial results: \(request.shouldReportPartialResults)\n", stderr)
        
        _ = recognizer.recognitionTask(with: request) { result, error in
            if let error = error {
                let errorCode = (error as NSError).code
                let errorDomain = (error as NSError).domain
                let userInfo = (error as NSError).userInfo
                fputs("Speech recognition error: \(error.localizedDescription)\n", stderr)
                fputs("Error domain: \(errorDomain), code: \(errorCode)\n", stderr)
                fputs("Error userInfo: \(userInfo)\n", stderr)
                
                // Output error as JSON to stdout for proper handling
                let errorResult = [
                    "text": "",
                    "confidence": 0.0,
                    "error": "\(errorDomain) code \(errorCode): \(error.localizedDescription)",
                    "details": userInfo.description
                ] as [String : Any]
                
                if let jsonData = try? JSONSerialization.data(withJSONObject: errorResult, options: []),
                   let jsonString = String(data: jsonData, encoding: .utf8) {
                    print(jsonString)
                }
                
                completionHandler(nil, 0.0)
                return
            }

            guard let result = result else {
                fputs("No speech recognition result\n", stderr)
                completionHandler(nil, 0.0)
                return
            }

            if result.isFinal {
                let transcription = result.bestTranscription
                let confidence = transcription.segments.isEmpty ? 0.0 :
                    transcription.segments.map { $0.confidence }.reduce(0, +) / Float(transcription.segments.count)
                fputs("Speech recognition completed: \(transcription.formattedString)\n", stderr)
                completionHandler(transcription.formattedString, confidence)
            }
        }
    }
}

guard CommandLine.arguments.count > 1 else {
    print("Please provide the file path as an argument.")
    print("Usage: Textractor <image_path> OR Textractor --audio <audio_path>")
    exit(1)
}

// Check if we're processing audio
if CommandLine.arguments[1] == "--audio" {
    guard CommandLine.arguments.count > 2 else {
        print("Please provide the audio file path after --audio flag.")
        exit(1)
    }

    let audioPath = CommandLine.arguments[2]
    let audioURL = URL(fileURLWithPath: audioPath)

    let semaphore = DispatchSemaphore(value: 0)
    var hasCompleted = false

    // Add timeout for the operation (increase to 60 seconds for first-time setup)
    DispatchQueue.global().asyncAfter(deadline: .now() + 60.0) {
        if !hasCompleted {
            fputs("Speech recognition timed out after 60 seconds\n", stderr)
            let result = [
                "text": "",
                "confidence": 0.0,
                "error": "Speech recognition timed out - may need authorization"
            ] as [String : Any]

            if let jsonData = try? JSONSerialization.data(withJSONObject: result, options: []),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                print(jsonString)
            }
            semaphore.signal()
        }
    }

    recognizeSpeechInAudio(at: audioURL) { text, confidence in
        guard !hasCompleted else { return }
        hasCompleted = true
        if let recognizedText = text {
            let result = [
                "text": recognizedText,
                "confidence": confidence
            ] as [String : Any]

            if let jsonData = try? JSONSerialization.data(withJSONObject: result, options: []),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                print(jsonString)
            }
        } else {
            let result = [
                "text": "",
                "confidence": 0.0
            ] as [String : Any]

            if let jsonData = try? JSONSerialization.data(withJSONObject: result, options: []),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                print(jsonString)
            }
        }
        semaphore.signal()
    }

    semaphore.wait()
    exit(0)
}

// Original image processing logic
let imagePath = CommandLine.arguments[1]
let imageURL = URL(fileURLWithPath: imagePath)

recognizeTextInImage(at: imageURL) { observations in
    var tokenRects: [String: [CGRect]] = [:]
    var plainTokens: [String] = []

    // Get the dimensions of the image
    let image = NSImage(contentsOf: imageURL)
    let imageWidth = image?.size.width ?? 0
    let imageHeight = image?.size.height ?? 0

    for observation in observations {
      guard let candidate = observation.topCandidates(1).first else {
        continue
      }

      // 1. Pixel Rect
      let boundingBox = observation.boundingBox
      let rect = CGRect(x: boundingBox.origin.x * imageWidth, y: boundingBox.origin.y * imageHeight, width: boundingBox.size.width * imageWidth, height: boundingBox.size.height * imageHeight)

      // 2. Token
      let token = candidate.string.ocrToken

      // 3. Add to output
      tokenRects[token, default: []].append(rect)
      plainTokens.append(token)
    }

    // ---- 3.a geometry side-car (.geo.json) ----
let geoURL = imageURL.deletingPathExtension().appendingPathExtension("geo.json")
let geoData = try! JSONEncoder().encode(tokenRects)     // Codable auto-encodes the dictionary
try! geoData.write(to: geoURL)
print("Saved geometry to \(geoURL.lastPathComponent)")

// ---- 3.b flat text (.txt) ----
let txtURL = imageURL.deletingPathExtension().appendingPathExtension("txt")
try! plainTokens.joined(separator: " ").write(to: txtURL, atomically: true, encoding: .utf8)
print("Saved plain text to \(txtURL.lastPathComponent)")

    exit(0)
}
