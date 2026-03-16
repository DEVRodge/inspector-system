---
name: design-system-patterns
description: Build scalable design systems with design tokens, theming infrastructure, and component architecture patterns. Use when creating design tokens, implementing theme switching, building component libraries, or establishing design system foundations.
---

# Design System Patterns

Master design system architecture to create consistent, maintainable, and scalable UI foundations across web and mobile applications.

## When to Use This Skill

- Creating design tokens for colors, typography, spacing, and shadows
- Implementing light/dark theme switching with CSS custom properties
- Building multi-brand theming systems
- Architecting component libraries with consistent APIs
- Establishing design-to-code workflows with Figma tokens
- Creating semantic token hierarchies (primitive, semantic, component)
- Setting up design system documentation and guidelines

## Core Capabilities

### 1. Design Tokens

- Primitive tokens (raw values: colors, sizes, fonts)
- Semantic tokens (contextual meaning: text-primary, surface-elevated)
- Component tokens (specific usage: button-bg, card-border)
- Token naming conventions and organization
- Multi-platform token generation (CSS, iOS, Android)

### 2. Theming Infrastructure

- CSS custom properties architecture
- Theme context providers in React
- Dynamic theme switching
- System preference detection (prefers-color-scheme)
- Persistent theme storage
- Reduced motion and high contrast modes

### 3. Component Architecture

- Compound component patterns
- Polymorphic components (as prop)
- Variant and size systems
- Slot-based composition
- Headless UI patterns
- Style props and responsive variants

### 4. Token Pipeline

- Figma to code synchronization
- Style Dictionary configuration
- Token transformation and formatting
- CI/CD integration for token updates

## Quick Start

```typescript
// Design tokens with CSS custom properties
const tokens = {
  colors: {
    gray: { 50: "#fafafa", 100: "#f5f5f5", 900: "#171717" },
    blue: { 500: "#3b82f6", 600: "#2563eb" },
  },
  semantic: {
    light: {
      "text-primary": "var(--color-gray-900)",
      "surface-default": "var(--color-white)",
      "interactive-primary": "var(--color-blue-500)",
    },
    dark: {
      "text-primary": "var(--color-gray-50)",
      "surface-default": "var(--color-gray-900)",
      "interactive-primary": "var(--color-blue-400)",
    },
  },
};
```

## Key Patterns

### Pattern 1: Token Hierarchy

- **Layer 1**: Primitive tokens (--color-blue-500, --space-4, --font-size-base)
- **Layer 2**: Semantic tokens (--text-primary, --surface-default, --interactive-primary)
- **Layer 3**: Component tokens (--button-bg, --button-radius, --button-padding-x)

### Pattern 2: Theme Switching with React

- ThemeContext with theme, resolvedTheme, setTheme
- Support "light" | "dark" | "system"
- Use matchMedia("(prefers-color-scheme: dark)") for system
- Apply via documentElement.classList and/or CSS variables
- Persist in localStorage

### Pattern 3: Variant System with CVA

- Use `cva()` for base + variants (variant, size)
- defaultVariants for primary and size
- cn(buttonVariants({ variant, size, className })) on component

### Pattern 4: Style Dictionary Configuration

- source: ["tokens/**/*.json"]
- platforms: css (variables.css), scss, ios (DesignTokens.swift), android (colors.xml)
- outputReferences: true to preserve token references

## Best Practices

1. **Name Tokens by Purpose**: Use semantic names (text-primary) not visual (dark-gray)
2. **Maintain Token Hierarchy**: Primitives > Semantic > Component tokens
3. **Document Token Usage**: Include usage guidelines with token definitions
4. **Version Tokens**: Treat token changes as API changes with semver
5. **Test Theme Combinations**: Verify all themes work with all components
6. **Automate Token Pipeline**: CI/CD for Figma-to-code synchronization
7. **Provide Migration Paths**: Deprecate tokens gradually with clear alternatives

## Common Issues

- Token sprawl; inconsistent naming (camelCase vs kebab-case)
- Missing dark mode; hardcoded values; circular references
- Platform gaps (web but not mobile)
