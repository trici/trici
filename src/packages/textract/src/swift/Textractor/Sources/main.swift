import Foundation
import Vision
import AppKit


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

guard CommandLine.arguments.count > 1 else {
    print("Please provide the image file path as an argument.")
    exit(1)
}

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

