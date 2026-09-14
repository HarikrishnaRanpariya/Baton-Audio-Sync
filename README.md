# Baton Audio Sync

Baton Audio Sync contains the web application and an Expo Android project in `mobile/`.

## Android Preview APK

Run EAS commands from the `mobile` directory, not the repository root:

```powershell
cd "C:\Users\Surbhi\Hari_work\project\Baton-Audio-Sync\mobile"
npm.cmd ci
npx.cmd eas-cli@latest build --platform android --profile preview
```

The `preview` profile creates an Android APK for internal testing. After the build finishes, EAS provides a download link or QR code that can be used to install the APK on an Android device.

To rebuild while clearing EAS's remote build cache:

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview --clear-cache
```

## Google Play Production Build

Run:

```powershell
cd "C:\Users\Surbhi\Hari_work\project\Baton-Audio-Sync\mobile"
npx.cmd eas-cli@latest build --platform android --profile production
```

The `production` profile creates an Android App Bundle (`.aab`), which is the format required for publishing an app through Google Play. An AAB is not normally installed directly on a phone. Google Play uses it to generate optimized APKs for different devices and manages delivery, signing, updates, and release tracks.

After the production build completes:

1. Download the `.aab` from the EAS build page.
2. Open Google Play Console and create or select the Baton Audio Sync app.
3. Upload the `.aab` to an internal testing, closed testing, or production track.
4. Complete the Play Console store listing, app content, privacy, and release review requirements.

Use the preview APK for device testing. Use the production AAB for Google Play distribution.

## Installing the Preview APK

If EAS asks whether to install and run the build on an emulator, answer `No` unless Android Studio and an Android emulator are already configured. The cloud build can succeed even when local `adb` is unavailable.

To use an Android emulator locally, install Android Studio, create or start an emulator, and ensure these environment variables are configured:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"
adb devices
```

When `adb devices` lists an emulator, rerun the EAS install command. Otherwise, download the APK from the EAS build page and install it manually on a physical Android device. Enable installation from unknown sources for the app used to open the APK.

## Project Checks

From `mobile/`, these commands verify the Expo project:

```powershell
npx.cmd expo config --json
npx.cmd expo-doctor
npx.cmd expo prebuild --no-install --platform android
```

The mobile project uses Expo SDK 52 and the EAS project linked in `mobile/app.json`.

## Mobile Room Connection

Start the WebSocket server on the host PC before opening the Android app. Keep this terminal running while using the app.

From the repository root, run:

```powershell
cd "C:\Users\Surbhi\Hari_work\project\Baton-Audio-Sync"
npm run dev
```

Then open the APK and enter the server URL before joining a room. The app saves this URL on the device.

- Android emulator running the server on this computer: `ws://10.0.2.2:3000`
- Physical Android phone on the same Wi-Fi: `ws://YOUR_COMPUTER_IP:3000` (for this PC, use `ws://192.168.0.42:3000`; start the server with `npm run dev`, and allow port 3000 through Windows Firewall)
- Deployed server: `wss://YOUR_DEPLOYED_DOMAIN` (the deployed service must support WebSockets)

For a production APK, deploy `server.ts` to a host that supports long-running Node.js WebSocket connections, then enter its `wss://` address in the app. A normal static web hosting URL is not enough because it cannot run this WebSocket server.

After changing mobile code or the icon, create a new APK:

```powershell
cd "C:\Users\Surbhi\Hari_work\project\Baton-Audio-Sync\mobile"
npx.cmd eas-cli@latest build --platform android --profile preview
```

The Android app uses a WebView pointed at the same browser app URL as the host PC. This keeps the Android and browser experiences identical: login, synchronized YouTube playback, baton controls, catalog search, master queue, playlists, group members, chat, reactions, ambient mode, notifications, and the existing browser modals all come from the same `src/App.tsx` and `src/components/` files. The Android shell is not a second implementation of those features.

The mobile shell starts with the current development URL `http://192.168.0.43:3000`, but the URL can be edited in the app and is saved on the device. Keep `npm run dev` running on the host PC before opening the APK. If the PC receives a new IP, enter `http://NEW_PC_IP:3000` on the connection screen. For a deployed app, enter the deployed HTTPS URL. Both the browser and Android app must be able to reach that URL.

## Supported Music Sources

- YouTube and YouTube Music links use the YouTube embedded player. Some videos may be unavailable because the owner, region, age restriction, or YouTube policy blocks embedding.
- A direct audio URL such as an `.mp3`, `.m4a`, `.wav`, or compatible audio stream can be entered in the URL tab. The URL must point to the audio file or stream itself, not a normal web page, and the host must allow browser media requests.
- An audio file selected from device storage is uploaded to the host server and then shared with the room as an audio URL. The server accepts audio files up to 50 MB. Keep the host server running and ensure every listener can reach the host PC; only upload files you have permission to share.
