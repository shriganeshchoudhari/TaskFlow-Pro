# TaskFlow Pro — Frontend Modern UI/UX Specification

**Version:** 2.0.0
**Design System:** The Architectural Ledger (generated via Stitch MCP)
**Technologies:** React 19, Tailwind CSS v4, Vite, Redux Toolkit, `.gemini/skills/`
**Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)
**Stitch Project:** `projects/13625448372755094853`

---

## 1. Design Identity — "The Architectural Ledger"

TaskFlow Pro's `frontend-modern` uses a premium, light-mode Enterprise SaaS aesthetic generated via Stitch MCP. The design rejects the "dashboard-in-a-box" look in favor of a **High-End Editorial** experience inspired by an architectural journal — mathematically precise, visually silent, and effortless.

**Core Aesthetic Principles:**

| Principle | Rule |
|-----------|------|
| **Tonal Depth** | Hierarchy via surface color shifts — no 1px borders |
| **Typographic Authority** | Manrope (display/headlines) × Inter (body/labels) |
| **Ambient Elevation** | Shadows use the `on-surface` color tinted at 6% opacity, 20-40px blur |
| **Gradient CTAs** | Primary buttons use `#005dac → #1976d2` gradient at 135° |
| **Ghost Borders** | Only when necessary: `outline-variant` (#c1c6d4) at 15% opacity |

---

## 2. Design System Color Tokens

These are the exact tokens output by the Stitch "TaskFlow Pro" design system (`assets/424bfd2bf3d44da298917b0bf4559f58`).

### Surface Hierarchy (4-Level Stack)
| Level | Token | Hex | Usage |
|-------|-------|-----|-------|
| 0 — Canvas | `background` | `#f8f9fb` | App-level background |
| 1 — Navigation | `surface-container-low` | `#f2f4f6` | Sidebar, sub-sections |
| 2 — Cards | `surface-container-lowest` | `#ffffff` | Content cards, task panels |
| 3 — Popovers | `surface-bright` | `#f8f9fb` + Ambient Shadow | Modals, dropdowns |

### Brand & Semantic Colors
```
primary:           #005dac  (deep blue — nav active, focus)
primary_container: #1976d2  (mid blue — button fill)
secondary:         #475f84
error:             #ba1a1a
on_surface:        #191c1e  (primary text — NOT pure black)
on_surface_variant:#414752  (secondary/muted text)
outline_variant:   #c1c6d4  (ghost borders at 15% opacity)
```

### Task Status Colors
```
TODO:        #757575 (Grey)
IN_PROGRESS: #1565C0 (Blue)
REVIEW:      #F57F17 (Amber)
DONE:        #2E7D32 (Green)
```

### Task Priority Colors (left-border on cards)
```
LOW:      #388E3C (Green)
MEDIUM:   #F57C00 (Orange)
HIGH:     #E53935 (Red)
CRITICAL: #880E4F (Dark Pink)
```

---

## 3. Typography

**Dual-font stack** — headline elegance + body legibility:

```css
Headline: 'Manrope', sans-serif — geometric, editorial authority
Body:     'Inter', sans-serif — utilitarian, screen-optimized
```

| Role | Font | Scale | Weight |
|------|------|-------|--------|
| Page Title | Manrope | `text-2xl` | `font-bold` (700) |
| Section Header | Manrope | `text-base` | `font-semibold` (600) |
| Category Label | Inter (ALL CAPS + `tracking-wider`) | `text-xs` | `font-medium` |
| Body Content | Inter | `text-sm` | `font-normal` (400) |
| Metadata / Timestamps | Inter | `text-xs` | `font-normal` |

---

## 4. Component Standards

### 4.1 Buttons
- **Primary:** Gradient background `from-[#005dac] to-[#1976d2]`, 8px rounding, white text, `shadow-sm`
- **Secondary:** `bg-[#e7e8ea]` fill with `#191c1e` text, no border
- **Ghost:** No fill, blue text (`text-primary`)
- All buttons: `focus:ring-2 focus:ring-[#1976d2]` for accessibility

### 4.2 Input Fields
- Default: `bg-[#e7e8ea]` fill, NO border, 8px rounding
- Focus: 2px `primary` ghost border + subtle 10% `primary` glow
- Labels: Inter, small, muted color, above input

### 4.3 Cards / Panels
- Background: `surface-container-lowest` (`#ffffff`)
- Shadow: `box-shadow: 0 12px 32px -4px rgba(25, 28, 30, 0.06)` (Ambient)
- Rounding: 8px minimum, 16px for large panels
- NO dividers — use vertical `py-4`/`py-6` spacing between items

### 4.4 Task Cards (Kanban)
- 4px left border colored by priority
- Priority chip: small, matching color, `text-[10px]` uppercase
- Hover: transition from `surface-container-lowest` to `#e7e8ea` via background shift

### 4.5 Navigation Sidebar
- Background: `surface-container-low` (`#f2f4f6`)
- Active items: `bg-primary/10 text-primary` (10% opacity blue fill)
- Width: `w-64` (256px) on desktop

---

## 5. Application Screens & Routes

| Route | Screen | Stitch Screen ID |
|-------|--------|-----------------|
| `/auth` | Login / Register Card | `67360571ba5a4952831c16a780fd1955` |
| `/dashboard` | Main Dashboard | `511fcebd5f2e424da041394c8a4921e3` |
| `/tasks` | Kanban Task Board | `4d556ed94dd94a11b7dfe28c4f0cf8f7` |

### Auth — `/auth`
- Full-screen gray canvas (`#f8f9fb`), centered white card (440px max-w, 16px radius)
- TaskFlow Pro logo + wordmark (primary blue)
- Tab toggle: Sign In / Create Account
- Inputs: `fill-gray` field style, focus ghost border
- Sign In CTA: full-width gradient primary button
- "Forgot password?" / "Don't have an account?" links in primary blue

### Dashboard — `/dashboard`
- Sidebar (256px) + main area layout
- **4 Stat Cards row:** My Tasks | Due Soon | Projects | Notifications
- **"My Active Tasks"** table: Task Title | Project | Status chip | Due Date
- **"Recent Activity"** feed: avatar + action text + timestamp

### Task Board — `/tasks`
- Same sidebar + header shell
- 4 horizontal Kanban columns (320px each): TODO | IN PROGRESS | REVIEW | DONE
- Task cards with priority left-border + assignee avatar
- "DONE" column has dashed empty drop zone

---

## 6. Layout Architecture

```
App (BrowserRouter + Redux Provider)
│
├── /auth → Auth (no shell)
│             └── Centered card on canvas
│
└── /dashboard | /tasks → DashboardLayout
    ├── Sidebar (w-64, surface-container-low)
    │   ├── Logo + wordmark
    │   └── NavItems (Dashboard, Projects, My Tasks, Settings)
    ├── Header (sticky, surface-container-lowest + blur)
    │   ├── SearchInput
    │   ├── NotificationBell (with badge)
    │   └── UserAvatar
    └── main (flex-1, padding, background)
        ├── DashboardPage
        │   ├── StatCard × 4
        │   ├── MyActiveTasksTable
        │   └── RecentActivityFeed
        └── TaskBoardPage
            └── KanbanColumn × 4
                └── TaskCard × N
```

---

## 7. Responsive Behavior

| Component | Mobile (< 768px) | Desktop (≥ 1024px) |
|-----------|-----------------|-------------------|
| Sidebar | Hidden | Visible 256px |
| Stat Cards | 1-column stack | 4-column row |
| Tasks Table | Collapsed columns | Full 4 columns |
| Kanban | Horizontal scroll | Horizontal scroll |

---

## 8. Component Reusability (Skills)

Shared primitives live in `frontend-modern/.gemini/skills/components/`:

| File | Purpose |
|------|---------|
| `Button.tsx` | Primary / Secondary / Ghost variants |
| `StatCard.tsx` | KPI metric widget |
| `TaskCard.tsx` | Kanban/list task tile |
| `NavItem.tsx` | Sidebar navigation link |

---

## 9. Accessibility

- All inputs: `<label htmlFor>` pairing
- Icon-only buttons: `aria-label` required
- Focus visible: `focus:ring-2 focus:ring-[#1976d2] focus:ring-offset-1`
- Color contrast: ≥ 4.5:1 text, ≥ 3:1 UI (WCAG 2.1 AA)
- Status telegraphed via icon + color (color alone prohibited)
