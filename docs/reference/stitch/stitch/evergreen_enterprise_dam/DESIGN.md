---
name: Evergreen Enterprise DAM
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#404944'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#442800'
  on-tertiary: '#ffffff'
  tertiary-container: '#623c00'
  on-tertiary-container: '#f69f0d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  mono-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 1600px
  gutter: 16px
---

## Brand & Style

This design system is engineered for high-utility Digital Asset Management (DAM) environments where efficiency, precision, and metadata density are paramount. The brand personality is authoritative yet invisible, acting as a sophisticated frame for the visual assets it manages.

The aesthetic leans heavily into **Modern Corporate Minimalism**, utilizing a structured, panel-based layout that prioritizes content over container. The visual language is defined by crisp edges, a restrained color palette, and a focus on hierarchical clarity. The emotional response should be one of reliability and calm control, ensuring that users can navigate vast libraries of assets without cognitive fatigue.

## Colors

The palette is anchored by **TJC Evergreen**, a deep, sophisticated green used for primary actions and brand presence. This is supported by a functional set of semantic colors designed for high legibility and immediate state recognition.

- **Primary (#064E3B):** Reserved for high-priority actions, active states, and primary navigation.
- **Background (#F9FAFB):** A neutral off-white used for the global application canvas to reduce eye strain.
- **Surfaces (#FFFFFF):** Panels, cards, and modal containers utilize pure white to pop against the off-white background.
- **Borders (#E5E7EB):** Used consistently for structural definition and panel separation.
- **Info/Secondary (#475569):** A muted blue-gray for metadata labels, secondary icons, and low-priority text.
- **Caution (#F59E0B):** Amber for pending states, warnings, or restricted assets.
- **Alert (#DC2626):** Red for destructive actions, critical errors, or expired licenses.

## Typography

The typography system utilizes **Inter** exclusively to ensure maximum legibility across dense data tables and complex metadata panels. The scale is tuned for information density.

- **Headlines:** Semi-bold weight with tight letter spacing for a premium, editorial feel in asset previews.
- **Body Text:** The `body-md` (14px) is the workhorse for general interface text.
- **Metadata:** `body-sm` (13px) and `label-sm` (11px) are used within the Inspector panels to pack technical information without sacrificing clarity.
- **Labels:** Uppercase labels are used sparingly for section headers within panels to provide structural cues.

## Layout & Spacing

This design system uses a **Fixed-Fluid Hybrid Grid**. Sidebars and Inspector panels have fixed widths (typically 280px to 320px) to ensure consistent metadata display, while the central asset canvas is fluid to accommodate varying screen sizes and gallery view scales.

- **Spacing Rhythm:** Based on a 4px baseline. Padding within components (buttons, input fields) should remain compact (8px horizontal, 4px vertical for small variants).
- **Toolbars:** Use a fixed 48px or 56px height to maintain a consistent horizon line across the application.
- **Breakpoints:**
  - Mobile: <768px (Sidebars collapse to drawers).
  - Tablet: 768px - 1280px (Standard 2-column view).
  - Desktop: >1280px (Full 3-column view with permanent Inspector).

## Elevation & Depth

Hierarchy is established primarily through **Tonal Layering** and **Crisp Outlines** rather than heavy shadows.

- **Level 0 (Base):** Off-white background (#F9FAFB).
- **Level 1 (Panels):** White surfaces with a 1px solid border (#E5E7EB). No shadow.
- **Level 2 (Dropdowns/Menus):** White surfaces with a 1px border and a subtle, soft shadow (8px blur, 4% opacity) to provide separation from the panels below.
- **Level 3 (Modals):** Focused overlays with a 1px border and a more pronounced elevation shadow (16px blur, 8% opacity).
- **Active State:** Assets in the gallery view use a 2px primary color border rather than a shadow to indicate selection.

## Shapes

The shape language is **Restrained and Professional**. A standard corner radius of **4px to 6px** is applied to buttons, input fields, and cards to soften the interface without losing its architectural rigor.

- **Small Components:** Buttons and inputs use 4px (`rounded-sm`).
- **Containers:** Media cards and side panels use 6px (`rounded-md`).
- **Badges:** Status badges use a slightly higher 12px or full pill-shape to distinguish them from interactive elements.
- **Media:** Image thumbnails maintain the 4px radius to match the card container.

## Components

### Buttons
- **Primary:** Solid #064E3B with white text. 4px radius.
- **Secondary:** White background, #E5E7EB border, #475569 text.
- **Compact:** Reduced padding for use in toolbars.

### Media Cards
- Aspect-ratio constrained thumbnails (usually 4:3 or 1:1).
- Asset name and file extension clearly visible below the image.
- Top-right checkbox for bulk selection.
- Hover state: Subtle #F9FAFB background tint and visibility of "Quick Actions."

### Inspector Panels (Sticky)
- Fixed right-hand positioning.
- Collapsible sections using chevron icons.
- High-density metadata fields (Label on top, Value below).

### State Badges
- **Draft:** Gray/Blue-gray background with dark text.
- **Approved:** Light green tint background with Primary Green text.
- **Expired:** Light red tint background with Alert Red text.

### Inputs
- 1px border (#E5E7EB).
- Focus state: 1px Primary color border with a 2px soft evergreen outer glow (20% opacity).
- Labels are 12px Semi-bold for maximum clarity in dense forms.