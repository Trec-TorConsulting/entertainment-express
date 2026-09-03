## ADDED Requirements

### Requirement: Typography Scale
The design system SHALL define a modular type scale with named roles: `display`, `title`, `heading`,
`body`, `label`, `caption`, and `mono`. Display and body fonts SHALL be overridable from the white-label kit
(`font_display`, `font_body`). Fallback stack SHALL remain system-safe.

#### Scenario: Tenant custom font
- **WHEN** an owner sets a Google Font in Brand settings
- **THEN** `--ee-font-display` and `--ee-font-body` update on all three portals without per-SPA changes

### Requirement: Elevation And Surface Tokens
The design system SHALL define surface levels (`base`, `raised`, `overlay`, `inset`) with paired shadow and
border tokens, plus semantic status colors (`success`, `warning`, `danger`, `info`) distinct from brand color.

#### Scenario: Modal overlay
- **WHEN** a dialog opens
- **THEN** it uses `--ee-surface-overlay` and `--ee-shadow-lg` from tokens, not ad-hoc rgba values in SPAs

### Requirement: Icon System
The design system SHALL ship a single icon set (stroke icons, 1.5px default, 20/24 px grid) exposed as React
components from portal-kit. SPAs SHALL NOT embed unrelated icon libraries.

#### Scenario: Consistent nav icons
- **WHEN** owner and employee nav render
- **THEN** each item uses portal-kit icons with consistent size and active-state treatment

### Requirement: Component Primitives Layer
Portal-kit SHALL expose documented primitives: `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`,
`Switch`, `Badge`, `Tag`, `Card`, `Dialog`, `Sheet` (mobile drawer), `DropdownMenu`, `Tabs`, `Tooltip`,
`Popover`, `Avatar`, `Separator`, `ScrollArea`, `Progress`, `Skeleton`, `Spinner`, `Alert`, `Toast`. Each
primitive SHALL support `density` prop values `cockpit`, `ops`, `consumer`.

#### Scenario: Density changes control height
- **WHEN** a `Button` renders with `density="ops"`
- **THEN** its min-height and font size match the ops scale without custom CSS in the SPA

### Requirement: Pattern Components
Portal-kit SHALL expose composite patterns built from primitives: `PageHeader`, `StatGrid`, `MetricCard`,
`TrendChip`, `DataTable` (sortable, column resize optional), `FilterBar`, `RecordDrawer`, `Timeline`,
`FileUploadDropzone`, `SignaturePad` chrome, `ChatThread`, `PlanningProgress`, `CommandPalette`, `BottomNav`,
`SidebarNav` (collapsible groups). Patterns SHALL be used by flagship screens.

#### Scenario: Owner Today uses patterns only
- **WHEN** Today renders stat metrics
- **THEN** it composes `PageHeader`, `StatGrid`, and `MetricCard` — not inline styled divs

### Requirement: Dark Mode Tokens
The design system SHALL define dark-mode token overrides (`color-scheme: dark`) for all surfaces and text.
Dark mode SHALL be user-toggleable per portal session and SHALL respect `prefers-color-scheme` when set to
`system`.

#### Scenario: Dark mode toggle
- **WHEN** a user enables dark mode in account preferences
- **THEN** the choice persists in localStorage and applies on next visit across owner/employee/client on that
  device

### Requirement: Component Documentation
Every primitive and pattern SHALL have a living doc entry in `frontend/portal-kit/storybook` (or equivalent)
showing states: default, hover, focus, disabled, loading, error. Docs SHALL list required a11y attributes.

#### Scenario: New contributor finds Button states
- **WHEN** a developer opens the Button story
- **THEN** they see primary/secondary/ghost/destructive variants at three densities with focus ring visible

## MODIFIED Requirements

### Requirement: Canonical Token File
The design system SHALL live in `frontend/portal-kit/src/tokens.css` (and Tailwind preset) as the
source of truth for `--ee-*` variables, **including** typography, elevation, motion, spacing (4 px base grid),
radius scale, and z-index layers. Marketing CSS SHALL import or mirror the same token names.

#### Scenario: Token change propagates
- **WHEN** `--ee-brand` is updated in tokens.css and portals/marketing are rebuilt
- **THEN** buttons and links using the brand token reflect the new value without per-app hard-coded hex
