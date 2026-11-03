# RoomCraft

A room planner for React Native (community CLI, **no Expo**): draw walls, place furniture, preview in 3D, get styling suggestions.

## First-time setup

This repo contains the app source but not the generated native folders. One script creates them with the official React Native CLI and installs the libraries:

```bash
bash scripts/bootstrap.sh
npm run typecheck
npm start            # Metro
npm run android      # or: npm run ios (macOS only)
```

Requirements: Node 22+, JDK 17 and the Android SDK for Android, Xcode and CocoaPods for iOS. See https://reactnative.dev/docs/set-up-your-environment.

## What changed from the Expo version

| Before (Expo) | Now |
| --- | --- |
| `expo-router` file routes in `src/app/` | React Navigation native stack in `src/navigation.tsx` |
| `expo-status-bar` | `StatusBar` from `react-native` |
| `expo-constants`, `expo-linking` | removed (unused) |
| `EXPO_PUBLIC_STYLE_ENDPOINT` env var | `STYLE_ENDPOINT` in `src/config.ts` |
| `expo start`, EAS Build | `react-native start`, Gradle / Xcode |
| `.github/workflows/eas-build.yml` | `.github/workflows/android-build.yml` (debug APK) |

Screens, store, geometry, canvas, isometric view and AI-styling logic are unchanged apart from reading route params from React Navigation.

## What's inside

- **2D editor** (`src/components/floor-plan-canvas.tsx`): drag or tap-chain walls on a 10 cm grid, place/move/rotate/delete furniture, live wall lengths and area. Projects persist locally via zustand + AsyncStorage.
- **3D preview** (`src/components/iso-view.tsx`): rotatable isometric view drawn with `react-native-svg`.
- **AI styling** (`src/ai/suggest-style.ts`): offline rules by default. Set `STYLE_ENDPOINT` in `src/config.ts` to a server you run that returns `{ tips: string[], styles: StylePick[] }`. Keep model API keys on that server.

## Known limits

- Rooms are not detected as closed polygons; area is the walls' bounding box.
- Furniture overlap checks ignore walls.
- The isometric preview sorts per object, so very large items can overlap oddly.
- This conversion was written without network access, so it has not been compiled or run on a device.
