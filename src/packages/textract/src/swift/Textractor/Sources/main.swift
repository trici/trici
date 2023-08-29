import Foundation
import Vision
import AppKit

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

guard CommandLine.arguments.count > 1 else {
    print("Please provide the image file path as an argument.")
    exit(1)
}

let imagePath = CommandLine.arguments[1]
let imageURL = URL(fileURLWithPath: imagePath)

recognizeTextInImage(at: imageURL) { observations in
    var outputArray = [[String: Any]]()
// Get the dimensions of the image
    let image = NSImage(contentsOf: imageURL)
    let imageWidth = image?.size.width ?? 0
    let imageHeight = image?.size.height ?? 0

    for observation in observations {
        if let candidate = observation.topCandidates(1).first {
            var observationDict = [String: Any]()
            observationDict["RecognizedText"] = candidate.string
            observationDict["Confidence"] = candidate.confidence

            // Convert the normalized coordinates to pixels
            let boundingBox = observation.boundingBox
            let pixelX = boundingBox.origin.x * imageWidth
            let pixelY = (1 - boundingBox.origin.y - boundingBox.size.height) * imageHeight // flip the y coordinate
            let pixelWidth = boundingBox.size.width * imageWidth
            let pixelHeight = boundingBox.size.height * imageHeight

            observationDict["BoundingBox"] = [
                "x": pixelX,
                "y": pixelY,
                "width": pixelWidth,
                "height": pixelHeight
            ]

            outputArray.append(observationDict)
        }
    }

    let outputData = try! JSONSerialization.data(withJSONObject: outputArray, options: .prettyPrinted)
    let outputString = String(data: outputData, encoding: .utf8) ?? ""

    print(outputString)

    // Save JSON string to file
        let outputFileName = imageURL.deletingPathExtension().lastPathComponent + ".json"
        let outputFilePath = imageURL.deletingLastPathComponent().appendingPathComponent(outputFileName).path

        do {
            try outputString.write(toFile: outputFilePath, atomically: true, encoding: .utf8)
            print("Saved JSON to \(outputFilePath)")
        } catch {
            // print("Error saving JSON to file: \(error)")
        }

    exit(0)
}

RunLoop.main.run()
