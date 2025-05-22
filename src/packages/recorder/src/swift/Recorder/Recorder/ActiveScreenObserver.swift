//
//  ActiveScreenObserver.swift
//  Recorder
//
//  Created by Shashi Singh on 23/05/24.
//


import AppKit
import Foundation

extension Notification.Name {
    static let activeScreenDidChange = Notification.Name("activeScreenDidChange")
}

public class ActiveScreenObserver {
    private let workspace = NSWorkspace.shared
    private var activeScreenID: NSNumber?
    private var observer: Any?
    private var logger: Logger

  init(logger:Logger) {
    self.logger = logger
  }
    
    public func getActiveScreenID() -> NSNumber? {
        return activeScreenID
    }

    public func startObserver() {
        let notificationCenter = workspace.notificationCenter


        observer = notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification,
            object: nil,
            queue: nil
        ) { [weak self] notification in
            guard let self = self,
                  let userInfo = notification.userInfo,
                  let app = userInfo[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication else {
                return
            }

            self.checkAndNotifyActiveScreen(for: app)
        }
      // Call checkAndNotifyActiveScreen when startObserver is called
          if let activeApp = NSWorkspace.shared.frontmostApplication {
              checkAndNotifyActiveScreen(for: activeApp)
          }
    }

    public func stopObserver() {
        if let observer = observer {
            workspace.notificationCenter.removeObserver(observer)
        }
        observer = nil
    }
    
    public func printActiveScreenDetails() {
            guard let screenID = activeScreenID else {
              logger.error("No active screen ID found.")
                return
            }

            for screen in NSScreen.screens {
                if let currentScreenID = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber,
                   currentScreenID == screenID {
                  let screenFrame: CGRect = screen.frame

                  logger.debug("Active Screen Details:")
                  logger.debug("Screen ID: \(screenID)")
                  logger.debug("Screen Frame: \(String(describing: screenFrame))")
                    return
                }
            }

      logger.error("Active screen not found for the last known screen ID.")
        }
    private func checkAndNotifyActiveScreen(for app: NSRunningApplication) {
      logger.debug("Inside checkAndNotifyActiveScreen")
        if let screen = getScreen(for: app), let screenID = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber {
          logger.debug("foundScreenId:\(screenID)")
            if screenID != activeScreenID {
                activeScreenID = screenID
                NotificationCenter.default.post(name: .activeScreenDidChange, object: screen)
            }
        } else{
          logger.error("Screen returned nil")
        }
      logger.debug("activeApp:\(app.localizedName ?? "Unknown app")")
      logger.debug("activeAppProcessId:\(app.processIdentifier)")
        printActiveScreenDetails()
    }
  
  

  
  private func getScreen(for app: NSRunningApplication) -> NSScreen? {
      // Try only truly on-screen windows first
      if let s = screen(for: app, options: .optionOnScreenOnly) {
        logger.info("found screen searching onScreenWindows")
          return s
      }
      // Fallback to *all* windows
      if let s = screen(for: app, options: .optionAll) {
        logger.info("found screen searching allWindows")
          return s
      }
      // Ultimate fallback
      return nil
  }

  /// Shared helper: pick the frontmost normal window for `app` in the given window list
  private func screen(for app: NSRunningApplication, options: CGWindowListOption) -> NSScreen? {
      guard let info = CGWindowListCopyWindowInfo(options, kCGNullWindowID)
                              as? [[String: Any]] else { return nil }

      for win in info {
          guard
            let pid = win[kCGWindowOwnerPID as String] as? pid_t,
            pid == app.processIdentifier,

            // ignore non-normal layers (menus, sheets, etc)
            let layer = win[kCGWindowLayer as String] as? Int, layer == 0,

            let boundsDict = win[kCGWindowBounds as String] as? [String: CGFloat],
            let bounds = CGRect(dictionaryRepresentation: boundsDict as CFDictionary)
          else { continue }

          // first screen that overlaps
          if let screen = NSScreen.screens.first(where: { $0.frame.intersects(bounds) }) {
              return screen
          }
      }
      return nil
  }
  
//    private func getScreen(for app: NSRunningApplication) -> NSScreen? {
//      logger.debug("Inside getScreen")
//      guard let windows = CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID) as? [[String: Any]] else {
//            return nil
//        }
//
//        for window in windows {
//            if let ownerPID = window[kCGWindowOwnerPID as String] as? pid_t,
//               ownerPID == app.processIdentifier,
//               let boundsDict = window[kCGWindowBounds as String] as? [String: CGFloat],
//               let bounds = CGRect(dictionaryRepresentation: boundsDict as CFDictionary) {
//                for screen in NSScreen.screens {
//                  print("🔍 Window bounds: \(bounds)  —  Screen frame: \(screen.frame)")
//                    if screen.frame.intersects(bounds) {
//                      print("✅ Matched on screen with frame: \(screen.frame) for bounds: \(bounds)")
//                        return screen
//                    }
//                }
//            }
//        }
//      logger.info("getScreen Returning nil")
//        return nil
//    }
}


