# Application Overview
SpinPlatform is a multi-tenant SaaS application for managing interactive games (Wheels, Slot Machines, Scratch Cards) used for lead generation and prize distribution.
- **Primary Function**: Create and embed gamified lead forms.
- **Status**: Production-ready with integrated analytics and third-party integrations.
- **Source verified**: `README.md`, `src/app/page.tsx`.

# Navigation Structure
Grounded in `src/app/dashboard/layout.tsx` (sidebar).

- **Navigation Group: Platform**
  - **Overview**: `/dashboard` (Source: `NAV_GROUPS` line 24)
  - **Wheels**: `/dashboard/wheels` (Source: `NAV_GROUPS` line 25)
  - **Prizes**: `/dashboard/prizes` (Source: `NAV_GROUPS` line 26)
  - **Analytics**: `/dashboard/analytics` (Source: `NAV_GROUPS` line 27)
  - **Leads**: `/dashboard/leads` (Source: `NAV_GROUPS` line 28)
  - **Leaderboard**: `/dashboard/leaderboard` (Source: `NAV_GROUPS` line 29)

- **Navigation Group: System**
  - **Push Alerts**: `/dashboard/push` (Source: `NAV_GROUPS` line 35)
  - **Audit Logs**: `/dashboard/audit` (Source: `NAV_GROUPS` line 36)
  - **Account**: `/dashboard/account` (Source: `NAV_GROUPS` line 37)

- **Navigation Group: Tools**
  - **Theme Tester**: `/dashboard/theme-tester` (Source: `NAV_GROUPS` line 43)

- **User Actions (Dropdown)**
  - **Account Settings**: `/dashboard/account` (Source: `DropdownMenuItem` line 213)
  - **Sign Out**: Calls `/api/auth/logout` (Source: `handleLogout` line 67)

# Route Inventory
Verified via `find src/app` command.

| Route Pattern | Page Source File | Functional Context |
| :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Main Marketing Landing Page |
| `/login` | `src/app/login/page.tsx` | Auth Portal |
| `/register` | `src/app/register/page.tsx` | Signup Flow |
| `/dashboard` | `src/app/dashboard/page.tsx` | System Telemetry |
| `/dashboard/wheels` | `src/app/dashboard/wheels/page.tsx` | Campaign List |
| `/dashboard/wheels/[id]` | `src/app/dashboard/wheels/[id]/page.tsx` | Campaign Editor |
| `/dashboard/prizes` | `src/app/dashboard/prizes/page.tsx` | Prize Inventory |
| `/dashboard/leads` | `src/app/dashboard/leads/page.tsx` | Captured Data |
| `/dashboard/analytics` | `src/app/dashboard/analytics/page.tsx` | Engagement Charts |
| `/dashboard/integrations` | `src/app/dashboard/integrations/page.tsx` | Connections (Shopify, etc.) |
| `/dashboard/account` | `src/app/dashboard/account/page.tsx` | Settings |
| `/dashboard/audit` | `src/app/dashboard/audit/page.tsx` | Activity Logs |
| `/play/[token]` | `src/app/play/[token]/page.tsx` | Fullscreen Player |
| `/widget/[token]` | `src/app/widget/[token]/page.tsx` | Embed Container |

# Component Inventory
Verified via `ls -R src/components`.

- **UI primitives** (`src/components/ui`):
  - `Avatar`, `Badge`, `Button`, `Card`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `Progress`, `Select`, `Separator`, `Sheet`, `Sonner` (Toaster), `Switch`, `Table`, `Tabs`, `Textarea`.
- **Feature-specific**:
  - `WheelPreview` (`src/components/dashboard/wheels/wheel-preview.tsx`)
  - `SlotPreview` (`src/components/dashboard/wheels/slot-preview.tsx`)
  - `RoulettePreview` (`src/components/dashboard/wheels/roulette-preview.tsx`)
  - `ScratchPreview` (`src/components/dashboard/wheels/scratch-preview.tsx`)
  - `RGBAPicker` (`src/components/dashboard/wheels/rgba-picker.tsx`)
  - `UniversalWheelRenderer` (`src/components/shared/universal-wheel-renderer.tsx`)
  - `ThemeDialog` (`src/components/theme-dialog.tsx`)

# API Mapping
Verified via `src/lib/api-client.ts` consumption.

