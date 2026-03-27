## ADDED Requirements

### Requirement: Dashboard SHALL present a Use Case Launchpad section
The dashboard SHALL include a dedicated section that surfaces actionable assistant workflows users can start immediately.

#### Scenario: Launchpad visible on dashboard
- **WHEN** a completed-onboarding user opens the dashboard
- **THEN** a "Use Cases" section is displayed below core status surfaces
- **AND** it contains at least one actionable use case card

#### Scenario: Section order is preserved
- **WHEN** the dashboard renders status cards and launchpad together
- **THEN** status surfaces remain above the launchpad section
- **AND** launchpad does not displace status surfaces from primary position

### Requirement: Launchpad cards SHALL communicate workflow value in under 5 seconds
Each use case card SHALL contain concise, outcome-first information and a clear primary action.

#### Scenario: Card content structure
- **WHEN** a use case card is rendered
- **THEN** it shows title, one-line outcome, capability tags, effort label, and primary CTA
- **AND** card text remains scannable without requiring expansion

### Requirement: Launchpad SHALL scale from 4 to 10 use cases without clutter
The dashboard launchpad SHALL handle an expanded use case set while preserving visual hierarchy.

#### Scenario: Up to 4 use cases
- **WHEN** the total number of use cases is 4 or fewer
- **THEN** all use cases are visible directly in the dashboard launchpad

#### Scenario: More than 4 use cases
- **WHEN** the total number of use cases exceeds 4
- **THEN** the dashboard shows a featured card plus a limited set of standard cards
- **AND** a "View all use cases" action reveals access to additional items

#### Scenario: Overflow count is explicit
- **WHEN** hidden use cases exist beyond rendered cards
- **THEN** the launchpad shows a "View all use cases (+N)" action
- **AND** `N` equals the number of hidden use cases

### Requirement: Launchpad SHALL define an empty-state fallback
When no use cases are available, the launchpad SHALL present clear fallback guidance.

#### Scenario: Empty use case list
- **WHEN** the launchpad data source is empty
- **THEN** the section renders an empty-state message and fallback CTA
- **AND** the fallback CTA navigates to settings

### Requirement: Launchpad layout SHALL use featured + grid hierarchy
The launchpad SHALL prioritize one featured use case and present additional options in a supporting grid.

#### Scenario: Featured card emphasis
- **WHEN** the launchpad renders
- **THEN** exactly one featured card is visually emphasized
- **AND** supporting cards remain readable without competing with featured emphasis

#### Scenario: Mobile layout behavior
- **WHEN** the launchpad renders on portrait mobile screens
- **THEN** cards stack vertically with preserved readability
- **AND** CTA actions remain visible without overlap or clipping

### Requirement: Launchpad interactions SHALL provide clear next actions
Each use case card SHALL lead users to a deterministic starting path.

#### Scenario: Start a use case
- **WHEN** the user clicks the use case CTA
- **THEN** the app navigates to the mapped start destination for that use case
- **AND** the destination receives enough context to begin the selected workflow

#### Scenario: Missing mapped destination fallback
- **WHEN** a mapped destination is unavailable or invalid
- **THEN** the app falls back to `/settings`
- **AND** the user still receives a usable next step

### Requirement: Launchpad SHALL support accessibility and non-color-only semantics
Launchpad presentation SHALL remain understandable for keyboard users and color-vision variance.

#### Scenario: Keyboard interaction
- **WHEN** a user navigates launchpad content via keyboard
- **THEN** each interactive card/CTA is reachable with visible focus state
- **AND** activation is possible without pointer input

#### Scenario: Semantic readability
- **WHEN** effort or capability metadata is shown
- **THEN** meaning is conveyed with text labels in addition to color treatment
- **AND** no critical state depends on hue alone

### Requirement: Launchpad copy SHALL be concise and Vietnamese-friendly
Launchpad copy SHALL optimize readability for Vietnamese-first users while remaining clear in English interface mode.

#### Scenario: Title and outcome length constraints
- **WHEN** launchpad card copy is authored
- **THEN** title and outcome lengths stay within defined readability constraints
- **AND** wording favors action-oriented, outcome-first phrasing