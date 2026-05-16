Feature: Focus session via tray menu
  As a user who has completed onboarding
  I want to start and stop a focus session from the tray menu
  So that I can track focused work periods

  Background:
    Given onboarding has been completed
    And the app is running

  Scenario: Starting a focus session from the tray menu
    When I click the tray icon
    And I click "Start Focus Session" in the tray menu
    Then a focus session should be in progress

  Scenario: Tray menu changes when a focus session is in progress
    Given a focus session is in progress
    When I click the tray icon
    Then the tray menu should contain "Show/Hide Trici"
    And the tray menu should contain "Record a Voice Note"
    And the tray menu should contain "Stop Session"
    And the tray menu should not contain "Start Focus Session"
    And the tray menu should not contain "Sleep Mode"
    And the tray menu should not contain "Settings"
    And the tray menu should not contain "Event Viewer"
    And the tray menu should not contain "Quit"

  Scenario: Ending a focus session from the tray menu
    Given a focus session is in progress
    And the session has been running for at least 15 seconds
    When I click the tray icon
    And I click "Stop Session" in the tray menu
    Then the focus session should have ended

  Scenario: Tray menu returns to default state after a focus session ends
    Given a focus session has just ended
    When I click the tray icon
    Then the tray menu should contain "Start Focus Session"
    And the tray menu should contain "Settings"
    And the tray menu should contain "Sleep Mode"
    And the tray menu should contain "Quit"
    And the tray menu should not contain "Stop Session"