- **Wheels**: `GET /api/wheels`, `PUT /api/wheels/[id]`, `POST /api/wheels/[id]/publish`.
- **Segments**: `PUT /api/wheels/[id]/segments`.
- **Analytics**: `GET /api/analytics`, `GET /api/analytics/leaderboard`.
- **Prizes**: `GET /api/prizes`, `DELETE /api/prizes/[id]`.
- **Leads**: `GET /api/leads`, `GET /api/leads?export=true`.
- **Themes**: `GET /api/themes`, `POST /api/themes`.

# User Flows
- **Campaign Creation**: `Wheels Page` -> `New Wheel Button` -> `Redirect to [id]`.
- **Campaign Deployment**: `Wheel Editor` -> `Activate Button` -> `PUT /api/wheels/[id]/publish`.
- **Prize Setup**: `Prizes Page` -> `New Prize Form` -> `POST /api/prizes`.
- **Analytics Monitoring**: `Dashboard` -> `Analytics Link` -> `Area Charts` (Spins/Leads).

# Existing UI Patterns
- **Layout**: 216px Sidebar (Fixed) + Main scrollable stage.
- **Styling**: Tailwind CSS 4.0, OKLCH color space.
- **Surface**: `glass-panel` (Source: `src/app/globals.css`).
- **Typography**: Header `Space Grotesk`, Body `Inter`.

# Verified UX Problems
- **Form Overload**: `src/app/dashboard/wheels/[id]/page.tsx` contains 2600+ lines of logic and complex tabbed configuration.
- **Indication Delays**: Segment updates require manual save (`Save Segments`) while preview is live-updating (Source: `[id]/page.tsx` line 761).
- **Navigation Density**: Sidebar items are small (13px text) with faint active indicators (Source: `layout.tsx` line 157).

# Do Not Change Constraints
- **Data Model**: `Wheel`, `Segment`, `Prize` interfaces in `src/lib/types.ts`.
- **Core Navigation**: The `NAV_GROUPS` IDs must be preserved.
- **Public API**: The `embed_token` flow for `/play` and `/widget`.

# Redesign Constraints
- **Dark Mode**: All components must support `dark` class on root HTML.
- **Glassmorphism**: Standardize around the `glass-panel` utility defined in `globals.css`.
- **Responsiveness**: Support for Mobile Drawer (`SidebarContent` in `layout.tsx` line 255).

# UI/UX Redesign Analysis

## Current UX Problems
* **Visual Information Density**: The Wheel Editor configuration panels lack clear visual grouping, contributing to cognitive fatigue during setup.
* **Typographic Hierarchy**: Over-saturation of high-intensity capitalized labels obscures primary data points.
* **Chromic Contrast**: Subtle background layers and glass-panel opacity values occasionally reduce text legibility on lower-brightness displays.

## Visual Hierarchy Improvements
* **Spacing**: Standardize vertical rhythm between the dashboard's "Campaign Modules" and the wheels page's "Campaign Items."
* **Typography**: Implement a clearer distinction between "Heading" and "Support" text using weight and scale instead of all-caps transformations.
* **Alignment**: Resolve varying metric alignment (centered vs left) within bento grid modules to create a unified vertical focal line.
* **Visual Grouping**: Use subtle border variance or background shading to group related segments visually.

## Layout Improvements
* **Stage Symmetry**: Ensure the emulator and configuration panels maintain balanced padding and optical centering across ultra-wide viewports.
* **Mobile Stacking Padding**: Increase whitespace between stacked configuration modules on mobile to improve visual separation.
* **Sidebar Consistency**: Maintain the existing 216px hierarchy while refining the visual active indicator for higher visibility against dark backgrounds.

## Component Improvement Suggestions
* **Cards**: Standardize "glass-panel" utilities to ensure consistent blur radius and border opacity across all platform modules.
* **Tables**: Refine the Campaigns table padding and row height to improve scan-speed for dataset readability.
* **Forms**: Add visual "mid-point" markers to segment offset sliders to assist with at-a-glance vertical alignment.
* **Buttons**: Refine visual hover states and elevation for primary CTAs to create a more consistent tactile hierarchy.
* **Badges**: Standardize status pill (Active/Paused) colors and typography for better visual interaction clarity.

## Responsiveness Improvements
* **Touch Target Sizing**: Refine the visual scale of mobile triggers to ensure they meet standard accessibility guidelines without changing interaction logic.
* **Adaptive Grid**: Ensure bento modules maintain harmonious aspect ratios on tablet viewports (768px - 1024px).
* **Viewport Clipping**: Correct visual overflow and padding issues in segment containers on 13" laptop viewports.

