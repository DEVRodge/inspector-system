---
name: responsive-design
description: Implement modern responsive layouts using container queries, fluid typography, CSS Grid, and mobile-first breakpoint strategies. Use when building adaptive interfaces, implementing fluid layouts, or creating component-level responsive behavior.
---

# Responsive Design

Master modern responsive design techniques to create interfaces that adapt seamlessly across all screen sizes and device contexts.

## When to Use This Skill

- Implementing mobile-first responsive layouts
- Using container queries for component-based responsiveness
- Creating fluid typography and spacing scales
- Building complex layouts with CSS Grid and Flexbox
- Designing breakpoint strategies for design systems
- Implementing responsive images and media
- Creating adaptive navigation patterns
- Building responsive tables and data displays

## Core Capabilities

### 1. Container Queries

- Component-level responsiveness independent of viewport
- Container query units (cqi, cqw, cqh)
- Style queries for conditional styling
- Fallbacks for browser support

### 2. Fluid Typography & Spacing

- CSS clamp() for fluid scaling
- Viewport-relative units (vw, vh, dvh)
- Fluid type scales with min/max bounds
- Responsive spacing systems

### 3. Layout Patterns

- CSS Grid for 2D layouts
- Flexbox for 1D distribution
- Intrinsic layouts (content-based sizing)
- Subgrid for nested grid alignment

### 4. Breakpoint Strategy

- Mobile-first media queries
- Content-based breakpoints
- Design token integration
- Feature queries (@supports)

## Breakpoint Scale (Mobile-First)

```css
/* Base: Mobile (< 640px) */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## Key Patterns

### Pattern 1: Container Queries

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card { display: grid; grid-template-columns: 200px 1fr; gap: 1rem; }
}
```

- Tailwind: `@container`, `@md:flex-row`, `@lg:text-2xl`

### Pattern 2: Fluid Typography

```css
:root {
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-xl: clamp(1.25rem, 1rem + 1.25vw, 1.5rem);
}
```

- Formula: clamp(minSize, preferred, maxSize) with vw for fluid middle

### Pattern 3: CSS Grid Responsive

- `grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr))`
- Named areas for page layout; change grid-template-areas at breakpoints

### Pattern 4: Responsive Navigation

- Mobile: hamburger, absolute/fixed menu, toggle state
- Desktop: lg:static lg:flex-row, always visible

### Pattern 5: Responsive Images

- `<picture>` with `<source media="(min-width: ...)" srcSet="..." />` for art direction
- `<img srcSet="..." sizes="(max-width: 640px) 100vw, 50vw, 33vw" />` for resolution switching
- loading="lazy", fetchpriority="high" for above-fold

### Pattern 6: Responsive Tables

- Horizontal scroll wrapper with min-width on table
- Or card layout on mobile: md:table / md:hidden cards

## Viewport Units

- Prefer 100dvh over 100vh for mobile (dynamic viewport)
- 100svh (small), 100lvh (large) for min/max full height

## Best Practices

1. **Mobile-First**: Start with mobile styles, enhance for larger screens
2. **Content Breakpoints**: Set breakpoints based on content, not devices
3. **Fluid Over Fixed**: Use fluid values for typography and spacing
4. **Container Queries**: Use for component-level responsiveness
5. **Touch Targets**: Maintain 44x44px minimum on mobile
6. **Logical Properties**: Use inline/block for internationalization

## Common Issues

- Horizontal overflow; fixed widths instead of relative units
- 100vh issues on mobile; font too small; touch targets too small
- Aspect ratio issues; z-index stacking on different screens
