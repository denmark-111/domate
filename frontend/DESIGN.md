---
name: Studio Slate
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#44474a'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#75777a'
  outline-variant: '#c5c6ca'
  surface-tint: '#5d5e61'
  primary: '#000101'
  on-primary: '#ffffff'
  primary-container: '#1a1c1e'
  on-primary-container: '#838486'
  inverse-primary: '#c6c6c9'
  secondary: '#5b5f62'
  on-secondary: '#ffffff'
  secondary-container: '#dde0e3'
  on-secondary-container: '#5f6366'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1d'
  on-tertiary-container: '#828485'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e5'
  primary-fixed-dim: '#c6c6c9'
  on-primary-fixed: '#1a1c1e'
  on-primary-fixed-variant: '#454749'
  secondary-fixed: '#e0e3e6'
  secondary-fixed-dim: '#c4c7ca'
  on-secondary-fixed: '#181c1e'
  on-secondary-fixed-variant: '#43474a'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
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
  xl: 48px
  xxl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

# Studio Slate Design System (Domate Edition)

## Brand & Aesthetic Overview
The Domate UI is built upon the **Studio Slate** design language—combining modern corporate architecture with functional clarity. The core shell, navigation, forms, and cards use a high-contrast neutral structure (`#1A1C1E` darks, `#FFFFFF` surfaces, `#F9F9F9` background, and `#C5C6CA` outline variants).

To maintain domain clarity and visual identity, **functional color accents** (workspace palette covers, board colors, task priority tags, and user avatars) are supported across cards and detail views while the container architecture remains strictly Studio Slate.

---

## 🎨 Color Tokens & Usage

### Core Surface & Frame Tokens
- **Background (`#F9F9F9`):** Application base canvas across views.
- **Surface Lowest (`#FFFFFF`):** Primary content card surfaces, modals, inputs, and active containers.
- **Surface Low (`#F3F3F4`):** Secondary control bars, subtle active states, and footer actions.
- **Surface High (`#E8E8E8`) / Highest (`#E2E2E2`):** Inset badges, cover placeholder headers, and divider lines.
- **Outline Variant (`#C5C6CA`):** 1px structural borders defining card boundaries and inputs.

### Primary Darks & Text
- **Primary (`#000101` / `#1A1C1E`):** Primary buttons, active tab indicators, and major headers.
- **On-Surface (`#1A1C1C`):** High-legibility text and main card titles.
- **Secondary Text (`#5B5F62`):** Subtitles, meta info, icons, and timestamps.
- **Tertiary Fixed Dim (`#C5C7C8`):** Subtle card metadata (e.g., creation dates).

### Functional Accents (Non-monochromatic domain elements)
- **Workspace Cover Images & Palette Colors:** Render un-tinted inside card cover headers (`h-36 bg-surface-container-high border-b border-outline-variant`).
- **Board Accents & Avatars:** Preserved for visual distinction in list icons and member stacks.

---

## 📐 Layout & Container Rules

### Main Page Container
- **Max Width:** `max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-10 flex flex-col gap-8`
- Applied across **Home/Dashboard**, **Workspaces List**, and **Global Tasks**.

### Topbar & Navigation
- **Shell:** Sticky top header (`h-14 sm:h-16 w-full border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-3 sm:px-6 z-10`).
- **Branding:** Clickable **Domate** text (`font-headline-md text-xl sm:text-2xl font-bold text-on-surface cursor-pointer`) navigating to `/dashboard`.
- **Tabs:** "Tasks" and "Workspaces" links featuring a flat 2px sharp bottom border active indicator (`bottom-0 left-0 right-0 h-[2px] bg-primary`). Home link is omitted as Domate brand text serves as the home trigger.
- **Profile Menu:** Avatar circle without user name text or chevron arrow.

### Sidebar Scope
- Rendered **exclusively** within workspace detail routes (`/workspaces/:workspaceId`).
- Hidden on hub pages (`/dashboard`, `/tasks`, `/workspaces`).
- Desktop width: `w-64` (collapsed `w-16`). Mobile drawer width: `w-72`.

---

## ✍️ Typographic Scale

- **`font-display`**: Inter 48px/56px 600 (-0.02em tracking) — Main page title headers.
- **`font-headline-md`**: Inter 20px/28px 500 — Modal headers and card titles.
- **`font-body-md`**: Inter 16px/24px 400 — Subtitles, standard inputs, and primary descriptions.
- **`font-body-sm`**: Inter 14px/20px 400 — Filter text, secondary labels, and table cells.
- **`font-label-caps`**: Inter 12px/16px 700 (0.05em tracking UPPERCASE) — Primary buttons, category badges, table headers.
- **`font-mono-label`**: Inter 13px/18px 500 — Input labels and field titles.

---

## 🧩 Reusable Common UI Components (`src/components/common/`)

### 1. `Button` (`src/components/common/Button.jsx`)
- **Primary:** `bg-primary text-on-primary hover:opacity-90 font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT`
- **Secondary:** `bg-surface-container-lowest text-on-surface border border-outline-variant hover:border-primary font-label-caps text-xs font-bold uppercase rounded-DEFAULT`
- **Subtle / Ghost:** `bg-surface-container-low text-on-surface hover:bg-surface-container-high`
- **Danger:** `bg-error text-on-error hover:opacity-90`

### 2. `Input` (`src/components/common/Input.jsx`)
- `h-10 w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-DEFAULT font-body-md text-sm text-on-surface`
- Optional upper-case label (`font-mono-label text-xs uppercase font-bold tracking-wider text-on-surface`).
- Optional `error` text string and border highlight (`border-error text-error`).
- Optional left and right icon slots.

### 3. `TextArea` (`src/components/common/TextArea.jsx`)
- Multiline input using Studio Slate surface tokens (`p-3 bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-DEFAULT text-sm resize-none`).

---

## 🃏 Card & Grid Standards

### Workspace Cards
- **Grid Item Size:** Fixed height `h-[320px] rounded-DEFAULT bg-surface-container-lowest border border-outline-variant hover:border-primary`.
- **Cover Header:** Fixed height `h-36 w-full border-b border-outline-variant bg-surface-container-high` **without gradient overlays**.
- **Metadata:** Displays creation date (`Created {formatTimeAgo(createdAt)}`) and board counts.
- **Sort Ordering:** Default sorting across the app is **Newest First** (`recent` / `createdAt: 'desc'`).