## Accessibility Improvements
* **Color Contrast**: Adjust `oklch` background opacities to ensure all data labels meet AA readability standards.
* **Focus Visibility**: Implement more distinct visual focus rings for enhanced keyboard navigation visibility.
* **Interaction Cues**: Ensure icons are paired with legible body text to clarify the purpose of control groups in the editor.

## Risks To Avoid
* **Workflow Disruption**: Do not change the existing partitioning of "Save" actions or publication flows.
* **Navigation Architecture**: Do not modify the existing sectioning, sidebar categories, or path hierarchy.
* **Business Logic**: Avoid any changes that impact data synchronization or underlying state management.
* **Feature Expansion**: Do not introduce new drawers, overlays, filters, or modal behaviors not present in the current application.

# Page-Specific Redesign Reviews

## `/dashboard/wheels`

### Current UI Problems
* **Information Density**: Status indicators, engagement metrics (spins), and system metadata (tokens) are grouped without sufficient clear visual separation, reducing the scannability of the list.
* **Lack of Elevation**: The use of a single-layer background for campaign modules results in a lack of depth, making it difficult to distinguish individual items against complex background patterns.
* **Action Weighting**: The primary "Edit" action and secondary "More" menu trigger have similar visual prominence, creating ambiguity in the primary user workflow.
* **Metadata Clarity**: Small system identifiers, such as embed tokens, are not typographically distinguished from user-generated content, leading to a flat visual hierarchy.

### Visual Improvement Strategy
* **Elevation and Depth**: Implement varied background opacities and blur radius values to create a clearer distinction between the container and the underlying page surface.
* **Status Badge Consistency**: Standardize status indicators using a unified badge system with higher-contrast borders and clear semantic color patterns (Emerald/Amber/Slate).
* **Semantic Meta-Styling**: Differentiate system-generated data (tokens) from user-entered data (names) using distinct typographic treatments.
* **Interaction Polish**: Refine hover states with subtle transitions to providing immediate, non-disruptive feedback on user intent.

### Proposed Layout Refinements
* **Vertical Rhythm**: Standardize the vertical margin between cards to improve the visual separation of list items.
* **Component Grouping**: Align secondary metadata into a structured row with consistent gutter widths and separator elements for improved readability.
* **Modal Symmetry**: Standardize internal padding in the "Create New Campaign" dialog to align with the application's global layout grid.

### Component-Level Improvements
* **List Item Structure**: Refine the campaign card layout to emphasize the primary title while grouping secondary metadata in a balanced horizontal row.
* **Status Badges**: Utilize consistent padding, border-radius, and font-weight for all status indicators to improve at-a-glance identification.
* **Button Groups**: Group primary and secondary actions into a clear hierarchy with consistent heights (`h-9`) and visual nesting.
* **Empty States**: Simplify the empty state visual to focus on a single high-contrast call-to-action that guides the user toward the primary initialization workflow.

### Typography Improvements
* **Headings**: Refine primary titles with adjusted letter-spacing (`tracking-tight`) to improve legibility and brand alignment.
* **Monospace Integration**: Use monospaced fonts for embed tokens to denote their technical nature and improve character differentiation.
* **Secondary Labels**: Implement `font-bold` and `uppercase` treatments for small metadata labels to act as effective cognitive anchors.

### Accessibility Improvements
* **Focus Indicators**: Implement high-visibility focus rings for all interactive elements to ensure WCAG-compliant keyboard navigation.
* **Contrast Ratios**: Adjust opacity levels for muted text to ensure all secondary metadata meets AA contrast standards.
* **Visual Labels**: Ensure icon-only triggers have sufficient visual cues and descriptions to communicate their function clearly.

### Responsive Improvements
* **Fluid Padding**: Implement viewport-aware padding that scales from desktop to mobile to optimize content real estate.
* **Touch Targets**: Ensure all interactive elements on mobile viewports maintain a minimum target size of 44x44px.
* **Column Stacking**: Implement graceful wrapping for long metadata rows on small viewports to prevent horizontal overflow.

### Risks To Avoid
* **Information Density Loss**: Avoid excessive white space that would force redundant scrolling for users with a high number of campaigns.
* **Visual Noise**: Limit the use of decorative elements that do not serve a specific information architecture purpose.
* **Logic Conflicts**: Ensure visual restyling does not interfere with established state transitions (e.g., Active to Paused) or deletion confirmation workflows.

