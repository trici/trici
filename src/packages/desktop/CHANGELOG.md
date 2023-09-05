# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/trici/trici/compare/@trici/desktop@0.2.0...@trici/desktop@0.3.0) (2023-09-05)

### Bug Fixes

- Changed startedBy to be separate from startedFrom ([c16fe78](https://github.com/trici/trici/commit/c16fe78e3a608447d490fb61f637e8213c47e3f4))
- Changed the dispatcher so that actions dispatched are queued ([79a058d](https://github.com/trici/trici/commit/79a058d17076d8ba5c5a9cfc7f52d9d6c4dc0207))
- Changes to enable the build to run in Asar ([72eddc0](https://github.com/trici/trici/commit/72eddc0f3fd0bbfbdea25fd6413c3ee57b8bd448))
- ffmpeg process was not stopping on end of focus session ([2144dad](https://github.com/trici/trici/commit/2144dadadac84600fc6eb67ee2a2c7a83458aae7))
- preload file load was throwing an error ([ae2a442](https://github.com/trici/trici/commit/ae2a442c18d56d31f7b29024bdf5878e4013c0a4))

### Features

- Added the ability to start a Focus Session from the Tray menu. Also fixed issue where the ffmpeg binary was not updated in the bin folder. ([3aadec7](https://github.com/trici/trici/commit/3aadec71b1b381b28a4c5628b3e44a369ae60267))
- Created a separate folder for builds and docs. Got the first basic build working. Moved the packages to inside the src folder. Added scripts to publish a build from src/packages/desktop to builds. Added scripts to create packaged apps and installers from published builds. ([dbe6a5d](https://github.com/trici/trici/commit/dbe6a5d97b690b387dd6a6ff38b5fd3dbc7db072))

# [0.2.0](https://github.com/trici/trici/compare/@trici/desktop@0.1.1...@trici/desktop@0.2.0) (2023-05-13)

### Features

- First check in of UserActivityMonitorService. ([ca6e3b5](https://github.com/trici/trici/commit/ca6e3b5360755a90824c869a6e9cc237541e6f1b))

## [0.1.1](https://github.com/trici/trici/compare/@trici/desktop@0.1.0...@trici/desktop@0.1.1) (2023-04-27)

**Note:** Version bump only for package @trici/desktop
