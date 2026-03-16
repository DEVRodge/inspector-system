---
name: mobile-android-design
description: Master Material Design 3 and Jetpack Compose patterns for building native Android apps. Use when designing Android interfaces, implementing Compose UI, or following Google's Material Design guidelines.
---

# Android Mobile Design

Master Material Design 3 (Material You) and Jetpack Compose to build modern, adaptive Android applications that integrate with the Android ecosystem.

## When to Use This Skill

- Designing Android app interfaces following Material Design 3
- Building Jetpack Compose UI and layouts
- Implementing Android navigation (Navigation Compose)
- Creating adaptive layouts for phones, tablets, foldables
- Using Material 3 theming with dynamic colors
- Building accessible Android interfaces
- Implementing Android-specific gestures and interactions
- Designing for different screen configurations

## Core Concepts

### 1. Material Design 3 Principles

- **Personalization**: Dynamic color from wallpaper
- **Accessibility**: Tonal palettes for contrast
- **Large Screens**: Responsive layouts for tablets and foldables

- Components: Cards, Buttons, FABs, Chips, Navigation (rail, drawer, bottom), Text fields, Dialogs, Sheets, Lists, Menus, Progress

### 2. Jetpack Compose Layout

- **Column / Row**: verticalArrangement, horizontalAlignment, Modifier.padding(), Modifier.fillMaxWidth()
- **LazyColumn / LazyVerticalGrid**: stickyHeader, GridCells.Adaptive(minSize), contentPadding, Arrangement.spacedBy()

### 3. Navigation Patterns

- **Bottom Navigation**: Scaffold(bottomBar = { NavigationBar { NavigationBarItem(...) } }), NavHost with composable()
- **Drawer**: ModalNavigationDrawer, ModalDrawerSheet, NavigationDrawerItem, rememberDrawerState, scope.launch { drawerState.open/close }

### 4. Material 3 Theming

- **Dynamic color**: dynamicLightColorScheme(context) / dynamicDarkColorScheme(context) (API 31+)
- **Color scheme**: lightColorScheme(primary =, onPrimary =, primaryContainer =, surface =, onSurface =, ...)
- **Typography**: Typography(displayLarge =, headlineMedium =, titleLarge =, bodyLarge =, labelMedium =)

### 5. Components

- **Card**: Card(onClick =, shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(...))
- **Buttons**: Button, FilledTonalButton, OutlinedButton, TextButton
- **FAB**: FloatingActionButton(containerColor =, contentColor =)

## Quick Start Component

- Card with Row: Box (icon in CircleShape), Column (title + subtitle), Icon(ChevronRight)
- Modifier.padding(16.dp), MaterialTheme.typography, MaterialTheme.colorScheme

## Best Practices

1. **Use Material Theme**: MaterialTheme.colorScheme for dark mode
2. **Support Dynamic Color**: Enable on Android 12+
3. **Adaptive Layouts**: WindowSizeClass for responsive UI
4. **Content Descriptions**: contentDescription for interactive elements
5. **Touch Targets**: Minimum 48dp
6. **State Hoisting**: Reusable, testable components
7. **Remember**: remember and rememberSaveable where appropriate
8. **Previews**: @Preview with different configs

## Common Issues

- Recomposition: avoid unstable lambdas; use remember
- State loss: use rememberSaveable across configuration changes
- Performance: LazyColumn instead of Column for long lists
- Theme: MaterialTheme must wrap composables
- Navigation: handle back press and deep links
- Memory: cancel coroutines in DisposableEffect
