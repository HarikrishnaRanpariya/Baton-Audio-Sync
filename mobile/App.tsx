import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { WebView, WebViewNavigation } from 'react-native-webview';

const DEFAULT_WEB_APP_URL = 'http://192.168.0.43:3000';
const WEB_APP_URL_KEY = 'baton-web-app-url';

export default function App() {
  const [url, setUrl] = useState(DEFAULT_WEB_APP_URL);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    AsyncStorage.getItem(WEB_APP_URL_KEY).then((savedUrl) => {
      if (savedUrl) {
        setUrl(savedUrl);
        setActiveUrl(savedUrl);
      }
    });
  }, []);

  // Handle Android hardware back button
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [canGoBack]);

  const openApp = async (targetUrl?: string) => {
    const raw = (targetUrl ?? url).trim();
    if (!raw) {
      setErrorMessage('Please enter a server address.');
      return;
    }

    let nextUrl = raw.replace(/\/$/, '');
    if (!/^https?:\/\//i.test(nextUrl)) {
      nextUrl = `http://${nextUrl}`;
    }

    try {
      setErrorMessage(null);
      setLoadError(null);
      await AsyncStorage.setItem(WEB_APP_URL_KEY, nextUrl);
      setUrl(nextUrl);
      setActiveUrl(nextUrl);
    } catch {
      setActiveUrl(nextUrl);
    }
  };

  const handleDisconnect = () => {
    setLoadError(null);
    setActiveUrl(null);
  };

  if (!activeUrl) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={styles.setup}>
          <Text style={styles.title}>Connect to Baton Audio</Text>
          <Text style={styles.copy}>
            Start the server on your PC, then enter its address to sync audio in real time.
          </Text>

          <TextInput
            value={url}
            onChangeText={(text) => {
              setUrl(text);
              if (errorMessage) setErrorMessage(null);
            }}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.0.x:3000"
            placeholderTextColor="#6b7280"
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={() => openApp()}>
            <Text style={styles.buttonText}>Connect to Server</Text>
          </TouchableOpacity>

          <View style={styles.presetContainer}>
            <Text style={styles.presetLabel}>Quick Presets:</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => {
                  setUrl('http://10.0.2.2:3000');
                  openApp('http://10.0.2.2:3000');
                }}
              >
                <Text style={styles.presetText}>Emulator (10.0.2.2:3000)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => {
                  setUrl(DEFAULT_WEB_APP_URL);
                  openApp(DEFAULT_WEB_APP_URL);
                }}
              >
                <Text style={styles.presetText}>PC Wi-Fi (192.168.0.43:3000)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <Text style={styles.topBarUrl} numberOfLines={1}>
          {activeUrl}
        </Text>
        <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
          <Text style={styles.disconnectText}>Change Server</Text>
        </TouchableOpacity>
      </View>

      {loadError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorSubtext}>{loadError}</Text>
          <Text style={styles.errorHint}>
            Make sure `npm run dev` is running on your computer and your phone is on the same Wi-Fi.
          </Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoadError(null);
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.changeButton} onPress={handleDisconnect}>
              <Text style={styles.changeButtonText}>Change URL</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
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
          userAgent="Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
          androidHardwareAccelerationDisabled={false}
          androidLayerType="hardware"
          originWhitelist={['*']}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#65d6b0" />
            </View>
          )}
          onNavigationStateChange={(navState: WebViewNavigation) => {
            setCanGoBack(navState.canGoBack);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setLoadError(`Could not load ${activeUrl} (${nativeEvent.description || 'Network error'})`);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090a0f' },
  setup: { flex: 1, justifyContent: 'center', padding: 28 },
  title: { color: '#f5f3ee', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  copy: { color: '#b7bac5', fontSize: 15, lineHeight: 22, marginBottom: 20 },
  input: {
    backgroundColor: '#171923',
    borderColor: '#2d3139',
    borderWidth: 1,
    borderRadius: 10,
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    padding: 14,
  },
  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
  button: {
    alignItems: 'center',
    backgroundColor: '#65d6b0',
    borderRadius: 10,
    padding: 15,
    marginTop: 4,
  },
  buttonText: { color: '#07130f', fontSize: 16, fontWeight: '700' },
  presetContainer: { marginTop: 28 },
  presetLabel: { color: '#8e929f', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: {
    backgroundColor: '#1f222e',
    borderColor: '#2e3344',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetText: { color: '#c5c9d6', fontSize: 13 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#12141c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e212d',
  },
  topBarUrl: { color: '#8e929f', fontSize: 12, flex: 1, marginRight: 10 },
  disconnectBtn: {
    backgroundColor: '#202432',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  disconnectText: { color: '#65d6b0', fontSize: 12, fontWeight: '600' },
  webview: { flex: 1, backgroundColor: '#090a0f' },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: { color: '#ef4444', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  errorSubtext: { color: '#f3f4f6', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  errorHint: { color: '#9ca3af', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  errorActions: { flexDirection: 'row', gap: 12 },
  retryButton: {
    backgroundColor: '#65d6b0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#07130f', fontWeight: '700', fontSize: 14 },
  changeButton: {
    backgroundColor: '#1f222e',
    borderColor: '#2e3344',
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeButtonText: { color: '#e5e7eb', fontSize: 14 },
});