## `/dashboard/analytics`

### Current UI Problems
* **Metric Scalability**: The current summary card layout lacks clear visual grouping, making it difficult to differentiate primary KPIs from secondary data points at high scan speeds.
* **Lack of Chart Context**: The "Daily Spins" bar visualization lacks vertical axis labels and explicit grid markers, making accurate data interpretation difficult for users.
* **Grid Distortions on Mobile**: The current responsive grid for metric cards causes uneven distribution and vertical alignment issues on small viewports.
* **Secondary Visual Weight**: Progress bars in the Prize and Segment breakdown tables are undersized, failing to serve as effective visual indicators for identifying volume outliers.

### Data Visualization Strategy
* **Hierarchical Information Layering**: Use varied background shading and padding to clarify the relationship between main numeric values and their descriptive labels.
* **Axis and Scale Legibility**: Implement standardized vertical axis increments and baseline markers to provide immediate context for time-series charts.
* **Numeric Standardization**: Enforce the use of tabular-numeric weights to ensure that engagement metrics remain visually stable and aligned during data refresh cycles.

### Proposed Layout Refinements
* **Balanced Responsive Grids**: Refine card span logic for stat modules to ensure consistent aspect ratios across tablet and desktop viewports.
* **Gutter and Margin Standardization**: Increase internal whitespace in chart containers to prevent horizontal clipping of axis labels and date strings.

### Component-Level Improvements
* **Clarified Metric Containers**: Refine the card header hierarchy using subtle border-top accents and distinct background levels for icon containers.
* **Weighted Data Bars**: Increase the stroke-weight of breakdown bars to improve scan-rates and emphasize relative distribution between prize categories.
* **Standardized Tooltip Architecture**: Align tooltip styling (padding, typography, contrast) to match the platform's core UI system, ensuring absolute data legibility regardless of chart background.

### Typography and Labeling
* **Numeric Alignment**: Convert all primary engagement numbers to monospaced numeric types to ensure consistent vertical alignment in lead tables.
* **Label Hierarchy**: Standardize font sizes and casing for all secondary data labels to strengthen the visual association between related metric groups.

### Accessibility and Scannability
* **Luminance Contrast Audit**: Adjust status-based color saturations (e.g., Violet/Amber/Emerald) to ensure they exceed WCAG 2.1 AA contrast requirements against dark background tiers.
* **Focus State Consistency**: Implement consistent, high-contrast focus indicators for all selection controls and interactive chart elements.
* **Semantic Chart Labeling**: Ensure all custom CSS-based visualizations are accompanied by descriptive aria-labels that accurately reflect the underlying data values.

### Responsive Improvements
* **Optimized Column Flows**: In landscape-oriented tablets (768px - 1024px), adjust the breakdown grid to prevent excessive width stretching while maintaining high scannability.
* **Data-First Mobile Compaction**: Prioritize numeric metrics over non-essential icons on small mobile viewports to maximize the amount of actionable data visible above the fold.

### Risks To Avoid
* **Logic Interference**: Do not modify the existing date selection or wheel filtering state management.
* **Performance Degradation**: Avoid excessive DOM layering in high-count data tables to ensure the dashboard remains performant during large-period data exports.
* **Legibility Conflicts**: Ensure that visual polish does not result in the truncation of long prize titles or lead identifiers.

## `/dashboard/wheels/[id]`

### Current UI Problems
* **Cognitive Switching Cost**: Dense groupings of sliders and text inputs without distinct visual markers make it difficult for users to track active configurations within long lists.
* **Input Stacking Clutter**: On mobile viewports, the vertical proximity of form elements creates high visual noise, increasing the likelihood of unintended configuration errors.
* **Control Alignment Fragmentation**: Discrepancies in the horizontal alignment of labels and input fields create an inconsistent optical path, slowing down the setup workflow.
* **Hierarchical Ambiguity**: Primary section headers lack sufficient visual distinction from individual configuration fields, obscuring the page's information architecture.

### Visual Improvement Strategy
* **Z-Axis Depth Modulation**: Utilize subtle background tinting and border-weight variance to group related form controls into logical "Visual Blocks" without introducing new containers.
* **Typographic Standardization**: Enforce a clear hierarchy using font-weight and scale to distinguish "Control Categories" from "Input Labels," moving away from over-reliance on capitalization.
* **Optical Axis Alignment**: Shift all input controls to a strict vertical alignment to minimize horizontal eye travel during repetitive data entry.

