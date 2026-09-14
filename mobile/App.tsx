import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

const DEFAULT_WEB_APP_URL = 'http://192.168.0.43:3000';
const WEB_APP_URL_KEY = 'baton-web-app-url';

export default function App() {
  const [url, setUrl] = useState(DEFAULT_WEB_APP_URL);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(WEB_APP_URL_KEY).then((savedUrl) => {
      if (savedUrl) {
        setUrl(savedUrl);
        setActiveUrl(savedUrl);
      }
    });
  }, []);

  const openApp = async () => {
    const nextUrl = url.trim().replace(/\/$/, '');
    if (!/^https?:\/\//.test(nextUrl)) return;
    await AsyncStorage.setItem(WEB_APP_URL_KEY, nextUrl);
    setActiveUrl(nextUrl);
  };

  if (!activeUrl) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.setup}>
          <Text style={styles.title}>Connect to Baton Audio</Text>
          <Text style={styles.copy}>Start the server on your PC, then enter its current address.</Text>
          <TextInput value={url} onChangeText={setUrl} style={styles.input} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
          <TouchableOpacity style={styles.button} onPress={openApp}><Text style={styles.buttonText}>Open app</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <WebView
        source={{ uri: activeUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        startInLoadingState
        onError={() => setActiveUrl(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090a0f' },
  setup: { flex: 1, justifyContent: 'center', padding: 28 },
  title: { color: '#f5f3ee', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  copy: { color: '#b7bac5', fontSize: 15, lineHeight: 22, marginBottom: 20 },
  input: { backgroundColor: '#222530', borderRadius: 10, color: '#fff', fontSize: 16, marginBottom: 12, padding: 14 },
  button: { alignItems: 'center', backgroundColor: '#65d6b0', borderRadius: 10, padding: 15 },
  buttonText: { color: '#07130f', fontSize: 16, fontWeight: '700' },
  webview: { flex: 1 },
});
