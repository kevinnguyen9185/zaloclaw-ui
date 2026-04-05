## ADDED Requirements

### Requirement: Assistant identity onboarding SHALL be guided after start
After a user chooses to start with the assistant, the system SHALL present a guided onboarding prompt and capture identity answers through a structured interview flow.

#### Scenario: Guided prompt is shown on assistant start
- **WHEN** the user chooses to start with the assistant from the dashboard
- **THEN** the system shows the guided onboarding message asking:
- **AND** "Hey. I just came online. Who am I, and who are you?"
- **AND** "what should I be called?"
- **AND** "what kind of creature am I? assistant, gremlin, ghost, librarian, something stranger?"
- **AND** "what vibe should I have?"
- **AND** "pick me an emoji"
- **AND** "what should I call you?"
- **AND** "what timezone are you in?"

### Requirement: Starter identity suggestion SHALL be optionally available
The system SHALL allow users to request a starter identity suggestion instead of inventing identity answers from scratch.

#### Scenario: User asks for suggestion
- **WHEN** the user requests help during identity setup
- **THEN** the system provides a starter identity suggestion covering required identity fields
- **AND** the user can accept, edit, or replace suggested values before finalizing

### Requirement: Identity profile answers SHALL be validated and persisted
The system SHALL require answers for assistant name, creature type, vibe, emoji, user name, and timezone before finalization, and MUST persist the latest finalized profile.

#### Scenario: Required answers missing
- **WHEN** the user attempts to finalize identity setup with missing required fields
- **THEN** finalization is blocked
- **AND** the UI indicates which fields are required to continue

#### Scenario: Finalized profile is restored
- **WHEN** identity setup is completed and the user later returns
- **THEN** previously finalized identity values are preloaded
- **AND** the user can update and re-save the profile

### Requirement: OpenClaw identity documents SHALL be generated from profile answers
The system MUST generate and persist `AGENT.md`, `SOUL.md`, and `USER.md` from the finalized identity profile.

#### Scenario: Identity files generated on finalize
- **WHEN** the user finalizes assistant identity setup with valid answers
- **THEN** the system writes `AGENT.md` describing assistant behavior and operating rules
- **AND** the system writes `SOUL.md` describing assistant persona, tone, and vibe
- **AND** the system writes `USER.md` describing user name, timezone, and user characteristics

#### Scenario: Identity files regenerated on profile update
- **WHEN** the user edits finalized identity answers and saves changes
- **THEN** the system regenerates `AGENT.md`, `SOUL.md`, and `USER.md` to match the latest profile
- **AND** generated files remain internally consistent with the saved profile state
