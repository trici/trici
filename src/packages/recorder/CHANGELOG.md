# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.4.0](https://github.com/trici/trici/compare/@trici/recorder@1.3.1...@trici/recorder@1.4.0) (2025-04-07)

### Bug Fixes

- **@trici/recorder:** Fixed the duration of recording issue by removing separate encoder process. Gave up on the requirement of HLS using ffmpeg and watermark because its complicated to use both and get the timing/duration of the recording right ([11de475](https://github.com/trici/trici/commit/11de47594c6539fdb0c8484111ad20491aa6fddd))
- **@trici/recorder:** Improved communication with child process. Cleaner sequence of closing and exiting processes on recorderStop. Removed redundant code that was fetching screen resolution as now the resolution is fixed. ([11edd71](https://github.com/trici/trici/commit/11edd71dccb01600ff3f2166db4875fbd3a8536a))
- **@trici/recorder:** Pass the session start and end timestamp and log them. Notify the parent process of screenRecorderStopped ([648fcc9](https://github.com/trici/trici/commit/648fcc9a84fdf5d78ac8deb674a6304e1f08b142))
- **@trici/recorder:** Use timestamps from actual frames to ensure video is of correct duration ([e8bee34](https://github.com/trici/trici/commit/e8bee34f1b46d5e2001c2efbdca7ef0ddeeac2af))
- **@trici/recorder:** Write using fragmented mp4 for better recovery in case of a crash ([c2c30b7](https://github.com/trici/trici/commit/c2c30b703256a966bf38a1000095a2a9d1b4ff6f))
- Logger was not getting updated with updated defaultMeta. Now fetch the latest logger always ([2272d2a](https://github.com/trici/trici/commit/2272d2aa260db5b7b7a9fcd7cf79684bb8eb8150))
- Set environment variable APP_ENV and pass it to child processes. ([f460b00](https://github.com/trici/trici/commit/f460b008ea998aa374a5bc7bf30df6b597d66e24))
- Test was not running due to incorrect function called ([61eaf54](https://github.com/trici/trici/commit/61eaf545cdf2b880640bb163c548df9a0b268026))

### Features

- **@trici/recorder:** Added a method to directly write mp4 file without using ffmpeg. The duration of the written video is less but committing as at least an mp4 file that plays is being written. ([31f2f72](https://github.com/trici/trici/commit/31f2f72eea3c87e363b608f45f26ca5cf644550f))

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
