// Platform-agnostic core for Baton Audio Sync.
//
// Everything exported here is framework-free (no React, DOM, or Node-only APIs) and is
// meant to be reused across every target:
//   - the web client (src/)
//   - the Expo shell that ships iOS + Android (mobile/)
//   - any future fully-native client
//   - the Node WebSocket server (server.ts)
//
// Keep this layer pure: domain model, wire protocol, and business/math helpers only.
// UI, sockets, storage, and audio playback live in platform-specific layers.

export * from './protocol';
export * from './audioSource';
export * from './playbackSync';
export * from './songMatch';
export type * from '../types';
