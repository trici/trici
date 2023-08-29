# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.2.0](https://github.com/trici/trici/compare/@trici/app-observer@1.1.0...@trici/app-observer@1.2.0) (2023-05-13)

### Features

- When the app observer service starts, it outputs which is the current frontmost application. Also, outputing string from the native binary which can be easily parsed as JSON. ([1592997](https://github.com/trici/trici/commit/1592997693c0fdde4b216e4893bf00689dbf860a))

# 1.1.0 (2023-04-27)

### Bug Fixes

- Removed extra comma which was corrupting json format and parsing ([0cb87ca](https://github.com/trici/trici/commit/0cb87cabe455abbbe1cd9a5ecdef02cc0eb9c8ca))

### Features

- First check in of app-observer package which gives emits whenevr the frontmost app changes. Currently implemented only for Mac. ([74c8c2c](https://github.com/trici/trici/commit/74c8c2c288c9b1703e1895514277acbb89070dad))
