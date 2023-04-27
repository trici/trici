// swift-tools-version:5.7.1
import PackageDescription

let package = Package(
  name: "MacFrontmostObserver",
  platforms: [
		.macOS(.v10_13)
	],
  products: [
    .executable(
      name: "MacFrontmostObserver",
      targets: ["MacFrontmostObserver"]
    )
  ],
  targets: [
    .executableTarget(
      name: "MacFrontmostObserver"
    )
  ]
)
