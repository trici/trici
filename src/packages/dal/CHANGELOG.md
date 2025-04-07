# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.1](https://github.com/trici/trici/compare/@trici/dal@2.3.0...@trici/dal@2.3.1) (2025-04-07)

### Bug Fixes

- Logger was not getting updated with updated defaultMeta. Now fetch the latest logger always ([2272d2a](https://github.com/trici/trici/commit/2272d2aa260db5b7b7a9fcd7cf79684bb8eb8150))

# [2.3.0](https://github.com/trici/trici/compare/@trici/dal@2.2.0...@trici/dal@2.3.0) (2025-03-06)

### Bug Fixes

- Don't start a FocusSession within a cooldown period when the user has manually ended the session. Also, this led to rectifying how we store how the FocusSession start/end was triggered. ([8ed651e](https://github.com/trici/trici/commit/8ed651eb0d7052351ccd7678f47b80cc04bd87dc))

### Features

- **@trici/dal:** Added a method to get the job to be handled ([ffe802a](https://github.com/trici/trici/commit/ffe802ae5b9cd0a1f87734255dea0a4426c31437))

# [2.2.0](https://github.com/trici/trici/compare/@trici/dal@2.1.0...@trici/dal@2.2.0) (2025-02-19)

### Bug Fixes

- **@trici/dal:** Add missing export to index to export the DhappRepo ([0d744a5](https://github.com/trici/trici/commit/0d744a53a0f9b3ddddc5d1d69416563d6eeea063))
- **@trici/dal:** Added column for job_name which is the name of the directory as well. Updated tests ([4f8a3c1](https://github.com/trici/trici/commit/4f8a3c1fb7bc8b53a98a2b2dede8d7a937b5c2d9))
- **@trici/dal:** Duplicate entries were being created for the same focus session. Also fixed test for this scenario. Focus Session id was nullable and not auto increment ([d6d828b](https://github.com/trici/trici/commit/d6d828bee36540bb5215746274c33b252d073b7e))
- **@trici/dal:** Fix tests for changes made in FocusSessionRepo, getFocusSessions changed to two methods, getFocusSessionsPaginated and getFocusSessionsForDuration ([13fb218](https://github.com/trici/trici/commit/13fb2183354471e3bd02b47ad45690cc4ee037f1))
- **@trici/dal:** Use the convention followed for the name of the interface. Export type as well. ([8af4616](https://github.com/trici/trici/commit/8af461677ed678a2636ba8c36f6baf87ad3e095e))
- **@trici/recorder:** Fix the name of the segment files being generated. ([81c87da](https://github.com/trici/trici/commit/81c87da84e10bd674ae395e0f5f50d9b3613c10e))

### Features

- **@trici/dal:** Added a method to return all AppEvents between a two timestamps ([4bce075](https://github.com/trici/trici/commit/4bce0758fe23c48982703f200a86fc5aa439626d))
- **@trici/dal:** Added FocusSession Repository. Refactored tests. Changed UsedApplicationsRepo to return the saved object ([894827f](https://github.com/trici/trici/commit/894827f317dd0bb9b4112982d4b8273108b91f39))
- **@trici/dal:** Added method to get focus sessions between two timestamps ([0706d84](https://github.com/trici/trici/commit/0706d8490d302227813078427f616f5cfb12a667))
- **@trici/dal:** Added Repository to keep track of Dhapp Jobs ([1cb8e6e](https://github.com/trici/trici/commit/1cb8e6e8c2229d3ddcd390c17836a5037f75de64))

# [2.1.0](https://github.com/trici/trici/compare/@trici/dal@2.0.0...@trici/dal@2.1.0) (2024-12-14)

### Features

- Improved the Event Viewer UI. Added a visualization as well and better filters. ([e774fd5](https://github.com/trici/trici/commit/e774fd5660ed6f52e3a21ff6ef3a8fcde8a13eac))

# [2.0.0](https://github.com/trici/trici/compare/@trici/dal@1.1.1...@trici/dal@2.0.0) (2024-11-05)

### Bug Fixes

- **@trici/dal:** accept knexfile as a parameter to init ([d160214](https://github.com/trici/trici/commit/d160214368dcaaf3e001082d4e885351cf3db437))
- **@trici/dal:** added count of records to be returned ([94148bd](https://github.com/trici/trici/commit/94148bdfa97a62d3d8f46829226380f6ea22f535))
- **@trici/dal:** dbManager should add the db name to the dataDirectoryPath ([2f86844](https://github.com/trici/trici/commit/2f86844b63580ca32429f5f12d373636fdf19b3d))
- **@trici/dal:** save app_identifier as the unique identifier in the table ([02b866a](https://github.com/trici/trici/commit/02b866afbb7c205e8d5bb1a5b1915dfb9bafef5b))

### Features

- **@trici/dal:** added a repository for UsedApplications ([fd867f8](https://github.com/trici/trici/commit/fd867f880181ab597e63a1689ef6a508f46010ea))
- Added repository to access Sqlite datastore ([2fd68be](https://github.com/trici/trici/commit/2fd68be10bc9619d916e1b693d633499d6424b2a))

### BREAKING CHANGES

- **@trici/dal:**

## [1.1.1](https://github.com/trici/trici/compare/@trici/dal@1.1.0...@trici/dal@1.1.1) (2023-09-08)

**Note:** Version bump only for package @trici/dal

# [1.1.0](https://github.com/trici/trici/compare/@trici/dal@1.0.3...@trici/dal@1.1.0) (2023-09-05)

### Features

- Created a separate folder for builds and docs. Got the first basic build working. Moved the packages to inside the src folder. Added scripts to publish a build from src/packages/desktop to builds. Added scripts to create packaged apps and installers from published builds. ([dbe6a5d](https://github.com/trici/trici/commit/dbe6a5d97b690b387dd6a6ff38b5fd3dbc7db072))

## [1.0.3](https://github.com/trici/trici/compare/@trici/dal@1.0.2...@trici/dal@1.0.3) (2023-05-13)

**Note:** Version bump only for package @trici/dal

## [1.0.2](https://github.com/trici/trici/compare/@trici/dal@1.0.1...@trici/dal@1.0.2) (2023-04-27)

**Note:** Version bump only for package @trici/dal
