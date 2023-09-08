# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.3.1](https://github.com/trici/trici/compare/@trici/app-observer@1.3.0...@trici/app-observer@1.3.1) (2023-09-08)

### Bug Fixes

- **AppObserverService:** an unhandled exception was thrown on child process exit ([8585fb5](https://github.com/trici/trici/commit/8585fb55cf7d559a34c7057aad6ebb6c296707db))

# [1.3.0](https://github.com/trici/trici/compare/@trici/app-observer@1.2.0...@trici/app-observer@1.3.0) (2023-09-05)

### Bug Fixes

- Build dev process was deleting the prod executable instead of dev ([4b0528d](https://github.com/trici/trici/commit/4b0528dd06cc9e57494c3493eb801bc04f1fcc0d))

### Features

- Created a separate folder for builds and docs. Got the first basic build working. Moved the packages to inside the src folder. Added scripts to publish a build from src/packages/desktop to builds. Added scripts to create packaged apps and installers from published builds. ([dbe6a5d](https://github.com/trici/trici/commit/dbe6a5d97b690b387dd6a6ff38b5fd3dbc7db072))

# [1.2.0](https://github.com/trici/trici/compare/@trici/app-observer@1.1.0...@trici/app-observer@1.2.0) (2023-05-13)

### Features

- When the app observer service starts, it outputs which is the current frontmost application. Also, outputing string from the native binary which can be easily parsed as JSON. ([1592997](https://github.com/trici/trici/commit/1592997693c0fdde4b216e4893bf00689dbf860a))

# 1.1.0 (2023-04-27)

### Bug Fixes

- Removed extra comma which was corrupting json format and parsing ([0cb87ca](https://github.com/trici/trici/commit/0cb87cabe455abbbe1cd9a5ecdef02cc0eb9c8ca))

### Features

- First check in of app-observer package which gives emits whenevr the frontmost app changes. Currently implemented only for Mac. ([74c8c2c](https://github.com/trici/trici/commit/74c8c2c288c9b1703e1895514277acbb89070dad))
