## ADDED Requirements

### Requirement: First-time users SHALL see a branded welcome page before setup
The application SHALL present a full-screen welcome page to users who have not completed onboarding. The welcome page SHALL use the ZaloClaw hero image as a full-bleed background with a gradient overlay and a single primary CTA to begin setup.

#### Scenario: First-time user routing
- **WHEN** a user visits the app root for the first time (no completed onboarding state)
- **THEN** they are routed to the welcome page, not directly to the setup steps
- **AND** the welcome page shows the ZaloClaw hero image, tagline, and a single "Begin Setup" CTA

#### Scenario: Returning user bypasses welcome
- **WHEN** a user visits the app root with completed onboarding state
- **THEN** they are routed directly to `/dashboard`
- **AND** the welcome page is not shown

#### Scenario: Welcome page CTA navigates to setup
- **WHEN** the user clicks the "Begin Setup" CTA on the welcome page
- **THEN** they are navigated to `/check` to begin onboarding
- **AND** no onboarding state is modified by visiting the welcome page

#### Scenario: Welcome page is legible on mobile
- **WHEN** the welcome page renders on a portrait-orientation mobile screen
- **THEN** the mascot and CTA button remain visible and readable
- **AND** the gradient overlay ensures sufficient contrast for the CTA

### Requirement: App shell sidebar SHALL display a persistent brand strip
The sidebar SHALL render a cropped brand strip of the ZaloClaw image at the top, above navigation items, anchoring product identity in the working environment.

#### Scenario: Brand strip visible in authenticated app
- **WHEN** the user is on any authenticated app page (dashboard, settings)
- **THEN** the sidebar top shows the cropped ZaloClaw mascot image strip
- **AND** the strip fades smoothly into the sidebar background at its bottom edge

#### Scenario: Brand strip does not obscure navigation
- **WHEN** the sidebar renders brand strip and nav items together
- **THEN** the strip is visually separated from nav items
- **AND** nav items remain fully readable beneath the strip

### Requirement: UI SHALL present a Calm Premium + Zalo Energy visual direction
The application SHALL use a cohesive visual language with neutral layered surfaces, subtle atmospheric backgrounds, and restrained Zalo-blue accents on key actions and active states.

#### Scenario: Accent restraint is enforced
- **WHEN** users view onboarding, dashboard, or settings surfaces
- **THEN** Zalo-blue accent appears on primary CTAs, active navigation, and key positive states only
- **AND** non-critical surfaces remain primarily neutral

#### Scenario: Layered surfaces are visible
- **WHEN** users load app shell pages
- **THEN** the UI shows distinct background, shell, and content layers
- **AND** layering improves focus without reducing text readability

### Requirement: Dashboard SHALL prioritize first 10-second comprehension
The dashboard SHALL present assistant readiness and next action priority through a hero-first hierarchy.

#### Scenario: Hero state is immediately visible
- **WHEN** the user opens the dashboard
- **THEN** a primary hero surface summarizes assistant readiness (model, gateway, and channel state)
- **AND** the most important next action is visually emphasized

#### Scenario: Secondary cards support primary state
- **WHEN** the dashboard renders supporting cards
- **THEN** secondary cards provide detail without competing with hero priority
- **AND** visual hierarchy remains clear on mobile and desktop layouts

### Requirement: Onboarding SHALL feel guided and product-quality
The onboarding flow SHALL use a premium guided frame with clear progress and confidence-focused messaging.

#### Scenario: Progress communicates momentum
- **WHEN** the user moves through onboarding steps
- **THEN** progress visuals clearly indicate current step and completion momentum
- **AND** active and completed states are visually distinct

#### Scenario: Completion communicates readiness
- **WHEN** onboarding reaches the complete step
- **THEN** the screen presents a clear success-state summary and handoff CTA to dashboard
- **AND** the user perceives setup as finished and trustworthy

### Requirement: Status presentation SHALL not rely on color-only signaling
Status components SHALL combine text labels, iconography, and tonal treatment to communicate system state.

#### Scenario: Gateway or channel state is shown
- **WHEN** a status badge or card displays connected, reconnecting, idle, or error
- **THEN** each state includes explicit label text and distinct visual treatment beyond hue
- **AND** state remains understandable for color-vision variance

### Requirement: Motion SHALL be meaningful and accessibility-aware
UI motion SHALL be limited to meaningful transitions and respect reduced-motion preferences.

#### Scenario: Page and card transitions
- **WHEN** hero surfaces and supporting cards enter the viewport
- **THEN** motion is subtle and brief
- **AND** animation can be reduced or disabled when user prefers reduced motion

#### Scenario: Live status updates
- **WHEN** status content changes due to connectivity updates
- **THEN** transition feedback is smooth and non-disruptive
- **AND** no continuous decorative animation is used
