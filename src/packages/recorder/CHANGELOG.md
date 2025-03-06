# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.3.1](https://github.com/trici/trici/compare/@trici/recorder@1.3.0...@trici/recorder@1.3.1) (2025-03-06)

**Note:** Version bump only for package @trici/recorder

# [1.3.0](https://github.com/trici/trici/compare/@trici/recorder@1.2.4...@trici/recorder@1.3.0) (2025-02-19)

### Bug Fixes

- **@trici/recorder:** Fix the name of the segment files being generated. ([81c87da](https://github.com/trici/trici/commit/81c87da84e10bd674ae395e0f5f50d9b3613c10e))
- **@trici/recorder:** Throw error on failure. getResolution and start command were not parsed as separate commands ([9423951](https://github.com/trici/trici/commit/9423951c2f390c12f2798d2134bf01a6bcb6e112))
- **@trici/recorder:** Using constant value for output resolution. Also using HLS feature of ffmpeg which outputs ts files alongwith playlist. ([3abd8a9](https://github.com/trici/trici/commit/3abd8a922879da50a85ba9c15af1a081b14a7349))

### Features

- **@trici/recorder:** Added a method to take screenshot of the active screen ([a22bac6](https://github.com/trici/trici/commit/a22bac6a6f78e2605d2bf3fcf7bcdf6a313229a2))

## [1.2.4](https://github.com/trici/trici/compare/@trici/recorder@1.2.3...@trici/recorder@1.2.4) (2024-12-14)

**Note:** Version bump only for package @trici/recorder

## [1.2.3](https://github.com/trici/trici/compare/@trici/recorder@1.2.2...@trici/recorder@1.2.3) (2024-11-05)

### Bug Fixes

- **@trici/recorder:** Fix frame drop issue. Number of frames being outputted by ScreenCaptureKit was throttled as the Frame processing (writing to named pipe) was throttling. ([6464a43](https://github.com/trici/trici/commit/6464a4301d8c9f849923b1482fa5703b0c45d4de))
- Added correct path of watermark image ([fcc92b7](https://github.com/trici/trici/commit/fcc92b78e3488a0bf984e04f81bff1d3e14e3c92))
- Recording file duration was less than actual recording duration ([8dc3384](https://github.com/trici/trici/commit/8dc3384ebc835159c73eb59825ef58f545dac714))

## [1.2.2](https://github.com/trici/trici/compare/@trici/recorder@1.2.1...@trici/recorder@1.2.2) (2023-09-12)

### Bug Fixes

- **recorder:** recording process was crashing when using asar ([92e2a13](https://github.com/trici/trici/commit/92e2a13167772446b571baab5928f2692a3b22b0))

## [1.2.1](https://github.com/trici/trici/compare/@trici/recorder@1.2.0...@trici/recorder@1.2.1) (2023-09-08)

### Bug Fixes

- use the correct device index from screenToRecord ([065081a](https://github.com/trici/trici/commit/065081ae84c4e3561fdc5b8ff1f2e9a08b8b87f9))

# [1.2.0](https://github.com/trici/trici/compare/@trici/recorder@1.1.0...@trici/recorder@1.2.0) (2023-09-05)

### Features

- Created a separate folder for builds and docs. Got the first basic build working. Moved the packages to inside the src folder. Added scripts to publish a build from src/packages/desktop to builds. Added scripts to create packaged apps and installers from published builds. ([dbe6a5d](https://github.com/trici/trici/commit/dbe6a5d97b690b387dd6a6ff38b5fd3dbc7db072))

# 1.1.0 (2023-05-13)

### Features

- First check in of @trici/recorder. Uses ffmpeg to live record the screen ([84af0a4](https://github.com/trici/trici/commit/84af0a488631e4b71f580fb4fe8a177eb40f546e))
