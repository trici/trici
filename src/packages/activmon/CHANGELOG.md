# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.1.2](https://github.com/trici/trici/compare/@trici/activmon@1.1.1...@trici/activmon@1.1.2) (2025-03-06)

**Note:** Version bump only for package @trici/activmon

## [1.1.1](https://github.com/trici/trici/compare/@trici/activmon@1.1.0...@trici/activmon@1.1.1) (2025-02-19)

### Bug Fixes

- **@trici/activmon:** Improve the granularity by considering the immediate and near average values. Also added condition allowing state change from active to hyperactive ([c70dd9e](https://github.com/trici/trici/commit/c70dd9e1fee4af5813e99e9f7c75765556929aa2))
- **@trici/activmon:** Pass parameters when the state changes ([29bd26b](https://github.com/trici/trici/commit/29bd26be2f32ae1de163139bc03f7a339a1b96dd))

# [1.1.0](https://github.com/trici/trici/compare/@trici/activmon@1.0.1...@trici/activmon@1.1.0) (2024-12-14)

### Bug Fixes

- Reset userStartedBecomingHyperActiveAt timestamp. Without this active -> becoming_hyper_active transition happens only once ([bf4ec81](https://github.com/trici/trici/commit/bf4ec81a244c3c29297497d0e821d0bb220fee0a))

### Features

- **@trici/activmon:** Improve granularity of state changes for better accuracy. ([1f1d9f2](https://github.com/trici/trici/commit/1f1d9f2fd02c4625cda279fe5766d701faa85cc6))

## 1.0.1 (2024-11-05)

### Bug Fixes

- **@trici/activmon:** State transition from hyperactive to active was missing. ([3028f49](https://github.com/trici/trici/commit/3028f49a7570e445ba60cf9456f7d7e852f78583))
