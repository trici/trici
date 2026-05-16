# The macOS system tray is native UI outside Electron's BrowserWindow, so the
# step definitions exercise it through test-only Electron main-process hooks.
Feature: Tray menu after onboarding
  As a user who has completed onboarding
  I want to interact with the Trici tray icon in the menu bar
  So that I can access app features without switching windows

  Background:
    Given onboarding has been completed
    And the app is running

  Scenario: Tray icon is visible in the menu bar
    Then the tray icon should be visible in the menu bar

  Scenario: Tray menu shows all expected items in the default state
    When I click the tray icon
    Then the tray menu should contain "Show/Hide Trici"
    And the tray menu should contain "Record a Voice Note"
    And the tray menu should contain "Start Focus Session"
    And the tray menu should contain "Sleep Mode"
    And the tray menu should contain "Settings"
    And the tray menu should contain "Event Viewer"
    And the tray menu should contain "Quit"

  Scenario: Clicking "Show/Hide Trici" opens the Trici window
    When I click the tray icon
    And I click "Show/Hide Trici" in the tray menu
    Then the Trici window should be visible

  Scenario: Clicking "Settings" opens the settings window
    When I click the tray icon
    And I click "Settings" in the tray menu
    Then the settings window should be visible
