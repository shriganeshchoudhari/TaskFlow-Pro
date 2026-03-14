# Styles

Global styles and MUI theme configuration for TaskFlow Pro.

## Approach

TaskFlow Pro uses **Material UI v5** for all components. Global styles and theme customization
are handled through MUI's `ThemeProvider` configured in `src/main.jsx`.

There is intentionally **no global CSS file** — all styling goes through:
1. MUI `sx` prop for component-level styles
2. MUI `ThemeProvider` for global theme tokens (colors, typography, spacing)
3. MUI `styled()` for reusable styled variants

## Theme Configuration

The theme is set up in `src/main.jsx`:

```jsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#7b1fa2' },
    // ...
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});
```

## MUI Component Patterns Used

| Pattern | Usage |
|---------|-------|
| `sx` prop | Component-level responsive styles, spacing, colors |
| `useTheme()` | Access theme tokens in component logic |
| `ShadingType.CLEAR` | Table cell shading (never `SOLID` — causes black backgrounds) |
| MUI breakpoints | `xs`, `sm`, `md`, `lg` — Board scroll on xs, sidebar collapse on sm |

## Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|-----------|-------|-----------------|
| `xs` | 0–600px | Mobile: Board horizontal scroll, Sidebar as Drawer, 1-col grid |
| `sm` | 600–900px | Tablet: Sidebar icon-only, 2-col project grid |
| `md` | 900–1200px | Desktop: Sidebar expanded, 3-col grid, 4-stat dashboard row |
| `lg` | 1200px+ | Wide: Full layout |

## Adding New Styles

- **New component:** use `sx` prop directly — no separate CSS file needed
- **Repeated styles:** create a `const styles = { ... }` object at the top of the component file
- **Theme-aware color:** use `theme.palette.primary.main` via `useTheme()`, never hardcode hex values
- **Icons:** use `@mui/icons-material` — already installed, consistent visual language

## Accessibility

- All icon buttons have `aria-label`
- Status chips have descriptive `aria-label` values
- Notification bell has `aria-live="polite"` for badge count changes
- Skip-to-main-content link is the first focusable element in `Layout.jsx`
- Visible focus rings on all interactive elements (MUI default, not overridden)
