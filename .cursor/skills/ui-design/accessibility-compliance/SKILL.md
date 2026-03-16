---
name: accessibility-compliance
description: Implement WCAG 2.2 compliant interfaces with mobile accessibility, inclusive design patterns, and assistive technology support. Use when auditing accessibility, implementing ARIA patterns, building for screen readers, or ensuring inclusive user experiences.
---

# Accessibility Compliance

Master accessibility implementation to create inclusive experiences that work for everyone, including users with disabilities.

## When to Use This Skill

- Implementing WCAG 2.2 Level AA or AAA compliance
- Building screen reader accessible interfaces
- Adding keyboard navigation to interactive components
- Implementing focus management and focus trapping
- Creating accessible forms with proper labeling
- Supporting reduced motion and high contrast preferences
- Building mobile accessibility features (iOS VoiceOver, Android TalkBack)
- Conducting accessibility audits and fixing violations

## Core Capabilities

### 1. WCAG 2.2 Guidelines

- Perceivable: Content must be presentable in different ways
- Operable: Interface must be navigable with keyboard and assistive tech
- Understandable: Content and operation must be clear
- Robust: Content must work with current and future assistive technologies

### 2. ARIA Patterns

- Roles: Define element purpose (button, dialog, navigation)
- States: Indicate current condition (expanded, selected, disabled)
- Properties: Describe relationships and additional info (labelledby, describedby)
- Live regions: Announce dynamic content changes

### 3. Keyboard Navigation

- Focus order and tab sequence
- Focus indicators and visible focus states
- Keyboard shortcuts and hotkeys
- Focus trapping for modals and dialogs

### 4. Screen Reader Support

- Semantic HTML structure
- Alternative text for images
- Proper heading hierarchy
- Skip links and landmarks

### 5. Mobile Accessibility

- Touch target sizing (44x44dp minimum)
- VoiceOver and TalkBack compatibility
- Gesture alternatives
- Dynamic Type support

## Quick Reference

### WCAG 2.2 Success Criteria Checklist

| Level | Criterion | Description |
| ----- | --------- | ---------------------------------------------------- |
| A | 1.1.1 | Non-text content has text alternatives |
| A | 1.3.1 | Info and relationships programmatically determinable |
| A | 2.1.1 | All functionality keyboard accessible |
| A | 2.4.1 | Skip to main content mechanism |
| AA | 1.4.3 | Contrast ratio 4.5:1 (text), 3:1 (large text) |
| AA | 1.4.11 | Non-text contrast 3:1 |
| AA | 2.4.7 | Focus visible |
| AA | 2.5.8 | Target size minimum 24x24px (NEW in 2.2) |
| AAA | 1.4.6 | Enhanced contrast 7:1 |
| AAA | 2.5.5 | Target size minimum 44x44px |

## Key Patterns

### Pattern 1: Accessible Button

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

function AccessibleButton({
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "min-h-[44px] min-w-[44px]",
        variant === "primary" && "bg-primary text-primary-foreground",
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="sr-only">Loading</span>
          <Spinner aria-hidden="true" />
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

### Pattern 2: Accessible Modal Dialog

- Use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- Trap focus when open; close on Escape
- Prevent body scroll when open

### Pattern 3: Accessible Form

- Use `aria-invalid`, `aria-describedby` for errors/hints
- Error summary with `role="alert"` and `aria-live="assertive"`
- Required fields: `aria-required="true"`, visible and screen-reader "(required)"

### Pattern 4: Skip Navigation Link

- `sr-only focus:not-sr-only` for visible-on-focus skip link
- Target `#main-content` with `tabIndex={-1}` for focus after skip

### Pattern 5: Live Region for Announcements

- `role="status"` or `role="alert"`, `aria-live="polite"` or `"assertive"`, `aria-atomic="true"`
- Clear then set message to force re-announcement

## Color Contrast Requirements

- Normal text: AA 4.5:1, AAA 7:1
- Large text: AA 3:1, AAA 4.5:1
- UI components: AA 3:1

## Best Practices

1. **Use Semantic HTML**: Prefer native elements over ARIA when possible
2. **Test with Real Users**: Include people with disabilities in user testing
3. **Keyboard First**: Design interactions to work without a mouse
4. **Don't Disable Focus Styles**: Style them, don't remove them
5. **Provide Text Alternatives**: All non-text content needs descriptions
6. **Support Zoom**: Content should work at 200% zoom
7. **Announce Changes**: Use live regions for dynamic content
8. **Respect Preferences**: Honor prefers-reduced-motion and prefers-contrast

## Common Issues

- Missing alt text; poor color contrast; keyboard traps
- Missing labels; auto-playing media; inaccessible custom controls
- Missing skip links; focus order issues

## Testing Tools

- **Automated**: axe DevTools, WAVE, Lighthouse
- **Manual**: VoiceOver (macOS/iOS), NVDA/JAWS (Windows), TalkBack (Android)
