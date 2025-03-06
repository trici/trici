# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.10.0](https://github.com/trici/trici/compare/@trici/desktop@0.9.0...@trici/desktop@0.10.0) (2025-03-06)

### Bug Fixes

- Don't start a FocusSession within a cooldown period when the user has manually ended the session. Also, this led to rectifying how we store how the FocusSession start/end was triggered. ([8ed651e](https://github.com/trici/trici/commit/8ed651eb0d7052351ccd7678f47b80cc04bd87dc))

### Features

- Added higher playback speeds and set the default to 4 ([bb1a44b](https://github.com/trici/trici/commit/bb1a44b32204cf768c964d893ee310d577c58a7a))
- Added Interface to Alert User that Update is available to install ([2ddb986](https://github.com/trici/trici/commit/2ddb986c2f3bac0dd1abce7ec8693810f6c3368b))
- Capture the IdleTimeProfile and save it to a file in the focus session directory ([e3e46b1](https://github.com/trici/trici/commit/e3e46b12b7e1c7e7453d94b3afaf9b8ecefef87d))
- Implement autoUpdates. Right now it only downloads the updates. Have to think of a how to Notify the User of Update available ([83eb65c](https://github.com/trici/trici/commit/83eb65cb253fe571dbef3985c0127d8a3db2e241))

# [0.9.0](https://github.com/trici/trici/compare/@trici/desktop@0.8.0...@trici/desktop@0.9.0) (2025-02-19)

### Bug Fixes

- **@trici/desktop:** By default, the latest Focus Session should be the one that is selected ([bc18417](https://github.com/trici/trici/commit/bc18417d19cacf9e0c0bdf71490032a52b3a6135))
- **@trici/desktop:** Different dimensions for root element depending on type of window. Prevents scroll in triciMainWindow ([93410df](https://github.com/trici/trici/commit/93410dfbffc51fb9081238bda8e2d7b4d7246e17))
- **@trici/desktop:** Fix the time filter dropdown to show the selected value ([ddb6e59](https://github.com/trici/trici/commit/ddb6e592d70d8131c00e5d0f94945f05263c1dc3))
- **@trici/desktop:** Pass the logging directory to triciAppObserver ([c62548c](https://github.com/trici/trici/commit/c62548ce59e2b39653e9b40640bbce4bd97373b0))

### Features

- **@trici/desktop:** Added migration for Focus Session table. Renamed older migration files to follow same naming convention. ([af8474e](https://github.com/trici/trici/commit/af8474ee91271bda28ed49ea60cc5343d1e2e529))
- **@trici/desktop:** Added the column storageLocation for FocusSession object. Also added a new plugin to write event data for the session to the directory where recordings are stored when Focus Session ends. Also added a priority when registering plugins which determines the order in which the plugins are fired for the same event. ([5a91264](https://github.com/trici/trici/commit/5a912642492078374ac8f432c9e8d4ed4c045b66))
- **@trici/desktop:** Fetch and show Focus Session data in the Trici Window. There are two views: Timeline and FocusSession wise ([b6c7ff7](https://github.com/trici/trici/commit/b6c7ff752b674475c2773539dcfdf17d945894e5))
- **@trici/desktop:** Interface to show the Focus Sessions as a grid of data. First check in/ ([bb22c08](https://github.com/trici/trici/commit/bb22c08fd86f2a80976b8d400f5c4d8dc64e7609))
- **@trici/desktop:** Pass sessionStartMetaData when starting the Focus Session ([dc0543a](https://github.com/trici/trici/commit/dc0543aee4cae940cf5a5fec192b62a316a4c93b))

# [0.8.0](https://github.com/trici/trici/compare/@trici/desktop@0.7.0...@trici/desktop@0.8.0) (2024-12-14)

### Bug Fixes

- **@trici/desktop:** Emit the User Started Working event if the user is becoming hyer active and is using an app that is definitely work. This will change in the future with this decision being based on not just what happened at that instant but also the history ([5e95022](https://github.com/trici/trici/commit/5e95022688459f2434013611fbbaef4c1ce87e14))
- **@trici/desktop:** Improve the granularity of detecting IdleTime. Missed commit. ([38ef930](https://github.com/trici/trici/commit/38ef930468c3ca3750ce433bd7d57d3a5eff5156))
- AlertWindow should not be on top of System Prompt/Settings window ([13737b7](https://github.com/trici/trici/commit/13737b7ef5480ce39f832f09f7dd7f64e61a5687))
- Improved the UI of EventViewer ([347bc06](https://github.com/trici/trici/commit/347bc06cc351d225701d8c613439d0691f62fe11))
- Reverting Tray state change as whether Session in progress affects whats shown in the menu. Changing tray icon based on userActivityState ([f87e7bc](https://github.com/trici/trici/commit/f87e7bc51073a25a1d00c9e318213ff471f4ed94))
- Settings Window was blank when opened. ([398bd7a](https://github.com/trici/trici/commit/398bd7a2e1b27916d9f8fc328fae208717999a38))
- Store session recordings in separate directories ([69dd0ec](https://github.com/trici/trici/commit/69dd0ecb08968159e2b9ad3935d0f8e7d1d4b66a))
- Using template icon for Tray to allow macOS to change icon based on system theme. Also changed TrayStates so as to decouple a bit from Focus Sessions. ([da71342](https://github.com/trici/trici/commit/da7134201a17c21901287e99c9f30ff032a5f018))

### Features

- Improved the Event Viewer UI. Added a visualization as well and better filters. ([e774fd5](https://github.com/trici/trici/commit/e774fd5660ed6f52e3a21ff6ef3a8fcde8a13eac))

# [0.7.0](https://github.com/trici/trici/compare/@trici/desktop@0.6.0...@trici/desktop@0.7.0) (2024-11-05)

### Bug Fixes

- **@trici/desktop---AppService:** fixed type to disable hardware acceleration ([df420f9](https://github.com/trici/trici/commit/df420f973b62ffce071ffb9f30cb06e3cbeb1260))
- **@trici/desktop-UsedApplications-was-returning-null/empty:** Used applications was returning null because the lastSavedEntityId did not have a matching document. This was possibly due to missing await and thus the last saved entity id not getting updated before the application shut down. ([dabddcf](https://github.com/trici/trici/commit/dabddcf989bca07145bbdbff0e3db25a932f352c))
- **@trici/desktop:** Open settings and alert window in correct screen ([1e5ddee](https://github.com/trici/trici/commit/1e5ddee7e901e5bf50021b4c99a4283688ad3f06))
- **@trici/desktop:** Use the correct path for the Recorder Binary ([2afb3ff](https://github.com/trici/trici/commit/2afb3ff9c1919a784d4ebf8ec355b6e801206b62))
- **@trici/desktop:** Use the correct path to Recorder for dev ([05cf7c7](https://github.com/trici/trici/commit/05cf7c7fec2f30ae58814082ae41343155d7d7c9))
- Add a command to enable type checking ([35d384b](https://github.com/trici/trici/commit/35d384b7c04856512db7dcf94dd20cc5c94b7937))
- Fix the settings window after removing mantine and using proactive ([fa900dd](https://github.com/trici/trici/commit/fa900dd965ed5cac75ed8479379ba91863d2e2bc))
- Fix the updbin script to copy the correct file ([9845f81](https://github.com/trici/trici/commit/9845f81844da4daf4f99121ecbb096b0d9132f36))
- Fix UI of alert window to use tailwind and proactive ([2dd093e](https://github.com/trici/trici/commit/2dd093ea55a326d1240b124470db94555e54a05d))
- Minor UI Fixes for Settings Window. ([e9cbfaa](https://github.com/trici/trici/commit/e9cbfaa847e4350da88fd46938aaef8531ba5aca))
- Missed checkin of OnboardingWizardSteps ([238c44a](https://github.com/trici/trici/commit/238c44a4e5050ce56555ca4a3ccd6c517edaa8df))
- Page should occupy full window height. Change the title of the Settings window. ([dd9e32c](https://github.com/trici/trici/commit/dd9e32c470c945d6ee6004b0b2478ddd13b794e7))
- Removed saving of daily user activity and just raising events ([821c473](https://github.com/trici/trici/commit/821c473496f59c5e421ce3b087f37e09ffebd602))
- Use the new Recorder binary ([b546ce8](https://github.com/trici/trici/commit/b546ce8d0fc8632410fe6b7dec5c619fe5b7e33e))

### Features

- **@trici/desktop-WindowManager:** Place the window at the center of the bigger screen when multiple displays available ([385b549](https://github.com/trici/trici/commit/385b54957397cf4f164bb25e7cab316ce7ba6ce9))
- **@trici/desktop:** Ask for accessibility permissions ([4b0857c](https://github.com/trici/trici/commit/4b0857ce1ea81da8e8c3cecd0833ce488e2b20f1))
- **@trici/desktop:** Guess from the User activity whether the user is working ([1bac8ff](https://github.com/trici/trici/commit/1bac8ff437d6a3eab1fa8972cdf234e6978fec58))
- **@trici/desktop:** Use the new activmon package to handle UserActivityStateTransitions. ([f1b60a8](https://github.com/trici/trici/commit/f1b60a8ece9150e25af74c848eaddf852e922a5d))
- Added an Applications Section in the Settings ([b64a602](https://github.com/trici/trici/commit/b64a60281da93506b6c1da52179e14016b6be4e7))
- Added Onboarding ([4c4c602](https://github.com/trici/trici/commit/4c4c602fe6d8bc9fe0cf83ca3e9645f6e88fa80b))
- Added tailwind and proactive as dependencies ([630aff8](https://github.com/trici/trici/commit/630aff8bc7aaa52095ed2fefb5f8cb147c059398))
- register global shortcuts when the app loads ([027022b](https://github.com/trici/trici/commit/027022bbeb83cd38f156eeaa1776587deb770686))
- register global shortcuts when the app loads ([cef4e6c](https://github.com/trici/trici/commit/cef4e6c6ffed5c464b2aabda4a3d877ac719dec9))
- Removed Asking which Screen to Record ([44b6553](https://github.com/trici/trici/commit/44b6553035a061d93e7e98b83efa71ad37eca2a2))
- Save events in Sqlite3 ([04534e6](https://github.com/trici/trici/commit/04534e69f2d28c05857fcc807fb9a1d74d099b37))
- show accelerators in tray menu ([ffd1e4c](https://github.com/trici/trici/commit/ffd1e4c96b2b65d0430aed0b4b5d0ba7c7b87f75))
- UsedApplicationsService to save a list of applications used by the user ([cfd117c](https://github.com/trici/trici/commit/cfd117c9a4de18121469fae75d7ea7373d815cdc))

# [0.6.0](https://github.com/trici/trici/compare/@trici/desktop@0.5.1...@trici/desktop@0.6.0) (2023-09-12)

### Features

- **FocusSessionService:** end a focus session if a user becomes inactive ([642dae6](https://github.com/trici/trici/commit/642dae617411693c1e74448f900deef7d2364e22))

## [0.5.1](https://github.com/trici/trici/compare/@trici/desktop@0.5.0...@trici/desktop@0.5.1) (2023-09-08)

### Bug Fixes

- **@trici/desktop:** select screen to record was not showing selected value ([7b83660](https://github.com/trici/trici/commit/7b8366030392cf610dc21f7ede0c7be0734bbfb0))

# [0.5.0](https://github.com/trici/trici/compare/@trici/desktop@0.4.0...@trici/desktop@0.5.0) (2023-09-08)

### Bug Fixes

- **TrayService:** Destroy the tray icon when shutting down ([df6e8d5](https://github.com/trici/trici/commit/df6e8d5de8d59b9f7a342a36b68e0fc164eb9850))
- use the correct device index from screenToRecord ([065081a](https://github.com/trici/trici/commit/065081ae84c4e3561fdc5b8ff1f2e9a08b8b87f9))
- **UserActivityMonitorService:** stop the service when the app is quitting ([86b04bc](https://github.com/trici/trici/commit/86b04bcba2a79147bf36138403ec6a6c6a5440b1))

### Features

- Cpature which screen is being recorded in the FocusSession entity ([caf8e2e](https://github.com/trici/trici/commit/caf8e2e353d73eba4f877ecdd775f8efda5815f7))

# [0.4.0](https://github.com/trici/trici/compare/@trici/desktop@0.3.0...@trici/desktop@0.4.0) (2023-09-05)

### Features

- **version:** Create a VERSION file when publishing the desktop build to builds ([e8d1b5e](https://github.com/trici/trici/commit/e8d1b5e5da83ba6bd9a5fd8c4025b1f5379875ff))

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
