//
//  FrontmostObserver.swift
//  MacFrontmostObserver
//
//  Created by Shashi Singh on 31/01/23.
//

import AppKit
import Foundation

public struct FrontmostObserver {

    public func startObserver() {
        let workspace = NSWorkspace.shared
        let notificationCenter = workspace.notificationCenter

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
            let message = "{ frontmostApp: \(app.localizedName ?? "unknown"), timestamp: \(Date().timeIntervalSince1970)}"
//            print("\(message)")
            FileHandle.standardOutput.write("\(message)".data(using: .utf8)!)
        }

//        var shouldKeepRunning = true
//        let runLoop = RunLoop.current
//        while shouldKeepRunning {
//            runLoop.run(mode: .default, before: .distantFuture)
//        }
    }
    
    public func stopObserver() {
        
    }
}

