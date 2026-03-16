---
name: react-native-design
description: Master React Native styling, navigation, and Reanimated animations for cross-platform mobile development. Use when building React Native apps, implementing navigation patterns, or creating performant animations.
---

# React Native Design

Master React Native styling patterns, React Navigation, and Reanimated 3 to build performant, cross-platform mobile applications with native-quality UX.

## When to Use This Skill

- Building cross-platform mobile apps with React Native
- Implementing navigation with React Navigation 6+
- Creating performant animations with Reanimated 3
- Styling with StyleSheet and styled-components
- Building responsive layouts for different screen sizes
- Implementing platform-specific designs (iOS/Android)
- Creating gesture-driven interactions with Gesture Handler
- Optimizing React Native performance

## Core Concepts

### 1. StyleSheet and Styling

- StyleSheet.create({ container: { flex: 1, padding: 16 }, ... })
- Dynamic styles: style={[styles.card, variant === 'primary' && styles.primary, disabled && styles.disabled]}

### 2. Flexbox Layout

- flexDirection: "column" | "row", gap, justifyContent, alignItems
- flex: 1 for fill; spaceBetween for row distribution

### 3. React Navigation

- **Stack**: createNativeStackNavigator, screenOptions (headerStyle, headerTintColor), Stack.Screen options={{ title }, ({ route }) => ({ title: `Item ${route.params.itemId}` })}
- **Tabs**: createBottomTabNavigator, screenOptions tabBarIcon, tabBarActiveTintColor

### 4. Reanimated 3

- useSharedValue, useAnimatedStyle, withSpring, withTiming
- Animated.View style={[styles.box, animatedStyle]}
- Gesture.Pan().onUpdate().onEnd() with GestureDetector, run on UI thread

### 5. Platform-Specific

- Platform.select({ ios: { shadowColor, shadowOffset, shadowOpacity, shadowRadius }, android: { elevation } })
- Platform.OS === "ios" ? "SF Pro Text" : "Roboto"

## Quick Start Component

- AnimatedPressable with useSharedValue(1), useAnimatedStyle scale
- onPressIn/onPressOut with withSpring(0.97)/withSpring(1)
- StyleSheet: card (borderRadius, shadow/elevation), image, content, title, subtitle

## Best Practices

1. **TypeScript**: Define navigation and prop types
2. **Memoize**: React.memo, useCallback to reduce rerenders
3. **UI Thread**: Reanimated worklets for 60fps
4. **Avoid Inline Styles**: Use StyleSheet.create
5. **Safe Areas**: SafeAreaView or useSafeAreaInsets
6. **Test on Device**: Simulator performance differs
7. **Lists**: FlatList, never ScrollView + map for long lists
8. **Platform**: Platform.select for iOS/Android differences

## Common Issues

- Gesture conflicts: use simultaneousHandlers, wrap with GestureDetector
- Navigation types: define ParamList for all navigators
- Animation jank: runOnUI worklets
- Memory: cancel animations and cleanup in useEffect
- Fonts: expo-font or react-native-asset for custom fonts
- Safe area: test on notched devices
