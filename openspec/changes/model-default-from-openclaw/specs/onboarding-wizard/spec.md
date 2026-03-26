## MODIFIED Requirements

### Requirement: Model step includes OpenRouter key path before model selection
The onboarding wizard SHALL allow OpenRouter key setup within step 2, SHALL detect OpenClaw default model configuration, and SHALL keep model selection available in the same step.

#### Scenario: User proceeds after configuring key
- **WHEN** user saves an OpenRouter key in step 2 and models are available
- **THEN** user can select a model and click next in the same step
- **AND** wizard advances to step 3 without requiring a page reload

#### Scenario: User skips key setup when models already available
- **WHEN** models are already available at step 2
- **THEN** user can continue with normal model selection
- **AND** OpenRouter key setup remains optional

#### Scenario: Default model is preselected when available
- **WHEN** OpenClaw config includes a default model identifier
- **AND** the same model exists in the fetched models list
- **THEN** the dropdown preselects that model by default

#### Scenario: No preselection when configured default is unavailable
- **WHEN** OpenClaw config includes a default model identifier
- **AND** that model does not exist in the fetched models list
- **THEN** dropdown remains unselected until user chooses manually
- **AND** existing model selection flow remains usable

#### Scenario: Config fetch failure does not block selection
- **WHEN** OpenClaw config cannot be loaded
- **THEN** step 2 still renders available models list behavior
- **AND** user can continue with manual model selection
