# Copilot customizations — Baton Audio Sync

This folder holds Copilot / VS Code agent customizations for the **Baton Audio Sync** repo — a real-time synchronized group music player (React web client + Express/`ws` server + Expo WebView mobile shell).

## What's here

| File | Type | Purpose |
|------|------|---------|
| [copilot-instructions.md](copilot-instructions.md) | Repo instructions | Always-on conventions: three-layer architecture, non-negotiable realtime invariants, styling/state conventions, and how to verify changes. |
| [instructions/mobile.instructions.md](instructions/mobile.instructions.md) | Scoped instructions (`applyTo: mobile/**`) | Expo/EAS build commands and the "WebView shell, not a second implementation" rule for the Android app. |
| [agents/baton-dev.agent.md](agents/baton-dev.agent.md) | Custom agent | Full-stack feature developer that knows the baton mechanic, WebSocket sync model, and cross-layer conventions. Enforces the app's realtime invariants (server owns state, baton gates control, playback sync via timestamps). |
| [skills/baton-realtime-protocol/SKILL.md](skills/baton-realtime-protocol/SKILL.md) | Skill | On-demand reference for the WebSocket message protocol, `RoomState` shape, baton/queue rules, and the end-to-end checklist for adding a new realtime message type. |

## How to use

- **Custom agent:** pick **Baton Dev** from the agent selector in Chat, or let it be delegated automatically when a request matches its description (baton, room sync, queues, playback sync, audio sources, the server, or the mobile shell).
- **Skill:** loads automatically when a task touches the client↔server boundary, or invoke it explicitly by typing `/baton-realtime-protocol` in Chat.

## Key invariants these encode
- The **server is the single source of truth**; clients send events and the server broadcasts a full `room:sync` snapshot. State is in-memory and ephemeral (no database).
- The **baton** (FIFO DJ token) gates all playback and queue control — enforced server-side.
- **Playback stays in sync** via `playback.updatedAt` + client elapsed-time math with latency compensation.
- The **Expo app is a WebView shell**, not a second implementation of features.

## Extending these customizations
Consider adding next:
- A deployment/hosting skill once a server hosting strategy is chosen (WebSockets required, `wss://`).
- A PR/review agent (read-only) that audits baton and host-permission checks before merge.
