# Design System: The Architectural Ledger (Light Mode Enterprise SaaS)

## 1. Overview & Creative North Star
TaskFlow Pro's frontend-modern uses **The Architectural Ledger** — a premium, light-mode Enterprise SaaS aesthetic. 
It rejects the "dashboard-in-a-box" look in favor of a **high-end editorial** experience:
mathematically precise, visually silent, and effortless.

---

## 2. Color & Surface Architecture

### Surface Hierarchy (4-Level Stack)
| Level | Token | Hex | Usage |
|-------|-------|-----|-------|
| 0 — Canvas | `background` / `surface` | `#f8f9fb` | App-level background |
| 1 — Navigation | `surface-container-low` | `#f2f4f6` | Sidebar, sub-sections |
| 2 — Cards | `surface-container-lowest` / `surface-card` | `#ffffff` | Content cards, task panels |
| 3 — Inputs | `surface-high` | `#e7e8ea` | Input fills, secondary buttons |

### Brand Colors
```
primary:           #005dac  (deep blue — nav active, focus)
primary_container: #1976d2  (mid blue — button fill, links)
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

### Task Priority Colors
```
LOW:      #388E3C (Green)
MEDIUM:   #F57C00 (Orange)
HIGH:     #E53935 (Red)
CRITICAL: #880E4F (Dark Pink)
```

---

## 3. Typography
- **Headline**: `Manrope` — geometric, editorial authority
- **Body/Labels**: `Inter` — utilitarian, screen-optimized

| Role | Font | Size | Weight |
|------|------|------|--------|
| Page Title | Manrope | text-2xl | 700 |
| Section Header | Manrope | text-base | 600 |
| Category Label | Inter (ALL CAPS + tracking-wider) | text-xs | 500 |
| Body | Inter | text-sm | 400 |

---

## 4. Elevation: Ambient Shadows
No traditional drop shadows. Use ambient shadows:
```
shadow-ambient: 0 12px 32px -4px rgba(25, 28, 30, 0.06)
shadow-ambient-md: 0 8px 20px -4px rgba(25, 28, 30, 0.08)
```

### The "No-Line" Rule
No 1px solid borders for sectioning. Hierarchy via surface color shifts only.

### "Ghost Border" Fallback
If containers lack contrast: `outline-variant` (#c1c6d4) at **15% opacity**.

---

## 5. Component Conventions
- **Primary Button**: Linear gradient 135° from `#005dac` to `#1976d2`. White text. 8px radius.
- **Secondary Button**: `surface-high` (#e7e8ea) fill. No border.
- **Inputs**: `surface-high` fill. No border. Focus: 2px primary ring.
- **Cards**: `surface-card` (#ffffff) + `shadow-ambient`. 8–16px radius.
- **Task Cards**: 4px left border = priority color. Ambient shadow.
- **Sidebar Nav**: Active = `primary/10` tint fill + `primary_container` text.

---

## 6. Design System Notes for Stitch Generation

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Palette: Primary Blue (#005dac → #1976d2), Surface Light (#f8f9fb → #ffffff)
- Styles: 8px roundness, Ambient shadows (large blur, low opacity), No borders
- Typography: Manrope (headlines) + Inter (body), Inter ALL CAPS for labels
- Status Colors: Grey (TODO), Blue (In Progress), Amber (Review), Green (Done)
- Priority Colors: Green (Low), Orange (Medium), Red (High), Dark Pink (Critical)

**ATMOSPHERE:** Enterprise precision, editorial calm, architectural journal
