---
name: mobile-ios-design
description: Master iOS Human Interface Guidelines and SwiftUI patterns for building native iOS apps. Use when designing iOS interfaces, implementing SwiftUI views, or ensuring apps follow Apple's design principles.
---

# iOS Mobile Design

Master iOS Human Interface Guidelines (HIG) and SwiftUI patterns to build polished, native iOS applications that feel at home on Apple platforms.

## When to Use This Skill

- Designing iOS app interfaces following Apple HIG
- Building SwiftUI views and layouts
- Implementing iOS navigation patterns (NavigationStack, TabView, sheets)
- Creating adaptive layouts for iPhone and iPad
- Using SF Symbols and system typography
- Building accessible iOS interfaces
- Implementing iOS-specific gestures and interactions
- Designing for Dynamic Type and Dark Mode

## Core Concepts

### 1. Human Interface Guidelines Principles

- **Clarity**: Content is legible, icons precise, adornments subtle
- **Deference**: UI supports content without competing with it
- **Depth**: Visual layers and motion convey hierarchy

- **iOS**: Touch-first, compact displays, portrait
- **iPadOS**: Larger canvas, multitasking, pointer support
- **visionOS**: Spatial computing, eye/hand input

### 2. SwiftUI Layout System

- **VStack / HStack**: alignment, spacing
- **LazyVGrid**: GridItem(.adaptive(minimum:maximum)) or .flexible()
- **Spacer()** for flexible space

### 3. Navigation Patterns

- **NavigationStack** (iOS 16+): path, NavigationLink(value:), navigationDestination(for:)
- **TabView**: Tab("Title", systemImage:, value:) with selection binding

### 4. System Integration

- **SF Symbols**: Image(systemName:), .symbolRenderingMode(.multicolor), .symbolEffect(.bounce, value:)
- **Dynamic Type**: .font(.headline), .font(.body), .font(.custom("Avenir", size: 17, relativeTo: .body))
- **Colors/Materials**: .foregroundStyle(.primary/.secondary), .fill(.ultraThinMaterial), .background(.regularMaterial, in: RoundedRectangle)

### 5. Visual Design

- Semantic colors: .primary, .secondary, .background
- Shadows: .shadow(color: .black.opacity(0.1), radius: 8, y: 4)

## Quick Start Component

- HStack with Image(systemName:), VStack title/subtitle, Spacer(), chevron
- .padding(), .background(.background, in: RoundedRectangle(cornerRadius: 12)), .shadow(...)

## Best Practices

1. **Use Semantic Colors**: .primary, .secondary, .background for light/dark
2. **Embrace SF Symbols**: Consistency and built-in accessibility
3. **Support Dynamic Type**: Semantic fonts instead of fixed sizes
4. **Add Accessibility**: .accessibilityLabel(), .accessibilityHint()
5. **Use Safe Areas**: safeAreaInset, avoid hardcoded edge padding
6. **State Restoration**: @SceneStorage for preserving state
7. **Support iPad Multitasking**: Split view and slide over
8. **Test on Device**: Simulator doesn’t capture haptics and full performance

## Common Issues

- Layout breaking: avoid .fixedSize() where possible; prefer flexible layouts
- Performance: use LazyVStack/LazyHStack for long lists
- Navigation: ensure NavigationLink values are Hashable
- Dark mode: avoid hardcoded colors; use semantic or asset catalog
- Accessibility: test with VoiceOver
- Memory: watch for strong reference cycles in closures
