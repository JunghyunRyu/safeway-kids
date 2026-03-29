---
name: expo-native-ui
description: Official Expo team guide for building native UI with Expo Router. Covers styling, navigation, components, animations, and platform patterns.
version: 1.0.1
source: expo/skills
license: MIT
---

# Expo UI Guidelines

## Running the App

**CRITICAL: Always try Expo Go first before creating custom builds.**

1. Start with `npx expo start` and scan QR code with Expo Go
2. Only create custom builds (`npx expo run:ios/android`) when using local native modules, Apple targets, or third-party native modules not in Expo Go

## Code Style

- Always use import statements at the top of the file
- Use kebab-case for file names: `comment-card.tsx`
- Remove old route files when restructuring navigation
- Configure tsconfig.json with path aliases, prefer aliases over relative imports

## Routes

- Routes belong in the `app` directory only
- Never co-locate components, types, or utilities in app directory
- Ensure app always has a route matching "/"
- Use `_layout.tsx` files to define stacks

## Library Preferences

| Use | Not |
|-----|-----|
| `expo-audio` | `expo-av` |
| `expo-video` | `expo-av` |
| `expo-image` with `source="sf:name"` | `expo-symbols` or `@expo/vector-icons` |
| `react-native-safe-area-context` | RN SafeAreaView |
| `process.env.EXPO_OS` | `Platform.OS` |
| `React.use` | `React.useContext` |

## Responsiveness

- Always wrap root component in a ScrollView
- Use `contentInsetAdjustmentBehavior="automatic"` instead of SafeAreaView
- Use flexbox instead of Dimensions API
- Prefer `useWindowDimensions` over `Dimensions.get()`

## Styling

- Follow Apple Human Interface Guidelines
- Prefer flex gap over margin/padding
- Prefer padding over margin
- Inline styles, not StyleSheet.create (unless reusing)
- Use `{ borderCurve: 'continuous' }` for rounded corners
- Use CSS `boxShadow`, never legacy RN shadow or elevation

```tsx
<View style={{ boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)" }} />
```

- Add `selectable` prop to every Text displaying important data
- Counters: `{ fontVariant: 'tabular-nums' }`
- CSS and Tailwind are NOT supported in React Native — use inline styles

## Navigation

### Link
```tsx
import { Link } from 'expo-router';
<Link href="/path" />
```

### Stack
```tsx
// _layout.tsx
import { Stack } from 'expo-router/stack';
<Stack.Screen options={{ title: "Home" }} />
```

### Modal
```tsx
<Stack.Screen name="modal" options={{ presentation: "modal" }} />
```

### Sheet
```tsx
<Stack.Screen name="sheet" options={{
  presentation: "formSheet",
  sheetGrabberVisible: true,
  sheetAllowedDetents: [0.5, 1.0],
}} />
```

## Context Menus & Previews

Add context menus and previews frequently to enhance navigation:
```tsx
<Link href="/settings" asChild>
  <Link.Trigger><Pressable><Card /></Pressable></Link.Trigger>
  <Link.Menu>
    <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={handleShare} />
    <Link.MenuAction title="Delete" icon="trash" destructive onPress={handleDelete} />
  </Link.Menu>
  <Link.Preview />
</Link>
```

## Behavior

- Use expo-haptics conditionally on iOS
- First child of Stack route should be ScrollView with `contentInsetAdjustmentBehavior="automatic"`
- Prefer `headerSearchBarOptions` for search bars
- Use `<Text selectable />` for copyable data
- Never use intrinsic elements like 'img' or 'div' (unless in webview/DOM component)

## Common Route Structure

```
app/
  _layout.tsx          → <NativeTabs />
  (index,search)/
    _layout.tsx        → <Stack />
    index.tsx          → Main list
    search.tsx         → Search view
    i/[id].tsx         → Detail view
```
