// AppObserverMethods.swift

import AppKit
import CoreGraphics
import CoreImage
import Foundation

public class AppObserverMethods {
  func convertIconToPNGData(_ icon: NSImage, maxWidth: CGFloat = 100, maxHeight: CGFloat = 100) -> Data? {
    guard let tiffRepresentation = icon.tiffRepresentation,
          let bitmapImage = NSBitmapImageRep(data: tiffRepresentation)
    else {
      return nil
    }

    let imgSize = icon.size
    var newWidth: CGFloat = imgSize.width
    var newHeight: CGFloat = imgSize.height

    if newWidth > maxWidth {
      newWidth = maxWidth
      newHeight = (imgSize.height * newWidth) / imgSize.width
    }
    if newHeight > maxHeight {
      newHeight = maxHeight
      newWidth = (imgSize.width * newHeight) / imgSize.height
    }

    let newImage = NSImage(size: CGSize(width: newWidth, height: newHeight))
    newImage.lockFocus()
    icon.draw(in: CGRect(x: 0, y: 0, width: newWidth, height: newHeight), from: .zero, operation: .copy, fraction: 1.0)
    newImage.unlockFocus()

    guard let newTiffData = newImage.tiffRepresentation,
          let newBitmapImage = NSBitmapImageRep(data: newTiffData)
    else {
      return nil
    }
    return newBitmapImage.representation(using: .png, properties: [:])
  }

  func outputInstalledApps() {
    var apps: [[String: Any]] = []

    let fileManager = FileManager.default
    let applicationsDirectory = "/Applications"

    do {
      let contents = try fileManager.contentsOfDirectory(atPath: applicationsDirectory)
      for app in contents where app.hasSuffix(".app") {
        let appPath = "\(applicationsDirectory)/\(app)"
        let infoPlistPath = "\(appPath)/Contents/Info.plist"

        if let infoPlist = NSDictionary(contentsOfFile: infoPlistPath) {
          let appName = infoPlist["CFBundleName"] as? String ?? app.replacingOccurrences(of: ".app", with: "")

          let icon = NSWorkspace.shared.icon(forFile: appPath)
          if let pngData = convertIconToPNGData(icon) {
            let tempIconPath = "\(NSTemporaryDirectory())/\(appName).png"

            do {
              try pngData.write(to: URL(fileURLWithPath: tempIconPath))
              apps.append([
                "name": appName,
                "iconPath": tempIconPath,
              ])
            } catch {
              print("Error saving PNG for app \(appName): \(error)")
            }
          } else {
            print("Failed to get PNG representation for app \(app)")
          }
        }
      }
      let response: [String: Any] = [
        "type": "installedApps",
        "response": apps,
        "timestamp": Date().timeIntervalSince1970,
      ]

      if let data = try? JSONSerialization.data(withJSONObject: response),
         let jsonString = String(data: data, encoding: .utf8)
      {
        FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
      }
    } catch {
      print("Error reading from Applications directory: \(error)")
    }
  }

  // func outputInstalledApps() {
  //   var apps: [[String: Any]] = []

  //   let fileManager = FileManager.default
  //   let applicationsDirectory = "/Applications"

  //   do {
  //     let contents = try fileManager.contentsOfDirectory(atPath: applicationsDirectory)
  //     for app in contents where app.hasSuffix(".app") {
  //       let appPath = "\(applicationsDirectory)/\(app)"
  //       let infoPlistPath = "\(appPath)/Contents/Info.plist"
  //       if let infoPlist = NSDictionary(contentsOfFile: infoPlistPath),
  //          let iconName = infoPlist["CFBundleIconFile"] as? String
  //       {
  //         let iconPath = "\(appPath)/Contents/Resources/\(iconName)"

  //         // Grab the app's icon using the NSWorkspace shared instance
  //         let icon = NSWorkspace.shared.icon(forFile: appPath)

  //         // Convert icon to PNG
  //         if let pngData = convertIconToPNGData(icon) {
  //           let appName = app.replacingOccurrences(of: ".app", with: "")
  //           let tempIconPath = "\(NSTemporaryDirectory())/\(appName).png"

  //           do {
  //             try pngData.write(to: URL(fileURLWithPath: tempIconPath))
  //             apps.append([
  //               "name": appName,
  //               "iconPath": tempIconPath,
  //             ])
  //           } catch {
  //             print("Error saving PNG for app \(appName): \(error)")
  //           }

  //         } else {
  //           print("Failed to get PNG representation for app \(app)")
  //         }
  //       }
  //     }
  //     let response: [String: Any] = [
  //       "type": "installedApps",
  //       "response": apps,
  //       "timestamp": Date().timeIntervalSince1970,
  //     ]

  //     if let data = try? JSONSerialization.data(withJSONObject: response),
  //        let jsonString = String(data: data, encoding: .utf8)
  //     {
  //       FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
  //     }
  //   } catch {
  //     print("Error reading from Applications directory: \(error)")
  //   }
  // }
}
