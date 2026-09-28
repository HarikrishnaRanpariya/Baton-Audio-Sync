import { describe, it, expect } from 'vitest';
import { CLIENT_EVENTS, SERVER_EVENTS } from './protocol';

// These strings are the wire format shared with every client and the server.
// Changing a value is a breaking protocol change, so pin them here.
describe('protocol wire values', () => {
  it('client event names are stable', () => {
    expect(CLIENT_EVENTS).toEqual({
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
    });
  });

  it('server event names are stable', () => {
    expect(SERVER_EVENTS).toEqual({
      ROOM_SYNC: 'room:sync',
      ROOM_PENDING_APPROVAL: 'room:pending_approval',
      ROOM_REMOVED: 'room:removed',
      ROOM_DELETED: 'room:deleted',
      NOTIFICATION_TOAST: 'notification:toast',
      CHAT_NEW: 'chat:new',
      ERROR: 'error',
    });
  });

  it('every event value is unique across client and server', () => {
    const all = [...Object.values(CLIENT_EVENTS), ...Object.values(SERVER_EVENTS)];
    expect(new Set(all).size).toBe(all.length);
  });
});
