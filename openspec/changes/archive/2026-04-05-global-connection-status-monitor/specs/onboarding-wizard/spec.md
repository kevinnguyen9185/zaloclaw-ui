## ADDED Requirements

### Requirement: Onboarding wizard SHALL check service connectivity after configuration steps
The wizard SHALL verify that openclaw and zalo connections are functional after configuration before allowing progression.

#### Scenario: Connection check after configuration
- **WHEN** user completes a service configuration step
- **THEN** the wizard automatically checks the connection status before proceeding

#### Scenario: Successful connection detected
- **WHEN** connection check succeeds
- **THEN** wizard displays a success indicator and allows progression to next step

#### Scenario: Connection failure detected
- **WHEN** connection check fails
- **THEN** wizard displays an error message and offers to retry configuration

### Requirement: Onboarding wizard SHALL guide recovery for failed configurations
The wizard SHALL provide recovery workflows when service configuration validation fails.

#### Scenario: Configuration validation failure
- **WHEN** a connection check fails after configuration
- **THEN** the wizard displays a recovery dialog with options: "Retry", "Review Configuration", "Skip"

#### Scenario: Retry configuration
- **WHEN** user clicks "Retry"
- **THEN** the connection check is performed again immediately

#### Scenario: Review configuration
- **WHEN** user clicks "Review Configuration"
- **THEN** the configuration step is reopened for editing

#### Scenario: Skip service configuration
- **WHEN** user clicks "Skip"
- **THEN** wizard allows progression without that service, but marks it as incomplete for later setup

### Requirement: Onboarding wizard SHALL prevent completion with unresolved service failures
The wizard SHALL require resolution of critical service connectivity issues before allowing onboarding completion.

#### Scenario: Mandatory service disconnected
- **WHEN** onboarding completion is requested but a required service is disconnected
- **THEN** wizard displays a blocker message preventing completion

#### Scenario: All services verified
- **WHEN** all configured services are verified as connected
- **THEN** wizard allows completion

### Requirement: Onboarding wizard displays connection status for each service
The wizard SHALL display real-time connection status for services being configured.

#### Scenario: Status displayed during configuration
- **WHEN** the wizard is in configuration step
- **THEN** current connection status for that service is displayed (connected/disconnected/checking)

#### Scenario: Status updates during configuration
- **WHEN** periodic status checks occur during onboarding
- **THEN** status indicators update immediately in the UI
