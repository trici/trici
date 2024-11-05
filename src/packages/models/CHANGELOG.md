# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.4.0](https://github.com/trici/trici/compare/@trici/models@1.3.0...@trici/models@1.4.0) (2024-11-05)

### Bug Fixes

- **@trici/models:** added appIdentifier field and changed model name to UsedApplication ([13b30bb](https://github.com/trici/trici/commit/13b30bbe95a3dad8ae37b41301541bad920eb68b))
- **@trici/models:** added entity AppEvent to track AppEvents ([f965943](https://github.com/trici/trici/commit/f965943787d5bfe3f43b8d0e5ec33625e98ff213))
- Fix UI of alert window to use tailwind and proactive ([2dd093e](https://github.com/trici/trici/commit/2dd093ea55a326d1240b124470db94555e54a05d))

### Features

- **@trici/desktop:** Ask for accessibility permissions ([4b0857c](https://github.com/trici/trici/commit/4b0857ce1ea81da8e8c3cecd0833ce488e2b20f1))
- **@trici/desktop:** Use the new activmon package to handle UserActivityStateTransitions. ([f1b60a8](https://github.com/trici/trici/commit/f1b60a8ece9150e25af74c848eaddf852e922a5d))
- Added Onboarding ([4c4c602](https://github.com/trici/trici/commit/4c4c602fe6d8bc9fe0cf83ca3e9645f6e88fa80b))
- register global shortcuts when the app loads ([027022b](https://github.com/trici/trici/commit/027022bbeb83cd38f156eeaa1776587deb770686))
- Removed Asking which Screen to Record ([44b6553](https://github.com/trici/trici/commit/44b6553035a061d93e7e98b83efa71ad37eca2a2))
- UsedApplicationsService to save a list of applications used by the user ([cfd117c](https://github.com/trici/trici/commit/cfd117c9a4de18121469fae75d7ea7373d815cdc))

# [1.3.0](https://github.com/trici/trici/compare/@trici/models@1.2.0...@trici/models@1.3.0) (2023-09-08)

### Features

- Cpature which screen is being recorded in the FocusSession entity ([caf8e2e](https://github.com/trici/trici/commit/caf8e2e353d73eba4f877ecdd775f8efda5815f7))

# [1.2.0](https://github.com/trici/trici/compare/@trici/models@1.1.0...@trici/models@1.2.0) (2023-09-05)

### Bug Fixes

- Changed startedBy to be separate from startedFrom ([c16fe78](https://github.com/trici/trici/commit/c16fe78e3a608447d490fb61f637e8213c47e3f4))

### Features

- Created a separate folder for builds and docs. Got the first basic build working. Moved the packages to inside the src folder. Added scripts to publish a build from src/packages/desktop to builds. Added scripts to create packaged apps and installers from published builds. ([dbe6a5d](https://github.com/trici/trici/commit/dbe6a5d97b690b387dd6a6ff38b5fd3dbc7db072))

# [1.1.0](https://github.com/trici/trici/compare/@trici/models@1.0.1...@trici/models@1.1.0) (2023-05-13)

### Features

- Added entity to track DailyUserActivity ([3e05b03](https://github.com/trici/trici/commit/3e05b03a654bb571177d56affc31e1c5ae27b944))
