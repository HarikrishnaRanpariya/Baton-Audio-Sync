---
applyTo: "mobile/**"
description: "Expo/EAS build and WebView shell guidance for the Baton Audio Sync Android app."
---
# Mobile (Expo WebView shell)

The `mobile/` app is an **Expo 52 WebView shell**, not a second implementation of the web app.
It loads the web client URL in a `react-native-webview` and persists that URL in AsyncStorage.
Package: `com.baton.audiosync`. Do **not** port web features (baton UI, players, queues) into React Native —
all product features live in [src/](../../src) and are served over the web.

## Do
- Keep changes limited to shell concerns: the WebView, server-URL entry/persistence, status bar,
  Android back-button handling, permissions, icons/splash, and native config.
- Persist the server URL in AsyncStorage; allow editing it at runtime.
- Use `wss://`/`https://` for deployed servers; the host must support long-running WebSocket connections.

## Don't
- Don't add screens that duplicate web functionality.
- Don't hardcode a new default server URL without preserving runtime editability.

## Build commands (run from `mobile/`)
- Preview APK (internal testing): `npx eas-cli@latest build --platform android --profile preview`
- Production AAB (Google Play): `npx eas-cli@latest build --platform android --profile production`
- Clear remote cache: append `--clear-cache`
- Verify project: `npx expo config --json`, `npx expo-doctor`, `npx expo prebuild --no-install --platform android`

Local emulator/device URLs: `ws://10.0.2.2:3000` (emulator), `ws://<PC_IP>:3000` (same Wi-Fi),
`wss://<domain>` (deployed). Start the server first with `npm run dev` from the repo root.
