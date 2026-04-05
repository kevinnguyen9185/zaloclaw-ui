## ADDED Requirements

### Requirement: Dashboard SHALL provide a data-skills setup section
The system SHALL provide a dedicated dashboard section for configuring document-oriented data skills after the primary assistant setup flow.

#### Scenario: Dashboard renders data-skills section
- **WHEN** user views the dashboard workspace
- **THEN** the page includes a data-skills section alongside other post-identity configuration surfaces
- **AND** the section is visible without navigating to a separate setup wizard

### Requirement: Data-skills section SHALL expose connector cards for core document skills
The system SHALL present Google Drive, Google Docs, and file-based Q&A as separate connector cards with individual state and actions.

#### Scenario: Connector cards are shown
- **WHEN** the data-skills section is rendered
- **THEN** the user sees distinct cards for Google Drive, Google Docs, and file-based Q&A
- **AND** each card includes a readiness indicator and a primary configure or connect action

### Requirement: Data-skill settings SHALL persist through gateway-managed configuration
The system SHALL save dashboard-managed data-skill settings through the gateway configuration layer using non-destructive targeted updates.

#### Scenario: Save connector configuration
- **WHEN** user saves settings for a data-skill connector from the dashboard
- **THEN** the system writes the connector changes through gateway-managed configuration
- **AND** unrelated configuration branches remain unchanged

### Requirement: File-based Q&A SHALL reflect source prerequisites
The system SHALL communicate that file-based Q&A depends on at least one configured content source.

#### Scenario: Q&A card with no connected source
- **WHEN** no supported content source has been configured for the dashboard user flow
- **THEN** the file-based Q&A card indicates that a source connection is required first
- **AND** the card guides the user toward configuring Google Drive or Google Docs