# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.6.2](https://github.com/trici/trici/compare/@trici/app-observer@1.6.1...@trici/app-observer@1.6.2) (2025-04-07)

### Bug Fixes

- Logger was not getting updated with updated defaultMeta. Now fetch the latest logger always ([2272d2a](https://github.com/trici/trici/commit/2272d2aa260db5b7b7a9fcd7cf79684bb8eb8150))
- Set environment variable APP_ENV and pass it to child processes. ([f460b00](https://github.com/trici/trici/commit/f460b008ea998aa374a5bc7bf30df6b597d66e24))

## [1.6.1](https://github.com/trici/trici/compare/@trici/app-observer@1.6.0...@trici/app-observer@1.6.1) (2025-03-06)

**Note:** Version bump only for package @trici/app-observer

# [1.6.0](https://github.com/trici/trici/compare/@trici/app-observer@1.5.0...@trici/app-observer@1.6.0) (2025-02-19)

### Bug Fixes

- **@trici/app-observer:** Fix the test directory value being passed as param to mimic what will be actually passed ([7c96a49](https://github.com/trici/trici/commit/7c96a495d252000d04e4a5bf64a02e1bb61a8552))
- **@trici/app-observer:** Handle the scenario where multiple lines are outputted at once. ([a185f45](https://github.com/trici/trici/commit/a185f4552f70cf7ddf15be1a6670f879a297dc94))
- **@trici/app-observer:** If Accessibility API fails then use AppleScript correctly ([42e9e61](https://github.com/trici/trici/commit/42e9e6177124890a4c0c26aadec49bf5612a9650))
- **@trici/app-observer:** Pass the logsDirectory path as a parameter. Handle initialization of Logging service correctly ([204a777](https://github.com/trici/trici/commit/204a7778ae12d00d44e578d88a6df709626be1bc))
- **@trici/app-observer:** Return the reason the for failure to get the url than simply undefined ([bea947d](https://github.com/trici/trici/commit/bea947d885c3c3fca94c6c41f2cdf0a9c5dd20a9))

### Features

- **@trici/app-observer:** Added a method to get SystemIdleTime in milliseconds. Removed Old console app project ([2f0749b](https://github.com/trici/trici/commit/2f0749b4a249efe38745a05e6e3dfec51fc9ecdf))
- **@trici/app-observer:** Save the AppChangeHistory and return more details when fetching the current app ([4565353](https://github.com/trici/trici/commit/4565353f2284773ea2df4c56a2afb50e90ddc700))
- **@trici/app-observer:** Take the logs directory as a parameter passed to the console app ([b221608](https://github.com/trici/trici/commit/b2216085e4555a459cb25ee9bc5eaca722bdd85d))

# [1.5.0](https://github.com/trici/trici/compare/@trici/app-observer@1.4.0...@trici/app-observer@1.5.0) (2024-12-14)

### Bug Fixes

- **@trici/app-observer:** The url was coming as undefined sometimes with the error could not find address bar. Likely that the frontWindow being selected was not the focused window ([af4de33](https://github.com/trici/trici/commit/af4de3355973a642638bc362c10b93f1c2e9fc3f))

### Features

- **@trici/app-observer:** Added method to return the current url from the browser ([83d134b](https://github.com/trici/trici/commit/83d134b4e33cfeeca13be9f08ec106b501c3110a))

# [1.4.0](https://github.com/trici/trici/compare/@trici/app-observer@1.3.2...@trici/app-observer@1.4.0) (2024-11-05)

### Bug Fixes

- **@trici/app-observer:** Addition of bundleIdentifier should not break AppObserverResponse return type ([962719f](https://github.com/trici/trici/commit/962719feb54adca4dc698a86267c9eb70224fb84))
- **@trici/app-observer:** changed the value of Info.plist field being used to get more consistent names ([c502a3c](https://github.com/trici/trici/commit/c502a3cc733d9c80d2fb2f6e43192e3d87e923c2))
- **@trici/app-observer:** Name of the installed app should be same as running app ([83fad30](https://github.com/trici/trici/commit/83fad30094fca5f88be437e871cbe231f9e7c263))
- **@trici/app-observer:** return bundleIdentifier alongwith existin app related info ([2141fc9](https://github.com/trici/trici/commit/2141fc97173a34c2840505af4fc05a4445a3bf2f))
- **@trici/app-observer:** using bundleIdentifier to uniquely identify apps on Mac ([bd041be](https://github.com/trici/trici/commit/bd041be64a09523146fb2f738bd410f88d98a9c9))
- **AppObserverService:** round off the time spent on application ([fd59a0b](https://github.com/trici/trici/commit/fd59a0bfe31dcceaec67b593c234607ff3742adb))
- Update the binary location to use turiya ([e7f0ea7](https://github.com/trici/trici/commit/e7f0ea78cb9ef9ad46f094bca100d7eaca848a6a))

### Features

- **@trici/app-observer:** added a method to return a list of installed apps alongwith icons ([9711a4d](https://github.com/trici/trici/commit/9711a4d4b851979476722f2d27473e6b5c1786ae))
- Added method to get the browser url ([68ea089](https://github.com/trici/trici/commit/68ea089377113d53cf3936a6c881c88ef2575f60))
- **AppObserverService:** added new info to appChange data that is emitted ([2eb19bb](https://github.com/trici/trici/commit/2eb19bbdf3ceef404d19c3c29814741e2225b0eb))

## [1.3.2](https://github.com/trici/trici/compare/@trici/app-observer@1.3.1...@trici/app-observer@1.3.2) (2023-09-12)

**Note:** Version bump only for package @trici/app-observer

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
