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
import IOKit

public struct AppObserverMethods {
  private let logger: Logger

  init(logger:Logger) {
    self.logger = logger
  }


  // Helper function to send JSON response
  private func sendResponse(_ response: [String: Any]) {
      if let data = try? JSONSerialization.data(withJSONObject: response),
         let jsonString = String(data: data, encoding: .utf8) {
          FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
      }
  }

   struct IOHIDIdleTimeStruct {
      var idleTime: UInt64 = 0
  }



  func getSystemIdleTime() -> Int? {
    var iterator: io_iterator_t = 0
    let matching = IOServiceMatching("IOHIDSystem")

    guard IOServiceGetMatchingServices(kIOMasterPortDefault, matching, &iterator) == KERN_SUCCESS else {
        return nil
    }
    defer { IOObjectRelease(iterator) }

    let entry = IOIteratorNext(iterator)
    guard entry != 0 else {
        return nil
    }
    defer { IOObjectRelease(entry) }

    guard let idleTimeProperty = IORegistryEntryCreateCFProperty(entry, "HIDIdleTime" as CFString, kCFAllocatorDefault, 0),
          let idleTime = (idleTimeProperty.takeUnretainedValue() as? NSNumber)?.uint64Value else {
        return nil
    }

    let idleTimeInMilliseconds = Int(idleTime / 1_000_000)

    let response: [String: Any] = [
      "type": "idleTime",
      "response": idleTimeInMilliseconds,
      "timestamp": Date().timeIntervalSince1970,
    ]

    sendResponse(response)
    // Convert from nanoseconds to milliseconds
    return Int(idleTime / 1_000_000)
  }



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
              logger.error("Error saving PNG for app \(appName): \(error)")
            }
          } else {
            logger.error("Failed to get PNG representation for app \(app)")
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
      logger.error("Error reading from Applications directory: \(error)")
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

  private func dumpAccessibilityHierarchy(of element: AXUIElement, logger: Logger, indent: Int = 0) {
      // Helper: Get a specified attribute as String
      func stringValueForAttribute(_ attr: CFString, of element: AXUIElement) -> String? {
          var valueRef: CFTypeRef?
          let result = AXUIElementCopyAttributeValue(element, attr, &valueRef)
          if result == .success {
              return valueRef as? String
          }
          return nil
      }

      // Helper: Get Role of element
      func getRole(of element: AXUIElement) -> String? {
        return stringValueForAttribute(kAXRoleAttribute as CFString, of: element)
      }

      // Retrieve role
      let role = getRole(of: element) ?? "UnknownRole"

      // Attempt to get a title or value
      let title = stringValueForAttribute(kAXTitleAttribute as CFString, of: element)
      let value = stringValueForAttribute(kAXValueAttribute as CFString, of: element)

      let indentString = String(repeating: "  ", count: indent)

      // Log info about current element
      if let title = title {
          logger.info("\(indentString)- Role: \(role), Title: \(title)")
      } else if let value = value {
          logger.info("\(indentString)- Role: \(role), Value: \(value)")
      } else {
          logger.info("\(indentString)- Role: \(role)")
      }

      // Now look for children
      var childrenRef: CFTypeRef?
      let result = AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &childrenRef)
      if result == .success, let children = childrenRef as? [AXUIElement], !children.isEmpty {
          for child in children {
              dumpAccessibilityHierarchy(of: child, logger: logger, indent: indent + 1)
          }
      }
  }

    private func checkAccessibilityPermissions() -> Bool {
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true]
        let accessibilityEnabled = AXIsProcessTrustedWithOptions(options as CFDictionary)

        if !accessibilityEnabled {
            logger.error("Accessibility permissions not granted")
        }

        return accessibilityEnabled
    }

    private func reestablishAccessibilityConnection(for pid: pid_t) -> AXUIElement? {
        logger.info("Attempting to reestablish accessibility connection for pid: \(pid)")

        // Release existing connection if any
        let newAppRef = AXUIElementCreateApplication(pid)

        // Verify the connection
        var temp: AnyObject?
        let verifyResult = AXUIElementCopyAttributeValue(newAppRef, kAXRoleAttribute as CFString, &temp)

        if verifyResult == .success {
            logger.info("Successfully reestablished accessibility connection")
            return newAppRef
        } else {
            logger.error("Failed to reestablish accessibility connection: \(verifyResult)")
            return nil
        }
    }

    private func getFocusedWindow(for appRef: AXUIElement) -> AXUIElement? {
        var focusedWindowRef: CFTypeRef?
        let focusedWindowError = AXUIElementCopyAttributeValue(appRef, kAXFocusedWindowAttribute as CFString, &focusedWindowRef)

        if focusedWindowError != .success {
            logger.error("Failed to get focused window: \(focusedWindowError)")
            return nil
        }

        // Since we know focusedWindowRef must be an AXUIElement, force cast it
        return (focusedWindowRef as! AXUIElement)
    }

    private func getValidWindowElement(from appRef: AXUIElement) -> AXUIElement? {
        // First try focused window
        var focusedWindowRef: CFTypeRef?
        let focusedWindowError = AXUIElementCopyAttributeValue(appRef, kAXFocusedWindowAttribute as CFString, &focusedWindowRef)

        if focusedWindowError == .success {
            let focusedWindow = focusedWindowRef as! AXUIElement
            // Verify the window
            var roleRef: CFTypeRef?
            let roleResult = AXUIElementCopyAttributeValue(focusedWindow, kAXRoleAttribute as CFString, &roleRef)

            if roleResult == .success, let role = roleRef as? String, role == kAXWindowRole {
                logger.info("Successfully found valid focused window")
                return focusedWindow
            }
        }

        // If focused window fails, try getting all windows
        var windowsRef: CFTypeRef?
        let windowsError = AXUIElementCopyAttributeValue(appRef, kAXWindowsAttribute as CFString, &windowsRef)

        if windowsError == .success, let windows = windowsRef as? [AXUIElement], !windows.isEmpty {
            // Try each window until we find a valid one
            for window in windows {
                var roleRef: CFTypeRef?
                let roleResult = AXUIElementCopyAttributeValue(window, kAXRoleAttribute as CFString, &roleRef)

                if roleResult == .success, let role = roleRef as? String, role == kAXWindowRole {
                    // Additional validation: try to get the window title
                    var titleRef: CFTypeRef?
                    let titleResult = AXUIElementCopyAttributeValue(window, kAXTitleAttribute as CFString, &titleRef)

                    if titleResult == .success {
                        logger.info("Found valid window from windows list")
                        return window
                    }
                }
            }
        }

        logger.error("Could not find any valid window elements")
        return nil
    }

    private func getFrontmostBrowserURL() -> String? {
        guard let frontmostApp = NSWorkspace.shared.frontmostApplication else {
            logger.error("Could not get the frontmost application.")
            return nil
        }

        let pid = frontmostApp.processIdentifier
        logger.info("frontmostProcessId: \(pid)")

        guard let bundleID = frontmostApp.bundleIdentifier else {
            logger.error("Could not get the bundle identifier.")
            return nil
        }

        let supportedBrowsers = [
            "com.apple.Safari",
            "com.google.Chrome",
            "org.mozilla.firefox"
        ]

        guard supportedBrowsers.contains(bundleID) else {
            logger.error("Frontmost application:\(bundleID) is not a supported browser")
            return nil
        }

        // Try to establish/reestablish accessibility connection
        guard let appRef = reestablishAccessibilityConnection(for: pid) else {
            logger.error("Failed to establish accessibility connection")
            return nil
        }

        // Implement retry logic for getting a valid window
        var validWindow: AXUIElement?
        for attempt in 1...3 {
            if let window = getValidWindowElement(from: appRef) {
                validWindow = window
                break
            }
            logger.info("Attempt \(attempt) failed to get valid window, retrying...")
            Thread.sleep(forTimeInterval: TimeInterval(0.5 * pow(2.0, Double(attempt - 1))))
        }

        guard let window = validWindow else {
            logger.error("Failed to get valid window after all attempts")
            return nil
        }

        // Get URL based on browser type
        switch bundleID {
        case "com.apple.Safari":
            return getSafariURL(windowElement: window)
        case "com.google.Chrome":
            return getChromeURL(windowElement: window)
        case "org.mozilla.firefox":
            return getFirefoxURL(windowElement: window)
        default:
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
      logger.error("Could not find the address bar in Safari.")
        return nil
    }

    // Function to get URL from Google Chrome
    private func getChromeURL(windowElement: AXUIElement) -> String? {
        // Validate window element first
        guard isWindowElementValid(windowElement) else {
            logger.error("Invalid window element")
            return nil
        }

        // Try up to 3 times with increasing delays
        for attempt in 1...3 {
            if let addressBarElement = findElement(ofType: kAXTextFieldRole, in: windowElement) {
                var urlRef: CFTypeRef?
                let result = AXUIElementCopyAttributeValue(addressBarElement, kAXValueAttribute as CFString, &urlRef)
                if result == .success, let urlString = urlRef as? String {
                    return urlString
                }
            }

            logger.info("Attempt \(attempt) failed to find address bar, waiting before retry...")
            // Exponential backoff: 0.5s, 1s, 2s
            Thread.sleep(forTimeInterval: TimeInterval(0.5 * pow(2.0, Double(attempt - 1))))

            // Try to refresh the window element's state
            var temp: AnyObject?
            _ = AXUIElementCopyAttributeValue(windowElement, kAXRoleAttribute as CFString, &temp)
        }

        logger.error("Could not find the address bar in Google Chrome after 3 attempts.")
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
      logger.error("Could not find the address bar in Firefox.")
        return nil
    }

    // Helper function to recursively find an element of a specific type
    private func findElement(ofType type: String, in element: AXUIElement) -> AXUIElement? {
        // First verify we can access the element
        var roleRef: AnyObject?
        let roleResult = AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &roleRef)

        if roleResult != .success {
            logger.error("Failed to get role for element: \(roleResult)")
            return nil
        }

        guard let role = roleRef as? String else {
            logger.error("Could not cast role to String")
            return nil
        }

        if role == type {
            return element
        }

        var childrenRef: AnyObject?
        let childrenResult = AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &childrenRef)

        if childrenResult != .success {
            // Try to get more specific error information
            switch childrenResult {
            case .apiDisabled:
                logger.error("Accessibility API is disabled")
            case .invalidUIElement:
                logger.error("Invalid UI Element")
            case .cannotComplete:
                logger.error("Cannot complete the operation")
            case .notImplemented:
                logger.error("Not implemented")
            default:
                logger.error("Failed to get children with error: \(childrenResult)")
            }
            return nil
        }

        guard let children = childrenRef as? [AXUIElement] else {
            logger.error("Could not cast children to [AXUIElement]")
            return nil
        }

        for child in children {
            if let found = findElement(ofType: type, in: child) {
                return found
            }
        }

        return nil
    }

    private func isWindowElementValid(_ element: AXUIElement) -> Bool {
        var roleRef: AnyObject?
        let roleResult = AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &roleRef)

        guard roleResult == .success,
              let role = roleRef as? String,
              role == kAXWindowRole else {
            logger.error("Window element validation failed with error: \(roleResult)")
            return false
        }

        return true
    }

}
