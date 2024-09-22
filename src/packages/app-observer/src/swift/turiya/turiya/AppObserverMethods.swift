//
//  AppObserverMethods.swift
//  turiya
//
//  Created by Shashi Singh on 20/09/24.
//


import AppKit
import CoreGraphics
import CoreImage
import Foundation
import Cocoa
import ApplicationServices

public struct AppObserverMethods {
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
          let appName = infoPlist["CFBundleDisplayName"] as? String ?? infoPlist["CFBundleName"] as? String ?? app.replacingOccurrences(of: ".app", with: "")
          let bundleIdentifier = infoPlist["CFBundleIdentifier"] as? String ?? "unknown" // what happens if there are multiple apps without a bundle identifier?
          var synonyms = Set<String>()

          if let cfBundleName = infoPlist["CFBundleName"] as? String, cfBundleName != appName {
            synonyms.insert(cfBundleName)
          }

          let directoryName = app.replacingOccurrences(of: ".app", with: "")
          if directoryName != appName {
            synonyms.insert(directoryName)
          }

          let icon = NSWorkspace.shared.icon(forFile: appPath)
          if let pngData = convertIconToPNGData(icon) {
            let tempIconPath = "\(NSTemporaryDirectory())/\(appName).png"

            do {
              try pngData.write(to: URL(fileURLWithPath: tempIconPath))
              var appData: [String: Any] = [
                "name": appName,
                "iconPath": tempIconPath,
                "bundleIdentifier": bundleIdentifier,
              ]
              if !synonyms.isEmpty {
                appData["synonyms"] = Array(synonyms)
              }
              apps.append(appData)
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
    
    func getActiveBrowserOpenedURL() {
        guard let url = getFrontmostBrowserURL() else {
            let errorResponse: [String: Any] = [
                "type": "activeBrowserOpenedUrl",
                "response": "undefined",
                "timestamp": Date().timeIntervalSince1970
            ]
            if let data = try? JSONSerialization.data(withJSONObject: errorResponse),
               let jsonString = String(data: data, encoding: .utf8)
            {
                FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
            }
            return
        }
        
        let successResponse: [String: Any] = [
            "type": "activeBrowserOpenedUrl",
            "response": url,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        if let data = try? JSONSerialization.data(withJSONObject: successResponse),
           let jsonString = String(data: data, encoding: .utf8)
        {
            FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
        }

    }  
    
    private func getFrontmostBrowserURL() -> String? {
    // Get the frontmost application
    guard let frontmostApp = NSWorkspace.shared.frontmostApplication else {
        print("Could not get the frontmost application.")
        return nil
    }

    // Get the process identifier (PID) of the frontmost application
    let pid = frontmostApp.processIdentifier

    // Get the bundle identifier of the frontmost application
    guard let bundleID = frontmostApp.bundleIdentifier else {
        print("Could not get the bundle identifier.")
        return nil
    }

    // Define supported browsers
    let supportedBrowsers = [
        "com.apple.Safari",
        "com.google.Chrome",
        "org.mozilla.firefox"
    ]

    // Check if the frontmost application is a supported browser
    guard supportedBrowsers.contains(bundleID) else {
        print("Frontmost application is not a supported browser.")
        return nil
    }

    // Create an accessibility application reference
    let appRef = AXUIElementCreateApplication(pid)

    // Get the windows of the application
    var windowList: CFTypeRef?
    let windowsError = AXUIElementCopyAttributeValue(appRef, kAXWindowsAttribute as CFString, &windowList)
    guard windowsError == .success,
          let windows = windowList as? [AXUIElement],
          !windows.isEmpty else {
        print("Could not get the windows of the frontmost application.")
        return nil
    }

    // Assume the first window is the active window
    let frontWindow = windows[0]

    // Switch based on the browser type
    switch bundleID {
    case "com.apple.Safari":
        return getSafariURL(windowElement: frontWindow)
    case "com.google.Chrome":
        return getChromeURL(windowElement: frontWindow)
    case "org.mozilla.firefox":
        return getFirefoxURL(windowElement: frontWindow)
    default:
        print("Browser not supported.")
        return nil
    }
}

// Function to get URL from Safari
private func getSafariURL(windowElement: AXUIElement) -> String? {
    // In Safari, the address bar is an AXTextField within the window
    if let addressBarElement = findElement(ofType: kAXTextFieldRole, in: windowElement) {
        // Get the value attribute, which contains the URL
        var urlRef: CFTypeRef?
        let result = AXUIElementCopyAttributeValue(addressBarElement, kAXValueAttribute as CFString, &urlRef)
        if result == .success, let urlString = urlRef as? String {
            return urlString
        }
    }
    print("Could not find the address bar in Safari.")
    return nil
}

// Function to get URL from Google Chrome
private func getChromeURL(windowElement: AXUIElement) -> String? {
    // In Chrome, the address bar is an AXTextField within the window
    if let addressBarElement = findElement(ofType: kAXTextFieldRole, in: windowElement) {
        // Get the value attribute, which contains the URL
        var urlRef: CFTypeRef?
        let result = AXUIElementCopyAttributeValue(addressBarElement, kAXValueAttribute as CFString, &urlRef)
        if result == .success, let urlString = urlRef as? String {
            return urlString
        }
    }
    print("Could not find the address bar in Google Chrome.")
    return nil
}

// Function to get URL from Firefox
private func getFirefoxURL(windowElement: AXUIElement) -> String? {
    // In Firefox, the address bar is an AXTextField within the window
    if let addressBarElement = findElement(ofType: kAXTextFieldRole, in: windowElement) {
        // Get the value attribute, which contains the URL
        var urlRef: CFTypeRef?
        let result = AXUIElementCopyAttributeValue(addressBarElement, kAXValueAttribute as CFString, &urlRef)
        if result == .success, let urlString = urlRef as? String {
            return urlString
        }
    }
    print("Could not find the address bar in Firefox.")
    return nil
}

    // Helper function to recursively find an element of a specific type
    private func findElement(ofType type: String, in element: AXUIElement) -> AXUIElement? {
        var roleRef: AnyObject?
        let roleResult = AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &roleRef)
        guard roleResult == .success, let role = roleRef as? String else {
            return nil
        }

        if role == type {
            return element
        }

        var childrenRef: AnyObject?
        let childrenResult = AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &childrenRef)
        if childrenResult == .success, let children = childrenRef as? [AXUIElement] {
            for child in children {
                if let found = findElement(ofType: type, in: child) {
                    return found
                }
            }
        }

        return nil
    }
    
}
