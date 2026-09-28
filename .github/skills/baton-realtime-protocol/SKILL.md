---
name: baton-realtime-protocol
description: "Reference for the Baton Audio Sync WebSocket protocol and realtime model. Use when adding, changing, or debugging room sync, the baton (DJ token) FIFO handoff, the master/baton queues, playback sync, chat/reactions, host approvals, or audio upload/proxy endpoints — anything that crosses the client↔server boundary in server.ts and src/App.tsx."
---

# Baton Audio Sync — Realtime Protocol

The server ([server.ts](../../../server.ts)) is the single source of truth. State lives in-memory in `Map<roomId, RoomState>` and is lost on restart (no database). Clients send typed messages; the server mutates room state and broadcasts a full `room:sync` snapshot to every member. The React client ([src/App.tsx](../../../src/App.tsx)) renders from that snapshot and sends via a `sendSocketEvent(type, data)` wrapper. Shared types live in [src/types.ts](../../../src/types.ts).

## When to use
- Adding a new realtime action (new message type end-to-end).
- Debugging desync, baton handoff, queue, or playback issues.
- Touching the audio upload / proxy REST endpoints.

## RoomState (server, in-memory)
```
RoomState {
  id, name, isPrivate, pin?, hostId
  members:        Map<userId, RoomMember>
  pendingMembers: Map<userId, PendingMember>   // private-room join requests
  baton: { currentOwnerId, currentOwnerName, acquiredAt, queue: [{userId,userName,avatar,requestedAt}] }
  playback: { currentSong, isPlaying, currentTime, updatedAt, duration, updatedBy, masterVolume? }
  masterQueue:  SongItem[]      // shared; any member may add
  isQueueLocked: boolean        // circular-buffer mode
  playlists:    PlaylistGroup[]
  chat:         ChatMessage[]   // last ~50
}
```
`SongItem` = YouTube `videoId` OR direct `sourceUrl` (stream/URL) OR an uploaded file under `/audio-uploads/`.

## Message types
Client → Server (mutate state, then broadcast):

| Type | Purpose | Gate |
|------|---------|------|
| `room:join` | Join/create room, auth init | — |
| `room:approve_member` / `room:reject_member` | Handle pending join | host |
| `room:remove_member` / `room:delete` | Kick member / delete room | host |
| `baton:request` / `baton:cancel_request` | Enter/leave FIFO baton queue | — |
| `baton:pass_next` / `baton:release` | Hand to next / give up baton | baton owner |
| `baton:claim` | Take an orphaned/open baton | — |
| `playback:update` | Song, play/pause, seek, master volume | baton owner |
| `queue:add_song` | Add to master queue (dedupe) | — |
| `queue:remove_song` / `queue:reorder` | Edit queue (blocked if locked) | baton owner |
| `queue:next_track` | Skip; if locked, wrap played song to back | baton owner |
| `queue:toggle_lock` | Toggle circular-buffer mode | baton owner |
| `playlist:create` / `playlist:load` / `playlist:delete` | Manage saved playlists | — |
| `chat:send` | Text message or reaction emoji | — |

Server → Client:

| Type | Purpose |
|------|---------|
| `room:sync` | Full room-state snapshot (primary channel) |
| `room:pending_approval` | Private room: awaiting host approval |
| `notification:toast` | Targeted in-app toast |
| `chat:new` | New chat/reaction broadcast |

## Baton rules
- Only the baton owner drives playback and queue mutations. Enforce **server-side**, not just in the UI.
- Baton queue is strictly FIFO — first `baton:request` is next in line.
- A solo member (room size ≤ 1) and the first joiner auto-hold the baton.
- If the owner disconnects/goes offline, the baton becomes claimable (`baton:claim`).

## Playback sync
Clients converge using `playback.updatedAt` + local elapsed-time math, with the existing ~45ms latency compensation. When changing playback, always set `updatedAt`, `updatedBy`, and broadcast so followers recompute their position. Do not drive followers from raw client clocks.

## Queue behavior
- **Dedupe** on add by `videoId`, else `sourceUrl`, else `title+artist`.
- **Lock (circular buffer):** when locked, `queue:next_track` moves the played song to the back instead of removing it; block remove/reorder.

## REST endpoints
- `POST /api/audio-upload` — multer upload (mp3/wav/ogg/flac/webm), returns `{ url, filename, mimeType, size }`, stored in `public/audio-uploads/`.
- `GET /api/proxy-audio?url=<encoded>` — stream external audio (CORS bypass for mobile).
- `GET /audio-uploads/:filename` — serve uploads with correct Content-Type + range headers.

## Adding a new message type — checklist
1. Extend `RoomState` (server) and shared types in [src/types.ts](../../../src/types.ts).
2. Add the `type` handler in [server.ts](../../../server.ts): validate baton/host gating → mutate state → broadcast `room:sync`.
3. Client: send with `sendSocketEvent(type, data)`; render from synced `roomData`.
4. Run `npm run lint` (tsc `--noEmit`); verify manually with `npm run dev` (no automated tests exist).
5. Do not add persistence; keep state in-memory unless explicitly requested.
