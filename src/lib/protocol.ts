// Baton Audio Sync — WebSocket protocol contract.
// This is the wire format shared by every client (web, iOS, Android, or any future
// native app) and the Node server. Event name values are the literal strings sent on
// the socket; import these constants instead of hardcoding strings so client and
// server can never drift.

// Client -> Server events.
export const CLIENT_EVENTS = {
  ROOM_JOIN: 'room:join',
  ROOM_APPROVE_MEMBER: 'room:approve_member',
  ROOM_REJECT_MEMBER: 'room:reject_member',
  ROOM_REMOVE_MEMBER: 'room:remove_member',
  ROOM_DELETE: 'room:delete',
  BATON_REQUEST: 'baton:request',
  BATON_CANCEL_REQUEST: 'baton:cancel_request',
  BATON_PASS_NEXT: 'baton:pass_next',
  BATON_RELEASE: 'baton:release',
  BATON_CLAIM: 'baton:claim',
  PLAYBACK_UPDATE: 'playback:update',
  QUEUE_ADD_SONG: 'queue:add_song',
  QUEUE_REMOVE_SONG: 'queue:remove_song',
  QUEUE_REORDER: 'queue:reorder',
  QUEUE_NEXT_TRACK: 'queue:next_track',
  QUEUE_TOGGLE_LOCK: 'queue:toggle_lock',
  PLAYLIST_CREATE: 'playlist:create',
  PLAYLIST_LOAD: 'playlist:load',
  PLAYLIST_DELETE: 'playlist:delete',
  CHAT_SEND: 'chat:send',
} as const;

export type ClientEventType = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];

// Server -> Client events.
export const SERVER_EVENTS = {
  ROOM_SYNC: 'room:sync',
  ROOM_PENDING_APPROVAL: 'room:pending_approval',
  ROOM_REMOVED: 'room:removed',
  ROOM_DELETED: 'room:deleted',
  NOTIFICATION_TOAST: 'notification:toast',
  CHAT_NEW: 'chat:new',
  ERROR: 'error',
} as const;

export type ServerEventType = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];

// Payload for a notification:toast message.
export interface ToastPayload {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

// Minimal identity a client attaches to every outbound message.
export interface MessageUser {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

// Envelope a client sends to the server.
export interface ClientMessage<T = unknown> {
  type: ClientEventType;
  roomId: string;
  user: MessageUser;
  data?: T;
}
