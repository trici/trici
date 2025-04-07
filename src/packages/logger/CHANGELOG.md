# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.3.0](https://github.com/trici/trici/compare/@trici/logger@1.2.3...@trici/logger@1.3.0) (2025-04-07)

### Bug Fixes

- Logger was not getting updated with updated defaultMeta. Now fetch the latest logger always ([2272d2a](https://github.com/trici/trici/commit/2272d2aa260db5b7b7a9fcd7cf79684bb8eb8150))
- Update the logging level of transports when level is updated for LoggingService ([7e3832e](https://github.com/trici/trici/commit/7e3832edafdd0b3d054b9a95722a8dc6b3e94ab2))

### Features

- Changed the logging format to include a category if provided. This can be used to filter logs which is useful when debugging ([06e913a](https://github.com/trici/trici/commit/06e913a9ddcafc4d06848a176547289032085aff))

## [1.2.3](https://github.com/trici/trici/compare/@trici/logger@1.2.2...@trici/logger@1.2.3) (2025-02-19)

**Note:** Version bump only for package @trici/logger

## [1.2.2](https://github.com/trici/trici/compare/@trici/logger@1.2.1...@trici/logger@1.2.2) (2024-11-05)

**Note:** Version bump only for package @trici/logger

## [1.2.1](https://github.com/trici/trici/compare/@trici/logger@1.2.0...@trici/logger@1.2.1) (2023-09-08)

### Bug Fixes

- **LoggingService:** logging service failed to initialize when app was packaged as asar ([321d94c](https://github.com/trici/trici/commit/321d94c244718a107be208d53316008af19e4bf4))

# [1.2.0](https://github.com/trici/trici/compare/@trici/logger@1.1.0...@trici/logger@1.2.0) (2023-09-05)

### Features

- Created a separate folder for builds and docs. Got the first basic build working. Moved the packages to inside the src folder. Added scripts to publish a build from src/packages/desktop to builds. Added scripts to create packaged apps and installers from published builds. ([dbe6a5d](https://github.com/trici/trici/commit/dbe6a5d97b690b387dd6a6ff38b5fd3dbc7db072))

# [1.1.0](https://github.com/trici/trici/compare/@trici/logger@1.0.3...@trici/logger@1.1.0) (2023-04-27)

### Features

- Added a function which exports a simple console logger. Can be used in unit tests and other places where we may not setup the complete loggingService ([0c9de40](https://github.com/trici/trici/commit/0c9de40776d53b42bbbcf8973d3f51a3ac32293c))
