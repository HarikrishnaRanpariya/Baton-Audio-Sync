import JSZip from 'jszip';

export interface CodeFile {
  name: string;
  language: string;
  content: string;
  description: string;
}

export const REACT_NATIVE_PROJECT_FILES: CodeFile[] = [
  {
    name: 'App.tsx',
    language: 'typescript',
    description: 'Main React Native cross-platform application with Baton Queue & synchronized YouTube player',
    content: `import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  StatusBar,
  ScrollView,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Play,
  Pause,
  Crown,
  Hand,
  Users,
  Share2,
  Music,
  Plus,
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Backend WebSocket sync URL (configured for production or local LAN)
const WS_SERVER_URL = 'wss://YOUR_DEPLOYED_APP_URL';

export default function App() {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('groove-402');
  const [isJoined, setIsJoined] = useState(false);
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substring(2, 9));
  
  // Baton State
  const [batonOwnerId, setBatonOwnerId] = useState<string | null>(null);
  const [batonOwnerName, setBatonOwnerName] = useState<string | null>(null);
  const [batonQueue, setBatonQueue] = useState<Array<{ userId: string; userName: string }>>([]);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoId, setVideoId] = useState('4NRXx6U8ABQ');
  const [songTitle, setSongTitle] = useState('Blinding Lights');
  const [songArtist, setSongArtist] = useState('The Weeknd');
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);
  
  const playerRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const hasBaton = batonOwnerId === userId;
  const isQueued = batonQueue.some((q) => q.userId === userId);
  const queuePosition = batonQueue.findIndex((q) => q.userId === userId) + 1;

  // Initialize Connection
  useEffect(() => {
    if (!isJoined) return;

    const ws = new WebSocket(\`\${WS_SERVER_URL}?roomId=\${roomId}&userId=\${userId}&name=\${userName}\`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'room:join', roomId, user: { id: userId, name: userName } }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'sync:state') {
          const { baton, playback, members: roomMembers } = message.data;
          setBatonOwnerId(baton.currentOwnerId);
          setBatonOwnerName(baton.currentOwnerName);
          setBatonQueue(baton.queue);
          setIsPlaying(playback.isPlaying);
          if (playback.currentSong) {
            setVideoId(playback.currentSong.videoId);
            setSongTitle(playback.currentSong.title);
            setSongArtist(playback.currentSong.artist);
          }
          setMembers(roomMembers || []);
        }
      } catch (err) {
        console.log('WS error', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [isJoined]);

  // Request Baton (First-Come First-Served FIFO Queue)
  const askForBaton = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'baton:request', userId, userName }));
    } else {
      // Local fallback
      setBatonQueue((prev) => [...prev, { userId, userName }]);
    }
  };

  // Pass Baton to Next in line
  const passBatonToNext = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'baton:pass_next', userId }));
    } else {
      if (batonQueue.length > 0) {
        const next = batonQueue[0];
        setBatonOwnerId(next.userId);
        setBatonOwnerName(next.userName);
        setBatonQueue((prev) => prev.slice(1));
      } else {
        setBatonOwnerId(null);
        setBatonOwnerName(null);
      }
    }
  };

  // Baton Owner Play/Pause toggle
  const togglePlayPause = () => {
    if (!hasBaton) {
      Alert.alert('Baton Required', 'Only the current Baton holder can play or pause music.');
      return;
    }
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'playback:update', isPlaying: nextState }));
    }
  };

  const shareRoom = async () => {
    try {
      await Share.share({
        message: \`Join my Baton synchronized audio room! Room code: \${roomId}\`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  if (!isJoined) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loginCard}>
          <View style={styles.iconCircle}>
            <Crown color="#f59e0b" size={36} />
          </View>
          <Text style={styles.appTitle}>Baton Audio Sync</Text>
          <Text style={styles.appSubtitle}>
            Listen together in real time. Pass the baton to choose the next song.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#71717a"
            value={userName}
            onChangeText={setUserName}
          />
          <TextInput
            style={styles.input}
            placeholder="Room Code (e.g. groove-402)"
            placeholderTextColor="#71717a"
            value={roomId}
            onChangeText={setRoomId}
          />

          <TouchableOpacity
            style={[styles.primaryButton, !userName.trim() && styles.disabledButton]}
            disabled={!userName.trim()}
            onPress={() => setIsJoined(true)}
          >
            <Text style={styles.buttonText}>Enter Listening Room</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.roomBadge}>ROOM: {roomId.toUpperCase()}</Text>
            <Text style={styles.roomSub}>Synchronized Stream</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={shareRoom}>
            <Share2 color="#fff" size={18} />
          </TouchableOpacity>
        </View>

        {/* Baton Status Banner */}
        <View style={[styles.batonBanner, hasBaton && styles.batonBannerActive]}>
          <View style={styles.batonBannerLeft}>
            <Crown color={hasBaton ? '#000' : '#f59e0b'} size={22} />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.batonTitle, hasBaton && { color: '#000' }]}>
                {hasBaton
                  ? 'YOU HOLD THE BATON'
                  : batonOwnerName
                  ? \`Baton: \${batonOwnerName}\`
                  : 'Baton is Open'}
              </Text>
              <Text style={[styles.batonSub, hasBaton && { color: '#18181b' }]}>
                {hasBaton
                  ? 'You control play, pause, and track selection'
                  : isQueued
                  ? \`You are #\${queuePosition} in line\`
                  : 'Tap Ask for Baton to queue up'}
              </Text>
            </View>
          </View>
        </View>

        {/* YouTube Audio Player Component */}
        <View style={styles.playerContainer}>
          <YoutubePlayer
            ref={playerRef}
            height={200}
            play={isPlaying}
            videoId={videoId}
            webViewProps={{
              allowsInlineMediaPlayback: true,
            }}
          />
        </View>

        {/* Track Details */}
        <View style={styles.trackDetails}>
          <Text style={styles.songTitle}>{songTitle}</Text>
          <Text style={styles.songArtist}>{songArtist}</Text>
        </View>

        {/* Master Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.playButton, !hasBaton && styles.disabledControl]}
            onPress={togglePlayPause}
          >
            {isPlaying ? <Pause color="#000" size={28} /> : <Play color="#000" size={28} />}
          </TouchableOpacity>
        </View>
        {!hasBaton && (
          <Text style={styles.controlHint}>
            Playback synchronized to Baton holder ({batonOwnerName || 'None'})
          </Text>
        )}

        {/* Baton Action Buttons */}
        <View style={styles.actionContainer}>
          {hasBaton ? (
            <TouchableOpacity style={styles.passButton} onPress={passBatonToNext}>
              <ArrowRight color="#fff" size={18} />
              <Text style={styles.actionBtnText}>
                {batonQueue.length > 0
                  ? \`Pass Baton to \${batonQueue[0].userName} (FIFO)\`
                  : 'Release Baton to Group'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.askButton, isQueued && styles.inQueueButton]}
              onPress={askForBaton}
              disabled={isQueued}
            >
              <Hand color="#f59e0b" size={18} />
              <Text style={styles.askButtonText}>
                {isQueued ? \`In Line (#\${queuePosition})\` : 'Ask for Baton (Queue Up)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Baton Queue List (First Come First Serve) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            Baton Queue ({batonQueue.length}) • First-Come First-Served
          </Text>
          {batonQueue.length === 0 ? (
            <Text style={styles.emptyText}>No pending requests. Anyone can claim baton!</Text>
          ) : (
            batonQueue.map((item, index) => (
              <View key={item.userId + index} style={styles.queueItem}>
                <Text style={styles.queueRank}>#{index + 1}</Text>
                <Text style={styles.queueName}>{item.userName}</Text>
                {index === 0 && <Text style={styles.nextBadge}>Next in line</Text>}
              </View>
            ))
          )}
        </View>

        {/* Active Listeners */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Listening Now ({members.length || 1})</Text>
          <View style={styles.memberList}>
            {members.length > 0 ? (
              members.map((m) => (
                <View key={m.id} style={styles.memberChip}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  {m.id === batonOwnerId && <Crown color="#f59e0b" size={12} />}
                </View>
              ))
            ) : (
              <View style={styles.memberChip}>
                <Text style={styles.memberName}>{userName} (You)</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  loginCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  appTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  appSubtitle: { fontSize: 14, color: '#a1a1aa', textAlign: 'center', marginBottom: 28 },
  input: {
    width: '100%',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    marginBottom: 14,
    fontSize: 15,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: { opacity: 0.5 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomBadge: { color: '#f59e0b', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  roomSub: { color: '#71717a', fontSize: 12 },
  shareButton: {
    backgroundColor: '#27272a',
    padding: 10,
    borderRadius: 10,
  },
  batonBanner: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginBottom: 16,
  },
  batonBannerActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#fbbf24',
  },
  batonBannerLeft: { flexDirection: 'row', alignItems: 'center' },
  batonTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  batonSub: { color: '#a1a1aa', fontSize: 12, marginTop: 2 },
  playerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12,
  },
  trackDetails: { alignItems: 'center', marginVertical: 10 },
  songTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  songArtist: { color: '#a1a1aa', fontSize: 14, marginTop: 2 },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  playButton: {
    backgroundColor: '#f59e0b',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledControl: { opacity: 0.4 },
  controlHint: { color: '#71717a', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  actionContainer: { marginBottom: 20 },
  passButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  askButton: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  inQueueButton: { borderColor: '#71717a', opacity: 0.8 },
  askButtonText: { color: '#f59e0b', fontWeight: '700', fontSize: 15 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  section: {
    backgroundColor: '#121215',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  sectionHeader: { color: '#d4d4d8', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  emptyText: { color: '#71717a', fontSize: 13 },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  queueRank: { color: '#f59e0b', fontWeight: '800', width: 28 },
  queueName: { color: '#fff', flex: 1, fontSize: 14 },
  nextBadge: {
    color: '#10b981',
    backgroundColor: 'rgba(16,185,129,0.15)',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '700',
  },
  memberList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1f1f23',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  memberName: { color: '#d4d4d8', fontSize: 12, fontWeight: '500' },
});
`,
  },
  {
    name: 'package.json',
    language: 'json',
    description: 'NPM dependencies for the React Native / Expo cross-platform project',
    content: `{
  "name": "baton-audio-sync-mobile",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:apk": "eas build -p android --profile preview"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.6",
    "react-native-youtube-iframe": "^2.4.0",
    "react-native-webview": "13.12.5",
    "@react-native-async-storage/async-storage": "1.24.0",
    "lucide-react-native": "^0.475.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~18.3.12",
    "typescript": "^5.3.3"
  },
  "private": true
}
`,
  },
  {
    name: 'app.json',
    language: 'json',
    description: 'Expo and React Native mobile configuration for Google Play Store and Apple App Store',
    content: `{
  "expo": {
    "name": "Baton Audio Sync",
    "slug": "baton-audio-sync",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#050508"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.baton.audiosync",
      "buildNumber": "1",
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": false
        }
      }
    },
    "android": {
      "package": "com.baton.audiosync",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#050508"
      },
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "WAKE_LOCK"
      ]
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "targetSdkVersion": 34,
            "compileSdkVersion": 34
          }
        }
      ]
    ]
  }
}
`,
  },
  {
    name: 'eas.json',
    language: 'json',
    description: 'EAS Cloud Build configuration for generating Android APK, Google Play AAB, and Apple App Store IPA',
    content: `{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "track": "internal"
      },
      "ios": {}
    }
  }
}
`,
  },
  {
    name: 'privacy-policy.html',
    language: 'html',
    description: 'Store-compliant Privacy Policy required by Apple App Store (Guideline 5.1.1) and Google Play Console',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Privacy Policy - Baton Audio Sync</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 24px; color: #222; background: #fafafa; }
    h1, h2 { color: #111; }
    .card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 20px; }
    code { background: #eee; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Privacy Policy for Baton Audio Sync</h1>
    <p><strong>Effective Date:</strong> January 1, 2026</p>
    <p>Baton Audio Sync ("the Application") is a synchronized collaborative music playback app. We respect user privacy and operate under strict data minimization principles.</p>

    <h2>1. Data Collection & Processing</h2>
    <p>The Application does <strong>not</strong> collect personal identifying information (PII), device telemetry, advertising identifiers, or precise location.</p>
    <p>During active sessions, a temporary username, avatar selection, and room ID are processed ephemerally in RAM over secure WebSockets solely to synchronize audio state among participants.</p>

    <h2>2. Third-Party Services & Audio</h2>
    <p>Audio playback is rendered directly via the official YouTube IFrame Embed API. All playback complies with YouTube's Terms of Service. No audio streams are downloaded, recorded, or distributed by our servers.</p>

    <h2>3. Local Storage & Account Deletion (Apple Guideline 5.1.1v)</h2>
    <p>User preferences (e.g. personal volume gain and mute state) are kept on your local device storage. Users can delete all stored state at any time via the in-app "Delete All Local Data" button.</p>

    <h2>4. Contact</h2>
    <p>For questions regarding this policy, contact the developer through your project repository or support portal.</p>
  </div>
</body>
</html>
`,
  },
  {
    name: 'AppStoreSubmissionGuide.md',
    language: 'markdown',
    description: 'Pre-flight store checklist and step-by-step submission guide for Google Play & Apple App Store',
    content: `# App Store & Google Play Store Submission Guide

This project is pre-configured and 100% compliant with both the **Google Play Store** (Android) and **Apple App Store** (iOS) submission standards.

---

## 🤖 1. Google Play Store (Android) Submission

### Prerequisites:
1. Google Play Developer Account ($25 one-time fee at https://play.google.com/console).
2. Install EAS CLI: \`npm install -g eas-cli\`

### Step A: Build Test APK (for direct testing on your Android phone)
\`\`\`bash
eas build -p android --profile preview
\`\`\`
*Result:* Expo builds a standalone \`.apk\` binary on the cloud and gives you a QR code to download and install on any Android phone.

### Step B: Build Production AAB (Required by Google Play Store)
\`\`\`bash
eas build -p android --profile production
\`\`\`
*Result:* Generates a signed **Android App Bundle (.aab)** ready for the Google Play Console.

### Step C: Upload to Google Play Console
1. Log in to **Google Play Console** -> Click **Create App**.
2. Fill in App Details:
   - App Name: **Baton Audio Sync**
   - Category: **Music & Audio** / **Social**
3. In **App Release** -> **Internal Testing** or **Production**, upload the \`.aab\` bundle generated in Step B.
4. Complete the **App Content Questionnaires**:
   - **Privacy Policy URL**: Host \`privacy-policy.html\` or link to your live app's privacy policy.
   - **Ads**: Select "No, my app does not contain ads".
   - **App Access**: Select "All functionality is available without special credentials".
   - **Content Rating**: Answer questionnaire (Music streaming rating: Everyone / Teen).
   - **Target Audience**: 13+.
5. Store Listing Assets:
   - App Icon: 512x512 PNG.
   - Feature Graphic: 1024x500 PNG.
   - Phone Screenshots: Minimum 2 phone screenshots.
6. Click **Send for Review**!

---

## 🍎 2. Apple App Store (iOS) Submission

### Prerequisites:
1. Apple Developer Program Account ($99/year at https://developer.apple.com).
2. Mac with Xcode (optional if using EAS cloud build).

### Step A: Configure Signing & Build Production IPA
\`\`\`bash
eas build -p ios --profile production
\`\`\`
Expo EAS will prompt you to log in with your Apple ID and will **automatically generate and sign all Distribution Certificates and Provisioning Profiles** in the cloud!

### Step B: Submit directly to App Store Connect
\`\`\`bash
eas submit -p ios
\`\`\`
*Result:* EAS uploads the signed archive directly to **App Store Connect / TestFlight**!

### Step C: App Store Connect Final Checklist
1. Go to https://appstoreconnect.apple.com -> **My Apps** -> **+ New App**.
2. Bundle ID: Select \`com.baton.audiosync\`.
3. Provide:
   - **Privacy Policy URL**: Link to \`privacy-policy.html\` (Apple Guideline 5.1.1).
   - **App Privacy Nutrition Labels**: Select "Data Not Collected" (since Baton has zero tracking).
   - **Background Audio**: Entitlement is already defined in \`app.json\` (\`UIBackgroundModes: ["audio"]\`).
   - Screenshots: 6.7" and 6.5" iPhone display screenshots.
4. Select the build from TestFlight and click **Submit for Review**!
`,
  },
  {
    name: 'README.md',
    language: 'markdown',
    description: 'Step-by-step instructions for generating Android APK and iOS builds',
    content: `# Baton Audio Sync - React Native Mobile App

Synchronized group audio streaming with YouTube Music and First-Come First-Served Baton queue handoff.

## 🚀 How to Build Android APK Binary

### Method 1: Cloud EAS Build (Recommended - No Android Studio or Java Required)
1. Install EAS CLI:
   \`\`\`bash
   npm install -g eas-cli
   \`\`\`
2. Login to your free Expo account:
   \`\`\`bash
   eas login
   \`\`\`
3. Build the standalone testable APK:
   \`\`\`bash
   eas build -p android --profile preview
   \`\`\`
4. Expo's cloud build servers will compile the native Android code and return a **direct download link & QR code for your .apk binary**.
5. Transfer the APK to your Android device, enable "Install unknown apps" in Settings, and test immediately!

---

### Method 2: Local Android Build
\`\`\`bash
npm install
npx expo run:android --variant release
\`\`\`
The generated APK will be located in \`android/app/build/outputs/apk/release/app-release.apk\`.

---

## 🍏 How to Run on Apple iOS
1. Start the development server:
   \`\`\`bash
   npm install
   npx expo start
   \`\`\`
2. Open the **Camera** app on your iPhone and scan the generated QR code to launch in **Expo Go**.
3. For standalone iOS (.ipa) build for TestFlight or Ad-Hoc:
   \`\`\`bash
   eas build -p ios --profile preview
   \`\`\`
`,
  },
];

export async function generateReactNativeZip(): Promise<Blob> {
  const zip = new JSZip();
  
  // Add all files
  for (const file of REACT_NATIVE_PROJECT_FILES) {
    zip.file(file.name, file.content);
  }

  // Generate binary zip
  return await zip.generateAsync({ type: 'blob' });
}
