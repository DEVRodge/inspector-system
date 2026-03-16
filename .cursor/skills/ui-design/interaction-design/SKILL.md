---
name: interaction-design
description: Design and implement microinteractions, motion design, transitions, and user feedback patterns. Use when adding polish to UI interactions, implementing loading states, or creating delightful user experiences.
---

# Interaction Design

Create engaging, intuitive interactions through motion, feedback, and thoughtful state transitions that enhance usability and delight users.

## When to Use This Skill

- Adding microinteractions to enhance user feedback
- Implementing smooth page and component transitions
- Designing loading states and skeleton screens
- Creating gesture-based interactions
- Building notification and toast systems
- Implementing drag-and-drop interfaces
- Adding scroll-triggered animations
- Designing hover and focus states

## Core Principles

### 1. Purposeful Motion

- **Feedback**: Confirm actions occurred
- **Orientation**: Show where elements come from/go to
- **Focus**: Direct attention to changes
- **Continuity**: Maintain context during transitions

### 2. Timing Guidelines

| Duration   | Use Case                          |
| ---------- | ---------------------------------- |
| 100–150ms  | Micro-feedback (hovers, clicks)    |
| 200–300ms  | Small transitions (toggles, dropdowns) |
| 300–500ms  | Medium (modals, page changes)      |
| 500ms+     | Complex choreography               |

### 3. Easing

- ease-out: cubic-bezier(0.16, 1, 0.3, 1) — entering
- ease-in: cubic-bezier(0.55, 0, 1, 0.45) — exiting
- ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)
- spring: cubic-bezier(0.34, 1.56, 0.64, 1) — playful

## Quick Start: Button Microinteraction

- motion.button with whileHover={{ scale: 1.02 }}, whileTap={{ scale: 0.98 }}
- transition: { type: "spring", stiffness: 400, damping: 17 }

## Interaction Patterns

### 1. Loading States

- Skeleton: animate-pulse, placeholder divs for layout
- Progress bar: motion.div animate width with progress %

### 2. State Transitions

- Toggle: role="switch", aria-checked, motion.span animate x with spring

### 3. Page Transitions

- AnimatePresence mode="wait", motion.div initial/animate/exit opacity and y

### 4. Feedback

- Ripple: track click position, append span with animate-ripple, remove after duration

### 5. Gestures

- motion.div drag="x", dragConstraints, onDragEnd — dismiss when offset > threshold

## CSS Animation Patterns

- @keyframes fadeIn, pulse, spin
- transition: transform, box-shadow with ease-out
- .card:hover: translateY(-4px), stronger shadow

## Accessibility

- @media (prefers-reduced-motion: reduce) { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
- In JS: matchMedia("(prefers-reduced-motion: reduce)").matches → duration 0

## Best Practices

1. **Performance**: Prefer transform and opacity for 60fps
2. **Reduce Motion**: Always respect prefers-reduced-motion
3. **Consistent Timing**: Use a timing scale app-wide
4. **Natural Physics**: Prefer spring over linear
5. **Interruptible**: Allow canceling long animations
6. **Progressive Enhancement**: Work without JS animation
7. **Test on Devices**: Performance varies

## Common Issues

- Jank: avoid animating width, height, top, left
- Over-animation: causes fatigue
- Blocking: never block user input during animation
- Memory: clean up listeners on unmount
- will-change: use sparingly
