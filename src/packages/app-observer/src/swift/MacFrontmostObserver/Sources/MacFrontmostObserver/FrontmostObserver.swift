//
//  FrontmostObserver.swift
//  MacFrontmostObserver
//
//  Created by Shashi Singh on 31/01/23.
//

import AppKit
import Foundation

public struct FrontmostObserver {

  private let workspace = NSWorkspace.shared

    public func startObserver() {
        let notificationCenter = workspace.notificationCenter

        if let frontmostApplication = workspace.frontmostApplication {
          let message: [String: Any] = [
                "frontmostApp": frontmostApplication.localizedName ?? "unknown",
                "timestamp": Date().timeIntervalSince1970
            ]
            if let data = try? JSONSerialization.data(withJSONObject: message),
               let jsonString = String(data: data, encoding: .utf8) {
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
            // print the app name and unixtimestamp
            let message: [ String: Any] = [
                "frontmostApp": app.localizedName ?? "unknown",
                "timestamp": Date().timeIntervalSince1970
            ]
            if let data = try? JSONSerialization.data(withJSONObject: message),
               let jsonString = String(data: data, encoding: .utf8) {
                FileHandle.standardOutput.write("\(jsonString)\n".data(using: .utf8)!)
            }
        }

    }

    public func stopObserver() {
        workspace.notificationCenter.removeObserver(self)
    }
}