### Proposed Layout Refinements
* **Standardized Vertical Rhythm**: Implement a consistent 24px vertical margin between primary configuration groups to reduce visual density and provide structural "breathing room."
* **Workspace Proximity Balance**: Refine the gutter spacing between the configuration panel and the real-time emulator to ensure a cohesive "Control-to-Result" experience.

### Component-Level Improvements
* **Unified Form Aesthetics**: Apply a standardized border-radius and focus-ring system across all input types (Sliders, Selects, Inputs) to ensure a predictable cross-component UI language.
* **State-Linked Markers**: Use refined color-coded markers within the segment list to signify prize associations or empty-states without adding new functional elements.
* **Action Hub Separation**: Improve the visual distinction between "List Management" actions (e.g., Add Segment) and global "Save" operations through background elevation changes.

### Typography Improvements
* **Readability-First Labels**: Transition high-intensity header-style labels to high-contrast sentence-case with consistent semantic weightings.
* **Numeric Stability**: Ensure all coordinates, weights, and offsets in the configuration panel use `tabular-nums` for improved vertical alignment.

### Accessibility Improvements
* **High-Visibility Focus States**: Implement prominent, high-contrast focus indicators for relative sliders and color pickers to ensure parity for keyboard-only users.
* **Luminance Contrast Audit**: Adjust the color-value ratios for secondary instructions and metadata labels to ensure they meet WCAG 2.1 AA legibility standards.

### Responsive Improvements
* **Mobile Interaction Zones**: Increase the visual and interactive hit-area for sliders and step-controls on mobile viewports to prioritize accuracy.
* **Stacked-Label Alignment**: Automatically transition to a vertical label-above-input pattern on small viewports to maximize the horizontal track length for sliders.

### Risks To Avoid
* **Workflow Preservation**: Do not modify the existing sequential tab structure or the technical separation of Save/Update logic.
* **Data-Model Misalignment**: Ensure that new visual grouping choices do not imply hierarchical relationships (e.g., "Folders") that are not supported by the underlying data structure.
* **Cognitive Interference**: Avoid introducing decorative animations or hover-effects that could obscure critical configuration data during active editing sessions.

# Global Redesign Governance Rules

This section acts as the permanent master instruction set for ALL future redesign reviews and UI proposals.

## Core Principles
* **Visual-Only**: Redesign must remain visual-only unless explicitly approved.
* **Preservation**: Preserve all business logic, workflows, navigation hierarchy, data relationships, route structures, and interaction architecture.

## Strict Prohibitions
Do NOT introduce:
* New features, tabs, filters, or workflows.
* New navigation systems or interaction models.
* New drawers, floating panels, or modal systems.
* Speculative UX patterns or decorative animations that reduce usability.

## Allowed Improvements
* **Design Refinement**: Spacing refinements, typography improvements, visual hierarchy enhancements.
* **Usability**: Readability, accessibility, contrast, and responsive layout refinements.
* **Consistency**: Alignment consistency, table readability, form clarity, and button hierarchy improvements.
* **Organization**: Visual grouping improvements.

## Language Standards
All redesign reviews must:
* Use professional product design terminology.
* Avoid cinematic, decorative, or abstract wording.
* Avoid invented design system names or fictional UI terminology.
* Remain implementation-safe and technically realistic.

## Analytics Dashboard Rules
Analytics redesigns must prioritize:
* Chart and numeric clarity.
* Axis and tooltip readability.
* Scannability and accessibility compliance.
* Responsive chart layouts.
* **Note**: Do not introduce decorative chart effects that reduce clarity.

## Editor Interface Rules
For configuration-heavy interfaces (e.g., `/dashboard/wheels/[id]`):
* Preserve exact workflow ordering and existing tab structures.
* Preserve preview behavior and save/update separation logic.
* Avoid structural workflow changes.
* Reduce cognitive overload through visual refinement only.

## Accessibility Standards
All redesign recommendations should support:
* WCAG AA contrast compliance.
* Keyboard navigation clarity and visible focus states.
* Readable typography and adequate touch target sizing.

## Performance Awareness
Avoid redesign suggestions that may:
* Increase rendering complexity unnecessarily.
* Reduce dashboard performance or create excessive DOM layering.
* Introduce visually noisy effects.

## Final Validation Rule
Before suggesting any redesign recommendation, validate:
**"Can this change be implemented without changing business logic, workflows, or information architecture?"**
If **NO**: the recommendation must be rejected.
