## ADDED Requirements

### Requirement: Settings page SHALL include a Theme Settings panel
The settings page SHALL render a `ThemeSettingsPanel` component that lets users choose a base theme, accent color, and light/dark/system mode.

#### Scenario: Theme panel renders all base themes as swatches
- **WHEN** the user opens the settings page
- **THEN** the Theme Settings panel shows a swatch for each available base theme (Zinc, Slate, Stone, Rose, Violet, Sky, Emerald)
- **AND** the currently active theme swatch is visually highlighted

#### Scenario: User selects a base theme
- **WHEN** the user clicks a theme swatch
- **THEN** the theme updates immediately (live preview)
- **AND** the preference is persisted to localStorage

#### Scenario: User selects a preset accent color
- **WHEN** the user clicks one of the 8 preset accent hue swatches
- **THEN** the accent tokens update immediately across all components
- **AND** the preference is persisted to localStorage

#### Scenario: User selects Zalo Blue preset accent color
- **WHEN** the user clicks the "Zalo Blue" preset swatch (hue 210°)
- **THEN** the accent color updates to match Zalo's brand blue (#0573ff)
- **AND** the preference is persisted to localStorage

#### Scenario: User adjusts accent with the hue slider
- **WHEN** the user drags the hue slider to a custom angle
- **THEN** the accent color updates in real time
- **AND** on slider release the preference is persisted to localStorage

#### Scenario: User clears the accent color
- **WHEN** the user clicks "Reset accent"
- **THEN** the accent is removed and the base theme's default primary color is restored

### Requirement: Settings panel SHALL include a light/dark/system mode toggle
The panel SHALL display a 3-way toggle (Light / Dark / System) for controlling color scheme mode.

#### Scenario: User switches to dark mode
- **WHEN** the user clicks "Dark" in the mode toggle
- **THEN** the dark token set is applied immediately
- **AND** "system" media query tracking is stopped

#### Scenario: User returns to system mode
- **WHEN** the user clicks "System" in the mode toggle
- **THEN** the engine resumes tracking `prefers-color-scheme`
- **AND** the display updates to match the OS preference

### Requirement: Dashboard header SHALL include a quick dark mode toggle
The dashboard header SHALL include a sun/moon icon button that toggles between light and dark mode without opening the full settings panel.

#### Scenario: Quick toggle switches between light and dark
- **WHEN** the user clicks the sun/moon button in the dashboard header
- **THEN** mode switches from light→dark or dark→light
- **AND** if mode was "system" it transitions to the explicit counterpart of the current resolved mode
- **AND** the preference is persisted to localStorage
