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



    func getActiveBrowserOpenedURL() {
        let result = getFrontmostBrowserURL()

      logger.debug("result\(result)")

        if let url = result.url {
            // Success case
            let successResponse: [String: Any] = [
                "type": "activeBrowserOpenedUrlSuccess",
                "response": url,
                "timestamp": Date().timeIntervalSince1970
            ]

            if let data = try? JSONSerialization.data(withJSONObject: successResponse),
               let jsonString = String(data: data, encoding: .utf8) {
                FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
            }
        } else {
            // Error case
            let errorResponse: [String: Any] = [
                "type": "activeBrowserOpenedUrlError",
                "response": result.error?.description ?? "Unknown error",
                "timestamp": Date().timeIntervalSince1970
            ]

            if let data = try? JSONSerialization.data(withJSONObject: errorResponse),
               let jsonString = String(data: data, encoding: .utf8) {
                FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
            }
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
//      logger.info("AccessibilityHierarchy of App")
//      dumpAccessibilityHierarchy(of: appRef, logger: logger)
        // First try focused window
        var focusedWindowRef: CFTypeRef?
        let focusedWindowError = AXUIElementCopyAttributeValue(appRef, kAXFocusedWindowAttribute as CFString, &focusedWindowRef)

        if focusedWindowError == .success {
            let focusedWindow = focusedWindowRef as! AXUIElement
            // Verify the window
            var roleRef: CFTypeRef?
            let roleResult = AXUIElementCopyAttributeValue(focusedWindow, kAXRoleAttribute as CFString, &roleRef)

//          logger.info("AccesiibilityHierarchy of Window")
//          dumpAccessibilityHierarchy(of: focusedWindow, logger: logger)

          let role = roleRef as? String
          logger.info("focusedWindowRole:\(role)")

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

              let role = roleRef as? String
              logger.info("Window role:\(role)")

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

    enum BrowserURLError {
        case noFrontmostApp
        case noBundleIdentifier
        case unsupportedBrowser(String)
        case accessibilityConnectionFailed
        case noValidWindow
        case addressBarNotFound
        case other(String)

        var description: String {
            switch self {
                case .noFrontmostApp: return "Could not get the frontmost application"
                case .noBundleIdentifier: return "Could not get the bundle identifier"
                case .unsupportedBrowser(let id): return "Unsupported browser: \(id)"
                case .accessibilityConnectionFailed: return "Failed to establish accessibility connection"
                case .noValidWindow: return "Failed to get valid window"
                case .addressBarNotFound: return "Could not find the address bar"
                case .other(let message): return message
            }
        }
    }

    struct BrowserURLResult {
        let url: String?
        let error: BrowserURLError?

        static func success(_ url: String) -> BrowserURLResult {
            return BrowserURLResult(url: url, error: nil)
        }

        static func failure(_ error: BrowserURLError) -> BrowserURLResult {
            return BrowserURLResult(url: nil, error: error)
        }
    }

    private func getFrontmostBrowserURL() -> BrowserURLResult {
        guard let frontmostApp = NSWorkspace.shared.frontmostApplication else {
            return .failure(.noFrontmostApp)
        }

        let pid = frontmostApp.processIdentifier
        logger.info("frontmostProcessId: \(pid)")

        guard let bundleID = frontmostApp.bundleIdentifier else {
            return .failure(.noBundleIdentifier)
        }

        let supportedBrowsers = [
            "com.apple.Safari",
            "com.google.Chrome",
            "org.mozilla.firefox"
        ]

        guard supportedBrowsers.contains(bundleID) else {
            return .failure(.unsupportedBrowser(bundleID))
        }

        guard let appRef = reestablishAccessibilityConnection(for: pid) else {
            return .failure(.accessibilityConnectionFailed)
        }

        // Implement retry logic for getting a valid window
        var validWindow: AXUIElement?
            if let window = getValidWindowElement(from: appRef) {
                validWindow = window
        }

        let usingAccessibility = validWindow != nil

        if !usingAccessibility {
            logger.info("No valid window found via AX. Will try AppleScript methods")
        }

        // Get URL based on browser type
        switch bundleID {
        case "com.apple.Safari":
            if usingAccessibility, let window = validWindow, let url = getSafariURL(windowElement: window) {
                return .success(url)
            }
            // TODO: Implement Safari AppleScript method
            return .failure(.addressBarNotFound)
        case "com.google.Chrome":
            if usingAccessibility, let window = validWindow, let url = getChromeURL(windowElement: window) {
                return .success(url)
            }
            if let url = getChromeURLViaAppleScript() {
                return .success(url)
            }
            return .failure(.addressBarNotFound)
        case "org.mozilla.firefox":
            if usingAccessibility, let window = validWindow, let url = getFirefoxURL(windowElement: window) {
                return .success(url)
            }
            // TODO: Implement Firefox AppleScript method
            return .failure(.addressBarNotFound)
        default:
            return .failure(.other("Unexpected browser type"))
        }
    }

    // Function to get URL from Safari
    private func getSafariURL(windowElement: AXUIElement) -> String? {
        if let addressBarElement = findElement(ofType: kAXTextFieldRole, in: windowElement) {
            var urlRef: CFTypeRef?
            let result = AXUIElementCopyAttributeValue(addressBarElement, kAXValueAttribute as CFString, &urlRef)
            if result == .success, let urlString = urlRef as? String {
                return urlString
            }
        }
        return nil
    }

    // Function to get URL from Google Chrome
    private func getChromeURL(windowElement: AXUIElement) -> String? {
        guard isWindowElementValid(windowElement) else {
            return nil
        }

        if let addressBarElement = findElement(ofType: kAXTextFieldRole, in: windowElement) {
            var urlRef: CFTypeRef?
            let result = AXUIElementCopyAttributeValue(addressBarElement, kAXValueAttribute as CFString, &urlRef)
            if result == .success, let urlString = urlRef as? String {
                return urlString
            }
        }

        return nil
    }

    // Function to get URL from Firefox
    private func getFirefoxURL(windowElement: AXUIElement) -> String? {
        if let addressBarElement = findElement(ofType: kAXTextFieldRole, in: windowElement) {
            var urlRef: CFTypeRef?
            let result = AXUIElementCopyAttributeValue(addressBarElement, kAXValueAttribute as CFString, &urlRef)
            if result == .success, let urlString = urlRef as? String {
                return urlString
            }
        }
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

//    // Add this new function
//    private func getChromeURLViaAppleScript() -> String? {
//        let script = """
//        tell application "Google Chrome"
//            if windows is not {} then
//                get URL of active tab of first window
//            end if
//        end tell
//        """
//
//        let appleScript = NSAppleScript(source: script)
//        var error: NSDictionary?
//
//        if let result = appleScript?.executeAndReturnError(&error).stringValue {
//            return result
//        } else if let error = error {
//            logger.error("AppleScript error: \(error)")
//        }
//
//        return nil
//    }

  private func getChromeURLViaAppleScript() -> String? {
      let source = """
      tell application "Google Chrome"
        if (count of windows) > 0 then
          return URL of active tab of front window
        end if
      end tell
      """
      let task = Process()
      task.launchPath = "/usr/bin/osascript"
      task.arguments = ["-e", source]
      let pipe = Pipe()
      task.standardOutput = pipe
      task.launch()
      task.waitUntilExit()

      let data = pipe.fileHandleForReading.readDataToEndOfFile()
      guard !data.isEmpty, let str = String(data: data, encoding: .utf8) else {
        return nil
      }
      return str.trimmingCharacters(in: .whitespacesAndNewlines)
  }


}
