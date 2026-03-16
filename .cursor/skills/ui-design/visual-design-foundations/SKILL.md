---
name: visual-design-foundations
description: Apply typography, color theory, spacing systems, and iconography principles to create cohesive visual designs. Use when establishing design tokens, building style guides, or improving visual hierarchy and consistency.
---

# Visual Design Foundations

Build cohesive, accessible visual systems using typography, color, spacing, and iconography fundamentals.

## When to Use This Skill

- Establishing design tokens for a new project
- Creating or refining a spacing and sizing system
- Selecting and pairing typefaces
- Building accessible color palettes
- Designing icon systems and visual assets
- Improving visual hierarchy and readability
- Auditing designs for visual consistency
- Implementing dark mode or theming

## Core Systems

### 1. Typography Scale

- Modular scale: --font-size-xs (0.75rem) through --font-size-5xl (3rem)
- Line height: headings 1.1–1.3, body 1.5–1.7, UI labels 1.2–1.4

### 2. Spacing System

- 8-point grid: --space-1 (0.25rem) to --space-16 (4rem)

### 3. Color System

- Semantic: --color-primary, --color-success, --color-warning, --color-error, --color-info
- Neutral scale: --color-gray-50 … --color-gray-900

## Quick Start: Tailwind Config

- theme.extend: fontFamily (sans, mono), fontSize (with lineHeight), colors (brand 50–700), spacing

## Typography Best Practices

- Pairing: single family (Inter) or contrast (Playfair Display / Source Sans Pro)
- Fluid: clamp(2rem, 5vw + 1rem, 3.5rem) for h1; max-width: 65ch for body
- Font loading: font-display: swap, font-weight range in @font-face

## Color Theory

- WCAG: body 4.5:1 (AA), large text 3:1, UI 3:1, enhanced 7:1 (AAA)
- Dark mode: data-theme="dark" with --bg-primary, --text-primary etc. overrides
- Contrast: getLuminance, getContrastRatio for programmatic checks

## Spacing Guidelines

- Card padding: 16–24px; section gap: 32–64px; form field gap: 16–24px
- Button: 8–16px vertical, 16–24px horizontal; icon–text: 8px
- Vertical rhythm: prose > * + * margin-top; h2 spacing

## Iconography

- Sizes: --icon-xs (12px) through --icon-xl (32px)
- Component: sizeMap, aria-hidden="true", SVG use href

## Best Practices

1. **Constraints**: Limit choices for consistency
2. **Document**: Living style guide
3. **Test Accessibility**: Contrast, sizing, touch targets
4. **Semantic Tokens**: Name by purpose, not appearance
5. **Mobile-First**: Start with constraints
6. **Vertical Rhythm**: Consistent spacing
7. **Limit Weights**: 2–3 weights per family

## Common Issues

- Inconsistent spacing: use a defined scale
- Poor contrast: meet WCAG
- Font overload: too many families/weights
- Magic numbers: use tokens
- Missing states: hover, focus, disabled
- Dark mode: plan upfront
