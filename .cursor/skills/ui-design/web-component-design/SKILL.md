---
name: web-component-design
description: Master React, Vue, and Svelte component patterns including CSS-in-JS, composition strategies, and reusable component architecture. Use when building UI component libraries, designing component APIs, or implementing frontend design systems.
---

# Web Component Design

Build reusable, maintainable UI components using modern frameworks with clean composition patterns and styling approaches.

## When to Use This Skill

- Designing reusable component libraries or design systems
- Implementing complex component composition patterns
- Choosing and applying CSS-in-JS solutions
- Building accessible, responsive UI components
- Creating consistent component APIs across a codebase
- Refactoring legacy components into modern patterns
- Implementing compound components or render props

## Core Concepts

### 1. Component Composition Patterns

- **Compound Components**: <Select><Select.Trigger /><Select.Options><Select.Option /></Select.Options></Select>
- **Render Props**: <DataFetcher url="...">{({ data, loading, error }) => ...}</DataFetcher>
- **Slots (Vue/Svelte)**: <template #header>, #content, #footer>

### 2. CSS-in-JS Approaches

| Solution           | Approach           | Best For                    |
| ------------------ | ------------------ | --------------------------- |
| Tailwind CSS       | Utility classes    | Rapid prototyping, systems  |
| CSS Modules        | Scoped CSS         | Gradual adoption            |
| styled-components  | Template literals  | React, dynamic styling      |
| Emotion             | Object/template    | Flexible, SSR               |
| Vanilla Extract    | Zero-runtime       | Performance-critical        |

### 3. Component API Design

- variant, size, isLoading, isDisabled, leftIcon, rightIcon, children, onClick
- Semantic prop names (isLoading not loading), sensible defaults
- Style overrides via className or style

## Quick Start: React + CVA

- cva("base…", { variants: { variant, size }, defaultVariants })
- forwardRef, cn(buttonVariants({ variant, size }), className)
- isLoading → disabled, Spinner; displayName = "Button"

## Framework Patterns

### React: Compound Components

- createContext, useContext for AccordionContext (openItems, toggle)
- Accordion wraps Provider; Accordion.Item uses useAccordion()

### Vue 3: Composables

- provide/inject with InjectionKey for TabsContext (activeTab, setActive)
- computed(() => tabs?.activeTab.value === props.id)

### Svelte 5: Runes

- $props() for variant, size, onclick, children (Snippet)
- $derived for classes

## Best Practices

1. **Single Responsibility**: One clear purpose per component
2. **Prop Drilling**: Use context for deep data
3. **Accessible by Default**: ARIA, keyboard support
4. **Controlled vs Uncontrolled**: Support both when appropriate
5. **Forward Refs**: Allow parent DOM access
6. **Memoization**: React.memo, useMemo for expensive renders
7. **Error Boundaries**: Wrap components that can fail

## Common Issues

- Prop explosion: prefer composition
- Style conflicts: scoped styles or CSS Modules
- Re-render cascades: profile with React DevTools, memo
- Accessibility gaps: test with screen readers and keyboard
- Bundle size: tree-shake unused variants
