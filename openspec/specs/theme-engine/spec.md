## ADDED Requirements

### Requirement: Theme engine SHALL apply named themes as CSS variable overrides at runtime
The theme engine SHALL maintain a registry of named base themes, each providing a complete set of light and dark CSS custom property values. When a theme is activated, the engine SHALL apply its tokens by writing inline styles to `document.documentElement`.

#### Scenario: Named theme applied in light mode
- **WHEN** the user selects a named theme (e.g. "Rose") with mode "light"
- **THEN** the engine writes all theme CSS variables as inline styles on `<html>`
- **AND** shadcn/ui components visually update without page reload

#### Scenario: Named theme applied in dark mode
- **WHEN** the user selects a named theme with mode "dark"
- **THEN** the engine applies the dark variant of that theme's token set
- **AND** the `.dark` class is set on `<html>`

#### Scenario: System mode follows OS preference
- **WHEN** the user selects mode "system"
- **THEN** the engine applies light or dark tokens based on `prefers-color-scheme`
- **AND** the engine subscribes to media query changes and updates tokens automatically

### Requirement: Theme engine SHALL support a user-chosen accent color
The engine SHALL accept a hue angle (0–360°) and derive a full accent series in OKLCH, overriding `--primary`, `--primary-foreground`, `--ring`, and `--sidebar-primary` tokens.

#### Scenario: Accent hue applied over base theme
- **WHEN** the user sets an accent hue of 270° (violet) on the "Zinc" base theme
- **THEN** the engine derives OKLCH accent values for that hue
- **AND** overwrites the base theme's primary/ring tokens while leaving all other tokens unchanged

#### Scenario: Accent cleared reverts to base theme primary
- **WHEN** the user clears the accent color (sets it to null)
- **THEN** the engine restores the base theme's original primary/ring token values

### Requirement: Theme preferences SHALL persist in localStorage across reloads
The theme engine SHALL serialize the active theme name, accent hue, and mode to `localStorage` key `zaloclaw.theme.v1` and restore them on page load.

#### Scenario: Preferences survive a hard reload
- **WHEN** the user picks "Emerald" theme + accent hue 140° + dark mode
- **AND** the page is reloaded
- **THEN** the theme engine restores the same configuration on mount

#### Scenario: Missing or corrupt storage falls back to defaults
- **WHEN** `localStorage.zaloclaw.theme.v1` contains invalid JSON or is absent
- **THEN** the engine applies the default theme (Zinc, system mode, no accent)
- **AND** does not throw a runtime error

### Requirement: Theme engine SHALL prevent flash of unstyled content
A blocking inline script SHALL be injected in `<head>` before any CSS or JS loads, reading stored preferences and applying them synchronously to `document.documentElement`.

#### Scenario: Dark theme loads without white flash
- **WHEN** the user's stored preference is "dark" mode
- **THEN** `<html>` has the dark class and token overrides set before first paint
- **AND** no white/light flicker is visible during navigation or hard reload
