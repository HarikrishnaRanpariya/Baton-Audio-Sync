# Baton Audio Sync — Copilot instructions

Real-time synchronized group music player. Users listen together and take turns
controlling playback by holding the **baton** (a DJ token passed FIFO between members).

## Architecture (three layers)
- **Server** ([server.ts](../server.ts)): Express + `ws`. **Single source of truth.** All room
  state is in-memory in `Map<roomId, RoomState>` and is **ephemeral — lost on restart. There is no database.**
- **Web client** ([src/App.tsx](../src/App.tsx) + [src/components/](../src/components)): React 19 + TypeScript + Tailwind 4 (Vite).
  State is lifted into `App.tsx` and drilled to components.
- **Mobile** ([mobile/App.tsx](../mobile/App.tsx)): Expo 52 WebView pointing at the web app URL. It is a
  **shell, not a second implementation** — never port web features into React Native.

Shared types live in [src/types.ts](../src/types.ts).

## Non-negotiable invariants
- **Server owns shared state.** Clients send a typed event via `sendSocketEvent(type, data)`;
  the server mutates room state and broadcasts a full `room:sync` snapshot. Never mutate
  shared state client-side without a server round-trip.
- **Baton gates control.** Only the current baton owner may drive playback and queue mutations
  (`playback:update`, `queue:next_track`, remove/reorder). Enforce gating **server-side**, not just in the UI.
- **Baton queue is FIFO.** First to `baton:request` is next. A solo member and the first joiner auto-hold it.
- **Playback sync via timestamps.** Convergence uses `playback.updatedAt` + client elapsed-time math
  with the existing ~45ms latency compensation. Set `updatedAt`/`updatedBy` on every playback change.
- **Multi-source audio.** A song is a YouTube `videoId`, a direct `sourceUrl`, or an uploaded file
  under `/audio-uploads/`. Handle all three.
- **Queue dedupe + lock.** Dedupe on add (videoId → sourceUrl → title+artist). When locked
  (circular buffer), `queue:next_track` wraps the played song to the back; block remove/reorder.

For the full message protocol and the end-to-end checklist for a new event, use the
**baton-realtime-protocol** skill.

## Conventions
- Immutable state updates (spread new objects/arrays); `useState`/`useRef`/`useCallback`/`useEffect`.
- Tailwind dark glass-morphism styling (`bg-black`, `border-white/10`, `backdrop-blur-xl`, colored glows).
- `localStorage` keys are prefixed `baton_`; mobile persists the server URL in AsyncStorage.
- Keep changes minimal and scoped; match surrounding style. Don't add persistence unless asked.

## Verify changes
- `npm run lint` (tsc `--noEmit`). There is **no automated test suite** — verify manually with `npm run dev`.
