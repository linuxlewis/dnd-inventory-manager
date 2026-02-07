# Phase: Dark Mode Theme

## Overview
Convert the D&D Inventory Manager to a dark color scheme for better aesthetics and reduced eye strain during long gaming sessions.

## Goals
1. Implement a cohesive dark theme across all pages and components
2. Maintain accessibility (contrast ratios, readability)
3. Keep the D&D fantasy aesthetic with appropriate accent colors

## Design Decisions

### Color Palette
| Element | Current (Light) | Dark Mode |
|---------|-----------------|-----------|
| Background (page) | `gray-100` | `gray-900` |
| Background (cards) | `white` | `gray-800` |
| Background (inputs) | `white` | `gray-700` |
| Text (primary) | `gray-900` | `gray-100` |
| Text (secondary) | `gray-600` | `gray-400` |
| Text (muted) | `gray-500` | `gray-500` |
| Border | `gray-200/300` | `gray-700` |
| Primary accent | `indigo-600` | `indigo-500` |
| Primary hover | `indigo-700` | `indigo-400` |
| Success | `green-600` | `green-500` |
| Danger | `red-600` | `red-500` |
| Warning | `amber-600` | `amber-500` |

### Header
- Background: `gray-800` or `indigo-900` (darker than current `indigo-600`)
- Keep indigo accent for brand recognition

### Rarity Colors (Items)
Adjust for dark backgrounds:
- Common: `gray-400`
- Uncommon: `green-400`
- Rare: `blue-400`
- Very Rare: `purple-400`
- Legendary: `orange-400`
- Artifact: `red-400`

## Implementation Approach

### Option A: Full Replace (Recommended for MVP)
Replace all color classes directly. Simpler, faster, no toggle needed.

### Option B: CSS Variables + Toggle
Use CSS custom properties for theming. Allows future light/dark toggle.
```css
:root {
  --bg-primary: theme('colors.gray.900');
  --bg-card: theme('colors.gray.800');
  --text-primary: theme('colors.gray.100');
  /* etc */
}
```

**Recommendation:** Start with Option A (full replace) to ship quickly. Can add toggle later if users request it.

## Stories

### FE-020: Update Global Styles
- Update `index.css` with dark background on `body`
- Update Tailwind config if needed

### FE-021: Update AppLayout Header
- Dark header background
- Adjust text/hover colors

### FE-022: Update Home Page
- Dark cards for Create/Access forms
- Dark input fields with visible borders
- Button colors that pop on dark

### FE-023: Update Inventory Page
- Dark inventory header card
- Dark treasury widget
- Dark activity log panel

### FE-024: Update Item Components
- ItemCard: dark background, adjusted rarity colors
- ItemDetail: dark slide-out panel
- AddItemModal/EditItemModal: dark modal backgrounds

### FE-025: Update Currency Components
- TreasuryWidget: dark styling
- CurrencyModal: dark modal

### FE-026: Update History Components
- HistoryPanel: dark card
- HistorySidebar: dark slide-out
- HistoryEntry: adjust icon background colors for dark

### FE-027: Update Modals & Dialogs
- Delete confirmation: dark background
- All modal backdrops: adjust opacity if needed

### FE-028: Final Polish
- Check all hover/focus states
- Verify form validation error colors
- Test loading skeletons on dark
- Accessibility audit (contrast checker)

## Out of Scope
- Light/dark toggle (can add later)
- System preference detection (can add later)
- Per-user theme persistence

## Success Criteria
- All pages render with dark theme
- No light-colored "flash" on page load
- Text is readable (WCAG AA contrast)
- Accent colors remain vibrant and on-brand
- Forms and inputs are clearly visible

## Estimate
~2-3 hours of focused work (mostly find-replace with some manual tweaks)
