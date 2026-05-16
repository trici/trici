Feature: First-time onboarding

  As a new user who has just installed the app
  I want to be guided through the initial setup
  So that the app is configured and ready for my workflow

  Background:
    Given the app is launched for the first time

  Scenario: Onboarding window appears on first launch
    Then the onboarding window should be visible
    And the main window should not be visible

  Scenario: Animated intro plays on the first step before navigation is available
    Given the onboarding window is open on step 1
    When the intro animation is playing
    Then the forward arrow should not be visible

  Scenario: Forward arrow becomes visible after the intro animation completes
    Given the onboarding window is open on step 1
    When the intro animation has completed
    Then the forward arrow should be visible

  Scenario: Clicking the forward arrow advances from the introduction to the explanation step
    Given the onboarding window is open on step 1
    And the intro animation has completed
    When I click the forward arrow
    Then the onboarding wizard should be on step 2

  Scenario: Clicking the forward arrow advances from the explanation step to the screen recording permission step
    Given the onboarding wizard is on step 2
    When I click the forward arrow
    Then the onboarding wizard should be on step 3

  Scenario Outline: A permission step requires granting access before the wizard can proceed
    Given the onboarding wizard is on the <permission> permission step
    Then I should see a prompt to grant <permission> permission
    And the forward arrow should not be visible
    When I grant <permission> permission
    Then the forward arrow should be visible

    Examples:
      | permission       |
      | screen recording |
      | microphone       |
      | accessibility    |

  Scenario: Work applications step shows the list of installed applications
    Given all required permissions have been granted
    And the onboarding wizard is on the work applications step
    Then I should see a list of installed applications
    And each application should have a selection control

  Scenario: Selecting work applications and proceeding restarts the app
    Given the onboarding wizard is on the work applications step
    When I select one or more applications as work applications
    And I click the forward arrow
    And I click done
    Then the app should restart
