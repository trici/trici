//
//  FrontmostObserver.swift
//  turiya
//
//  Created by Shashi Singh on 20/09/24.
//

import AppKit
import Foundation

public struct FrontmostObserver {
  private let workspace = NSWorkspace.shared

  public func startObserver() {
    let notificationCenter = workspace.notificationCenter

    if let frontmostApplication = workspace.frontmostApplication {
      let appName = frontmostApplication.localizedName ?? "unknown"
      let appIdentifier = frontmostApplication.bundleIdentifier ?? "unknown"

      let appDetails: [String: Any] = [
        "appName": appName,
        "appIdentifier": appIdentifier,
      ]

      let message: [String: Any] = [
        "type": "frontmostApp",
        "response": appDetails,
        "timestamp": Date().timeIntervalSince1970,
      ]
      if let data = try? JSONSerialization.data(withJSONObject: message),
         let jsonString = String(data: data, encoding: .utf8)
      {
        FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
      }
    }

    notificationCenter.addObserver(
      forName: NSWorkspace.didActivateApplicationNotification,
      object: nil,
      queue: nil
    ) { notification in
      guard let userInfo = notification.userInfo,
            let app = userInfo[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication
      else {
        return
      }

      let appName = app.localizedName ?? "unknown"
      let appIdentifier = app.bundleIdentifier ?? "unknown"

      let appDetails: [String: Any] = [
        "appName": appName,
        "appIdentifier": appIdentifier,
      ]
      // print the app name and unixtimestamp
      let message: [String: Any] = [
        "type": "frontmostApp",
        "response": appDetails,
        "timestamp": Date().timeIntervalSince1970,
      ]
      if let data = try? JSONSerialization.data(withJSONObject: message),
         let jsonString = String(data: data, encoding: .utf8)
      {
        FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
      }
        if (appIdentifier == "com.google.Chrome") {
            var appObserverMethods = AppObserverMethods()
            appObserverMethods.getActiveBrowserOpenedURL()
        }
      
    }
  }

  public func stopObserver() {
    workspace.notificationCenter.removeObserver(self)
  }
}
