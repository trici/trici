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
        if let screen = getScreen(for: app), let screenID = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber {
            if screenID != activeScreenID {
                activeScreenID = screenID
                NotificationCenter.default.post(name: .activeScreenDidChange, object: screen)
            }
        }
        printActiveScreenDetails()
    }

    private func getScreen(for app: NSRunningApplication) -> NSScreen? {
        guard let windows = CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID) as? [[String: Any]] else {
            return nil
        }

        for window in windows {
            if let ownerPID = window[kCGWindowOwnerPID as String] as? pid_t,
               ownerPID == app.processIdentifier,
               let boundsDict = window[kCGWindowBounds as String] as? [String: CGFloat],
               let bounds = CGRect(dictionaryRepresentation: boundsDict as CFDictionary) {
                for screen in NSScreen.screens {
                    if screen.frame.intersects(bounds) {
                        return screen
                    }
                }
            }
        }
        return nil
    }
}


