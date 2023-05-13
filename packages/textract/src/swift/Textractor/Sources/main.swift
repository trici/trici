// The Swift Programming Language
// https://docs.swift.org/swift-book

import Foundation
import Vision

func recognizeTextInImage(at url: URL, completionHandler: @escaping (String) -> Void) {
    let requestHandler = VNImageRequestHandler(url: url, options: [:])
    let request = VNRecognizeTextRequest { request, error in
        guard let observations = request.results as? [VNRecognizedTextObservation] else {
            completionHandler("")
            return
        }

        let recognizedText = observations.compactMap { observation in
            return observation.topCandidates(1).first?.string
        }.joined(separator: "\n")

        completionHandler(recognizedText)
    }

    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true

    do {
        try requestHandler.perform([request])
    } catch {
        completionHandler("")
    }
}

guard CommandLine.arguments.count > 1 else {
    print("Please provide the image file path as an argument.")
    exit(1)
}

let imagePath = CommandLine.arguments[1]
let imageURL = URL(fileURLWithPath: imagePath)

recognizeTextInImage(at: imageURL) { recognizedText in
    print(recognizedText)
    exit(0)
}

RunLoop.main.run()
