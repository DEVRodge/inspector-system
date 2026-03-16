# UI Design Skills

基于 [wshobson/agents ui-design 插件](https://github.com/wshobson/agents/tree/main/plugins/ui-design) 的 Cursor Agent Skills，覆盖移动端（iOS、Android、React Native）与 Web 的 UI/UX 设计模式、无障碍与设计系统。

## Skills 列表

| Skill | 描述 |
| ----- | ----- |
| **accessibility-compliance** | WCAG 2.2、移动端 a11y、包容性设计、ARIA、键盘与读屏支持 |
| **design-system-patterns** | 设计令牌、主题、组件架构、Style Dictionary |
| **responsive-design** | 容器查询、流式布局、断点策略、Grid/Flexbox |
| **mobile-ios-design** | iOS HIG、SwiftUI 布局与导航、SF Symbols、Dynamic Type |
| **mobile-android-design** | Material Design 3、Jetpack Compose、动态色彩、导航模式 |
| **react-native-design** | React Native 样式、React Navigation、Reanimated、手势 |
| **web-component-design** | React/Vue/Svelte 组件模式、CSS-in-JS、复合组件 |
| **interaction-design** | 微交互、动效、过渡、加载状态、手势 |
| **visual-design-foundations** | 字体、色彩、间距、图标系统 |

## 使用方式

在对话中涉及对应场景时，Agent 会自动选用相应 skill，例如：

- 做无障碍审计或实现 ARIA → `accessibility-compliance`
- 搭设计系统、主题切换 → `design-system-patterns`
- 做响应式布局、容器查询 → `responsive-design`
- 做 iOS 界面、SwiftUI → `mobile-ios-design`
- 做 Android 界面、Compose → `mobile-android-design`
- 做 React Native 应用 → `react-native-design`
- 做 Web 组件库、组件 API 设计 → `web-component-design`
- 做动效、微交互、加载态 → `interaction-design`
- 做设计令牌、字体与色彩系统 → `visual-design-foundations`

## 目录结构

```
.cursor/skills/ui-design/
├── README.md
├── accessibility-compliance/SKILL.md
├── design-system-patterns/SKILL.md
├── responsive-design/SKILL.md
├── mobile-ios-design/SKILL.md
├── mobile-android-design/SKILL.md
├── react-native-design/SKILL.md
├── web-component-design/SKILL.md
├── interaction-design/SKILL.md
└── visual-design-foundations/SKILL.md
```
