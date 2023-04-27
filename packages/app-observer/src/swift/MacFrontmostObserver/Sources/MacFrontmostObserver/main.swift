//
//  main.swift
//  MacFrontmostObserver
//
//  Created by Shashi Singh on 31/01/23.
//

import Foundation

let frontmostObserver = FrontmostObserver()

print("Hello, World!")

print ("Starting frontmost observer")

frontmostObserver.startObserver()

RunLoop.current.run()

