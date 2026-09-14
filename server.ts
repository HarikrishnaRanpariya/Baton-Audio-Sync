import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

interface ClientSocket extends WebSocket {
  roomId?: string;
  userId?: string;
  userName?: string;
  isAlive?: boolean;
}

interface RoomState {
  id: string;
  name: string;
  isPrivate: boolean;
  pin?: string;
  hostId: string;
  hostName: string;
  createdAt: number;
  members: Map<string, {
    id: string;
    name: string;
    avatar: string;
    color: string;
    isHost: boolean;
    joinedAt: number;
    status: 'active' | 'pending';
  }>;
  pendingMembers: Map<string, {
    id: string;
    name: string;
    avatar: string;
    color: string;
    joinedAt: number;
  }>;
  baton: {
    currentOwnerId: string | null;
    currentOwnerName: string | null;
    acquiredAt: number | null;
    queue: Array<{
      userId: string;
      userName: string;
      avatar: string;
      requestedAt: number;
    }>;
  };
  playback: {
    currentSong: {
      id: string;
      videoId: string;
      title: string;
      artist: string;
      thumbnail: string;
      duration: number;
      addedBy: string;
      addedByName: string;
      sourceUrl?: string;
      sourceType?: string;
    } | null;
    isPlaying: boolean;
    currentTime: number;
    updatedAt: number;
    duration: number;
    updatedBy: string;
    masterVolume?: number;
  };
  playlist: Array<any>;
  masterQueue: Array<any>;
  isQueueLocked: boolean;
  playlists: Array<{
    id: string;
    title: string;
    createdAt: number;
    createdBy: string;
    createdByName: string;
    songs: Array<any>;
  }>;
  activePlaylistId?: string;
  chat: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    type: 'chat' | 'system' | 'baton' | 'reaction';
    timestamp: number;
  }>;
}

const rooms = new Map<string, RoomState>();

// Helper to seed a default demo room
function getOrCreateRoom(roomId: string, name?: string, isPrivate = false, pin?: string, host?: { id: string; name: string }): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    const hostId = host?.id || null;
    const hostName = host?.name || null;
    room = {
      id: roomId,
      name: name || `Vibe Lounge #${roomId}`,
      isPrivate,
      pin,
      hostId: hostId || 'host-1',
      hostName: hostName || 'Group Host',
      createdAt: Date.now(),
      members: new Map(),
      pendingMembers: new Map(),
      baton: {
        currentOwnerId: hostId,
        currentOwnerName: hostName,
        acquiredAt: hostId ? Date.now() : null,
        queue: [],
      },
      playback: {
        currentSong: {
          id: 'song-1',
          videoId: '4NRXx6U8ABQ',
          title: 'Blinding Lights',
          artist: 'The Weeknd',
          thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
          duration: 200,
          addedBy: hostId,
          addedByName: hostName,
        },
        isPlaying: false,
        currentTime: 0,
        updatedAt: Date.now(),
        duration: 200,
        updatedBy: hostId,
        masterVolume: 80,
      },
      playlist: [
        {
          id: 'song-1',
          videoId: '4NRXx6U8ABQ',
          title: 'Blinding Lights',
          artist: 'The Weeknd',
          thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
          duration: 200,
          addedBy: hostId,
          addedByName: hostName,
        },
        {
          id: 'song-2',
          videoId: 'TUVcZfQe-Kw',
          title: 'Levitating',
          artist: 'Dua Lipa',
          thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
          duration: 203,
          addedBy: hostId,
          addedByName: hostName,
        },
        {
          id: 'song-3',
          videoId: 'kJQP7kiw5Fk',
          title: 'Despacito',
          artist: 'Luis Fonsi ft. Daddy Yankee',
          thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
          duration: 228,
          addedBy: hostId,
          addedByName: hostName,
        }
      ],
      masterQueue: [
        {
          id: 'song-2',
          videoId: 'TUVcZfQe-Kw',
          title: 'Levitating',
          artist: 'Dua Lipa',
          thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
          duration: 203,
          addedBy: hostId || 'host-1',
          addedByName: hostName || 'DJ',
        },
        {
          id: 'song-3',
          videoId: 'kJQP7kiw5Fk',
          title: 'Despacito',
          artist: 'Luis Fonsi ft. Daddy Yankee',
          thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
          duration: 228,
          addedBy: hostId || 'host-1',
          addedByName: hostName || 'DJ',
        }
      ],
      isQueueLocked: false,
      playlists: [
        {
          id: 'pl-default-1',
          title: 'Lounge Vibe Anthems',
          createdAt: Date.now(),
          createdBy: hostId || 'host-1',
          createdByName: hostName || 'DJ',
          songs: [
            {
              id: 'pl-s-1',
              videoId: '4NRXx6U8ABQ',
              title: 'Blinding Lights',
              artist: 'The Weeknd',
              thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
              duration: 200,
              addedBy: hostId || 'host-1',
              addedByName: hostName || 'DJ',
            },
            {
              id: 'pl-s-2',
              videoId: 'TUVcZfQe-Kw',
              title: 'Levitating',
              artist: 'Dua Lipa',
              thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
              duration: 203,
              addedBy: hostId || 'host-1',
              addedByName: hostName || 'DJ',
            },
            {
              id: 'pl-s-3',
              videoId: 'jfKfPfyJRdk',
              title: 'Lofi Hip Hop Radio',
              artist: 'Lofi Girl',
              thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
              duration: 3600,
              addedBy: hostId || 'host-1',
              addedByName: hostName || 'DJ',
            }
          ],
        }
      ],
      activePlaylistId: 'pl-default-1',
      chat: [
        {
          id: 'msg-init',
          userId: 'system',
          userName: 'System',
          text: `Welcome to ${name || roomId}! Anyone can add songs to the Master Queue. Songs play continuously in order.`,
          type: 'system',
          timestamp: Date.now(),
        },
      ],
    };
    rooms.set(roomId, room);
  }
  return room;
}

// Seed default popular room
getOrCreateRoom('groove-402', 'Neon Soundwave (Public Lounge)');

function serializeRoom(room: RoomState) {
  return {
    id: room.id,
    name: room.name,
    isPrivate: room.isPrivate,
    hasPin: Boolean(room.pin),
    hostId: room.hostId,
    hostName: room.hostName,
    createdAt: room.createdAt,
    members: Array.from(room.members.values()),
    pendingMembers: Array.from(room.pendingMembers.values()),
    baton: room.baton,
    playback: room.playback,
    playlist: room.playlist,
    masterQueue: room.masterQueue || [],
    isQueueLocked: Boolean(room.isQueueLocked),
    playlists: room.playlists || [],
    activePlaylistId: room.activePlaylistId,
    chat: room.chat.slice(-50),
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  const uploadDir = path.join(process.cwd(), 'public', 'audio-uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
      const cleanName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, cleanName);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      const isAudioMime = file.mimetype.startsWith('audio/');
      const isAudioExtension = /\.(mp3|m4a|aac|wav|ogg|oga|flac|webm)$/i.test(file.originalname);
      callback(null, isAudioMime || isAudioExtension);
    },
  });

  app.use('/audio-uploads', express.static(uploadDir, {
    setHeaders: (res, filePath) => {
      res.setHeader('Accept-Ranges', 'bytes');
      if (filePath.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
      } else if (filePath.endsWith('.wav')) {
        res.setHeader('Content-Type', 'audio/wav');
      } else if (filePath.endsWith('.ogg') || filePath.endsWith('.oga')) {
        res.setHeader('Content-Type', 'audio/ogg');
      } else if (filePath.endsWith('.m4a') || filePath.endsWith('.aac')) {
        res.setHeader('Content-Type', 'audio/mp4');
      } else if (filePath.endsWith('.flac')) {
        res.setHeader('Content-Type', 'audio/flac');
      }
    },
  }));

  app.post('/api/audio-upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'Only MP3, M4A, AAC, WAV, OGG, FLAC, or WEBM audio files are supported.' });
      return;
    }
    const relativeUrl = `/audio-uploads/${req.file.filename}`;
    res.json({
      url: relativeUrl,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  });

  // Audio Stream Proxy (allows S25 and mobile browsers to stream online audio without CORS issues)
  app.get('/api/proxy-audio', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      res.status(400).json({ error: 'Valid HTTP/HTTPS audio URL required' });
      return;
    }
    try {
      const response = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
        },
      });
      if (!response.ok) {
        res.status(response.status).json({ error: 'Failed to fetch audio stream' });
        return;
      }
      res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache');
      if (response.body) {
        const { Readable } = await import('stream');
        // @ts-ignore
        Readable.fromWeb(response.body).pipe(res);
      } else {
        res.status(500).end();
      }
    } catch (err: any) {
      console.warn('Audio proxy fetch error handled:', err?.message || err);
      res.status(502).json({ error: 'Could not proxy audio stream' });
    }
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  function broadcastRoom(roomId: string, message: any, excludeWs?: WebSocket) {
    const dataStr = JSON.stringify(message);
    wss.clients.forEach((client) => {
      const clientSock = client as ClientSocket;
      if (clientSock.readyState === WebSocket.OPEN && clientSock.roomId === roomId) {
        if (!excludeWs || clientSock !== excludeWs) {
          clientSock.send(dataStr);
        }
      }
    });
  }

  wss.on('connection', (ws: ClientSocket, req) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        const { type, roomId, user, data } = payload;

        if (type === 'room:join') {
          const room = getOrCreateRoom(roomId, undefined, false, undefined, user);
          ws.roomId = roomId;
          ws.userId = user.id;
          ws.userName = user.name;

          // Check if private and not host
          if (room.isPrivate && room.hostId !== user.id && !room.members.has(user.id)) {
            // Check pin if provided
            if (payload.pin && room.pin && payload.pin === room.pin) {
              // PIN match! Auto approve
              room.members.set(user.id, {
                id: user.id,
                name: user.name,
                avatar: user.avatar || '🎧',
                color: user.color || '#f59e0b',
                isHost: user.id === room.hostId,
                joinedAt: Date.now(),
                status: 'active',
              });
            } else {
              // Add to pending requests
              room.pendingMembers.set(user.id, {
                id: user.id,
                name: user.name,
                avatar: user.avatar || '🎧',
                color: user.color || '#f59e0b',
                joinedAt: Date.now(),
              });
              ws.send(JSON.stringify({
                type: 'room:pending_approval',
                data: { roomId, message: 'Request sent to group host for approval.' },
              }));
              broadcastRoom(roomId, {
                type: 'room:sync',
                data: serializeRoom(room),
              });
              return;
            }
          } else {
            // Normal join
            room.members.set(user.id, {
              id: user.id,
              name: user.name,
              avatar: user.avatar || '🎧',
              color: user.color || '#f59e0b',
              isHost: user.id === room.hostId,
              joinedAt: Date.now(),
              status: 'active',
            });
          }

          // If room had a dummy host or host is not in room members, make this user the host!
          if (room.hostId === 'host-1' || !room.members.has(room.hostId)) {
            room.hostId = user.id;
            room.hostName = user.name;
            const currentMem = room.members.get(user.id);
            if (currentMem) currentMem.isHost = true;
          }

          // Baton Assignment Logic:
          // If no baton owner, OR the current baton owner is NOT in the room members (orphaned/ghost), OR this user is the only member in the room:
          const isOwnerInRoom = room.baton.currentOwnerId && room.members.has(room.baton.currentOwnerId);
          if (!isOwnerInRoom || room.members.size === 1) {
            room.baton.currentOwnerId = user.id;
            room.baton.currentOwnerName = user.name;
            room.baton.acquiredAt = Date.now();
            room.baton.queue = room.baton.queue.filter((q) => q.userId !== user.id);
          }

          room.chat.push({
            id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId: 'system',
            userName: 'System',
            text: `${user.name} joined the audio stream`,
            type: 'system',
            timestamp: Date.now(),
          });

          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Host approves pending member
        if (type === 'room:approve_member') {
          const room = rooms.get(roomId);
          if (!room) return;
          const { targetUserId } = data;
          const pending = room.pendingMembers.get(targetUserId);
          if (pending) {
            room.pendingMembers.delete(targetUserId);
            room.members.set(targetUserId, {
              ...pending,
              isHost: false,
              status: 'active',
            });
            room.chat.push({
              id: `sys-${Date.now()}`,
              userId: 'system',
              userName: 'System',
              text: `${pending.name}'s request to join was approved`,
              type: 'system',
              timestamp: Date.now(),
            });
            broadcastRoom(roomId, {
              type: 'room:sync',
              data: serializeRoom(room),
            });
          }
        }

        // Host rejects pending member
        if (type === 'room:reject_member') {
          const room = rooms.get(roomId);
          if (!room) return;
          const { targetUserId } = data;
          room.pendingMembers.delete(targetUserId);
          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Host-only member removal
        if (type === 'room:remove_member') {
          const room = rooms.get(roomId);
          if (!room || room.hostId !== user.id) return;
          const targetUserId = data?.targetUserId;
          if (!targetUserId || targetUserId === room.hostId) return;
          room.members.delete(targetUserId);
          room.pendingMembers.delete(targetUserId);
          room.baton.queue = room.baton.queue.filter((q) => q.userId !== targetUserId);
          if (room.baton.currentOwnerId === targetUserId) {
            room.baton.currentOwnerId = null;
            room.baton.currentOwnerName = null;
            room.baton.acquiredAt = null;
          }
          wss.clients.forEach((client) => {
            const target = client as ClientSocket;
            if (target.userId === targetUserId && target.readyState === WebSocket.OPEN) {
              target.send(JSON.stringify({ type: 'room:removed', message: 'You were removed from this group by the host.' }));
              target.close();
            }
          });
          broadcastRoom(roomId, { type: 'room:sync', data: serializeRoom(room) });
        }

        // Host-only group deletion
        if (type === 'room:delete') {
          const room = rooms.get(roomId);
          if (!room || room.hostId !== user.id) return;
          rooms.delete(roomId);
          wss.clients.forEach((client) => {
            const target = client as ClientSocket;
            if (target.roomId === roomId && target.readyState === WebSocket.OPEN) {
              target.send(JSON.stringify({ type: 'room:deleted', message: 'This group was deleted by the host.' }));
              target.close();
            }
          });
        }

        // Ask for Baton (FIFO queue)
        if (type === 'baton:request') {
          const room = rooms.get(roomId);
          if (!room) return;

          // Check if already in queue or currently has baton
          if (room.baton.currentOwnerId === user.id) {
            return;
          }

          const isOwnerInRoom = room.baton.currentOwnerId && room.members.has(room.baton.currentOwnerId);

          // If the user is the only member in the room, OR the current owner is inactive/orphaned, OR nobody holds the baton:
          if (room.members.size <= 1 || !isOwnerInRoom) {
            room.baton.currentOwnerId = user.id;
            room.baton.currentOwnerName = user.name;
            room.baton.acquiredAt = Date.now();
            room.baton.queue = room.baton.queue.filter((q) => q.userId !== user.id);

            room.chat.push({
              id: `baton-grant-${Date.now()}`,
              userId: 'system',
              userName: 'System',
              text: `Baton passed to ${user.name}!`,
              type: 'baton',
              timestamp: Date.now(),
            });

            broadcastRoom(roomId, {
              type: 'room:sync',
              data: serializeRoom(room),
            });
            return;
          }

          const alreadyQueued = room.baton.queue.some((q) => q.userId === user.id);
          if (!alreadyQueued) {
            room.baton.queue.push({
              userId: user.id,
              userName: user.name,
              avatar: user.avatar || '🎧',
              requestedAt: Date.now(),
            });

            room.chat.push({
              id: `baton-${Date.now()}`,
              userId: user.id,
              userName: user.name,
              text: `${user.name} asked for the baton (Queue #${room.baton.queue.length})`,
              type: 'baton',
              timestamp: Date.now(),
            });

            broadcastRoom(roomId, {
              type: 'room:sync',
              data: serializeRoom(room),
            });
          }
        }

        // Cancel Baton request
        if (type === 'baton:cancel_request') {
          const room = rooms.get(roomId);
          if (!room) return;
          room.baton.queue = room.baton.queue.filter((q) => q.userId !== user.id);
          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Pass Baton to Next (FIFO)
        if (type === 'baton:pass_next') {
          const room = rooms.get(roomId);
          if (!room) return;

          const isOwnerInRoom = room.baton.currentOwnerId && room.members.has(room.baton.currentOwnerId);
          // Only current owner, room host, or anyone if previous owner is not in room can pass
          const canPass = room.baton.currentOwnerId === user.id || room.hostId === user.id || !isOwnerInRoom;
          if (canPass) {
            const previousOwner = room.baton.currentOwnerName;
            // Clean up queue of anyone who disconnected
            room.baton.queue = room.baton.queue.filter((q) => room.members.has(q.userId));

            if (room.baton.queue.length > 0) {
              const nextRequester = room.baton.queue.shift()!;
              room.baton.currentOwnerId = nextRequester.userId;
              room.baton.currentOwnerName = nextRequester.userName;
              room.baton.acquiredAt = Date.now();

              room.chat.push({
                id: `baton-pass-${Date.now()}`,
                userId: 'system',
                userName: 'System',
                text: `${previousOwner || 'Host'} passed the baton to ${nextRequester.userName} (First-Come First-Served)`,
                type: 'baton',
                timestamp: Date.now(),
              });
            } else if (room.members.size === 1) {
              // If only 1 person in the room, they retain/get the baton
              const onlyMember = Array.from(room.members.values())[0];
              room.baton.currentOwnerId = onlyMember.id;
              room.baton.currentOwnerName = onlyMember.name;
              room.baton.acquiredAt = Date.now();
            } else {
              // Queue is empty, baton becomes open
              room.baton.currentOwnerId = null;
              room.baton.currentOwnerName = null;
              room.baton.acquiredAt = null;

              room.chat.push({
                id: `baton-release-${Date.now()}`,
                userId: 'system',
                userName: 'System',
                text: `${previousOwner || 'Previous holder'} released the baton. Anyone can claim it now!`,
                type: 'baton',
                timestamp: Date.now(),
              });
            }

            broadcastRoom(roomId, {
              type: 'room:sync',
              data: serializeRoom(room),
            });
          }
        }

        // Explicitly release the baton when nobody is waiting.
        if (type === 'baton:release') {
          const room = rooms.get(roomId);
          if (!room || room.baton.currentOwnerId !== user.id) return;

          room.baton.currentOwnerId = null;
          room.baton.currentOwnerName = null;
          room.baton.acquiredAt = null;
          room.chat.push({
            id: `baton-release-${Date.now()}`,
            userId: 'system',
            userName: 'System',
            text: `${user.name} released the baton. Anyone can claim it now!`,
            type: 'baton',
            timestamp: Date.now(),
          });
          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Claim open or orphaned baton
        if (type === 'baton:claim') {
          const room = rooms.get(roomId);
          if (!room) return;

          const isOwnerInRoom = room.baton.currentOwnerId && room.members.has(room.baton.currentOwnerId);
          // User can claim if: no owner, current owner is not active in room, room has only 1 member, or user is already owner
          if (!isOwnerInRoom || room.members.size <= 1 || room.baton.currentOwnerId === user.id) {
            room.baton.currentOwnerId = user.id;
            room.baton.currentOwnerName = user.name;
            room.baton.acquiredAt = Date.now();
            room.baton.queue = room.baton.queue.filter((q) => q.userId !== user.id);

            room.chat.push({
              id: `baton-claim-${Date.now()}`,
              userId: user.id,
              userName: user.name,
              text: `${user.name} claimed the baton!`,
              type: 'baton',
              timestamp: Date.now(),
            });

            broadcastRoom(roomId, {
              type: 'room:sync',
              data: serializeRoom(room),
            });
          }
        }

        // Playback Update (Play, Pause, Seek, Song selection)
        if (type === 'playback:update') {
          const room = rooms.get(roomId);
          if (!room) return;

          const isOwnerInRoom = room.baton.currentOwnerId && room.members.has(room.baton.currentOwnerId);
          // Authorization: Only the current baton holder, or room host if baton is open, or sole member in room
          const isAllowed =
            room.baton.currentOwnerId === user.id ||
            room.members.size <= 1 ||
            !isOwnerInRoom ||
            (room.baton.currentOwnerId === null && room.hostId === user.id);

          if (!isAllowed) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Baton required: You must hold the baton to control playback.',
            }));
            return;
          }

          // If baton was orphaned or user is sole member, make them the official baton holder
          if (room.baton.currentOwnerId !== user.id && (!isOwnerInRoom || room.members.size <= 1)) {
            room.baton.currentOwnerId = user.id;
            room.baton.currentOwnerName = user.name;
            room.baton.acquiredAt = Date.now();
          }

          // Update playback state
          const { song, currentSong, isPlaying, currentTime, duration } = data;
          const activeSong = song || currentSong;
          if (activeSong) {
            room.playback.currentSong = activeSong;
            // Add to playlist history if not already there
            const songMatchesHistory = (p: any) => {
              if (activeSong.videoId && p.videoId && p.videoId.trim() === activeSong.videoId.trim()) return true;
              if (activeSong.sourceUrl && p.sourceUrl && p.sourceUrl.trim() === activeSong.sourceUrl.trim()) return true;
              if (activeSong.title && p.title && activeSong.title.trim().toLowerCase() === p.title.trim().toLowerCase()) return true;
              return false;
            };
            if (!room.playlist.some(songMatchesHistory)) {
              room.playlist.push(activeSong);
            }
          }
          if (typeof isPlaying === 'boolean') {
            room.playback.isPlaying = isPlaying;
          }
          if (typeof currentTime === 'number') {
            room.playback.currentTime = currentTime;
          }
          if (typeof duration === 'number') {
            room.playback.duration = duration;
          }
          if (typeof data.masterVolume === 'number') {
            room.playback.masterVolume = Math.max(0, Math.min(100, Math.round(data.masterVolume)));
          }
          room.playback.updatedAt = Date.now();
          room.playback.updatedBy = user.id;

          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Master Queue: Add song by ANY group member with duplicate prevention
        if (type === 'queue:add_song') {
          const room = rooms.get(roomId);
          if (!room) return;
          const song = data?.song;
          if (!song || !song.title) return;

          // Duplicate verification: Check against current playing song and master queue
          const normTitle = (song.title || '').trim().toLowerCase();
          const normArtist = (song.artist || '').trim().toLowerCase();
          const songVideoId = (song.videoId || '').trim();
          const songSourceUrl = (song.sourceUrl || '').trim();

          const isSongMatch = (other: any) => {
            if (!other) return false;
            if (songVideoId && other.videoId && other.videoId.trim() === songVideoId) return true;
            if (songSourceUrl && other.sourceUrl && other.sourceUrl.trim() === songSourceUrl) return true;
            if (normTitle && other.title && other.title.trim().toLowerCase() === normTitle) {
              if (normArtist && other.artist && other.artist.trim().toLowerCase() === normArtist) {
                return true;
              }
            }
            return false;
          };

          const isDuplicateOfCurrent = Boolean(room.playback.currentSong && isSongMatch(room.playback.currentSong));
          const isDuplicateInQueue = room.masterQueue.some((q) => isSongMatch(q));

          if (isDuplicateOfCurrent || isDuplicateInQueue) {
            const reason = isDuplicateOfCurrent ? 'currently playing' : 'already part of the master queue';
            ws.send(JSON.stringify({
              type: 'notification:toast',
              data: {
                type: 'warning',
                title: 'Duplicate Track Ignored',
                message: `"${song.title}" is ${reason}!`,
              },
            }));
            return;
          }

          // Format new queued song item
          const newSongItem = {
            id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            videoId: song.videoId || '',
            sourceUrl: song.sourceUrl || '',
            sourceType: song.sourceType || (song.sourceUrl ? 'audio-url' : 'youtube'),
            title: song.title,
            artist: song.artist || 'Unknown Artist',
            thumbnail: song.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
            duration: song.duration || 210,
            addedBy: user.id,
            addedByName: user.name,
          };

          // If no song is playing right now, immediately start playback
          if (!room.playback.currentSong) {
            room.playback.currentSong = newSongItem;
            room.playback.isPlaying = true;
            room.playback.currentTime = 0;
            room.playback.duration = newSongItem.duration;
            room.playback.updatedAt = Date.now();
            room.playback.updatedBy = user.id;
          } else {
            room.masterQueue.push(newSongItem);
          }

          if (!room.playlist.some((p) => isSongMatch(p))) {
            room.playlist.push(newSongItem);
          }

          room.chat.push({
            id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            text: `queued "${newSongItem.title}" by ${newSongItem.artist}`,
            type: 'system',
            timestamp: Date.now(),
          });

          ws.send(JSON.stringify({
            type: 'notification:toast',
            data: {
              type: 'success',
              title: 'Added to Master Queue',
              message: `"${newSongItem.title}" added to queue #${room.masterQueue.length}`,
            },
          }));

          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Master Queue: Toggle Lock (Circular Buffer / Infinite Loop mode)
        if (type === 'queue:toggle_lock') {
          const room = rooms.get(roomId);
          if (!room) return;

          room.isQueueLocked = !room.isQueueLocked;

          room.chat.push({
            id: `lock-${Date.now()}`,
            userId: 'system',
            userName: 'System',
            text: room.isQueueLocked
              ? `🔒 Queue locked into Circular Buffer mode! Played songs cycle to the back and continue playing endlessly.`
              : `🔓 Queue unlocked. Songs will play once in order.`,
            type: 'system',
            timestamp: Date.now(),
          });

          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Master Queue: Remove song
        if (type === 'queue:remove_song') {
          const room = rooms.get(roomId);
          if (!room) return;
          if (room.isQueueLocked) {
            ws.send(JSON.stringify({
              type: 'notification:toast',
              data: {
                type: 'warning',
                title: 'Queue is Locked',
                message: 'Unlock queue to remove tracks from circular buffer.',
              },
            }));
            return;
          }
          const { songId } = data || {};
          room.masterQueue = room.masterQueue.filter((s) => s.id !== songId);
          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Master Queue: Reorder songs
        if (type === 'queue:reorder') {
          const room = rooms.get(roomId);
          if (!room) return;
          const { fromIndex, toIndex } = data || {};
          if (
            typeof fromIndex === 'number' &&
            typeof toIndex === 'number' &&
            fromIndex >= 0 &&
            fromIndex < room.masterQueue.length &&
            toIndex >= 0 &&
            toIndex < room.masterQueue.length
          ) {
            const [moved] = room.masterQueue.splice(fromIndex, 1);
            room.masterQueue.splice(toIndex, 0, moved);
            broadcastRoom(roomId, {
              type: 'room:sync',
              data: serializeRoom(room),
            });
          }
        }

        // Continuous Queue Advance: Next Track (handles circular buffer)
        if (type === 'queue:next_track' || type === 'playback:next') {
          const room = rooms.get(roomId);
          if (!room) return;

          const isOwnerInRoom = room.baton.currentOwnerId && room.members.has(room.baton.currentOwnerId);
          const canAdvance = room.baton.currentOwnerId === user.id || room.members.size <= 1 || !isOwnerInRoom;
          if (!canAdvance) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Baton required: only the baton holder can skip to the next song.',
            }));
            return;
          }

          const currentSong = room.playback.currentSong;

          // Circular Buffer: If queue is locked, wrap the played song around to the back!
          if (room.isQueueLocked && currentSong) {
            room.masterQueue.push({
              ...currentSong,
              id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            });
          }

          if (room.masterQueue.length > 0) {
            const nextSong = room.masterQueue.shift()!;
            room.playback.currentSong = nextSong;
            room.playback.isPlaying = true;
            room.playback.currentTime = 0;
            room.playback.duration = nextSong.duration || 210;
            room.playback.updatedAt = Date.now();
            room.playback.updatedBy = user.id;

            room.chat.push({
              id: `sys-next-${Date.now()}`,
              userId: 'system',
              userName: 'System',
              text: `Now playing: "${nextSong.title}" by ${nextSong.artist}${room.isQueueLocked ? ' (Circular Loop ↻)' : ''}`,
              type: 'system',
              timestamp: Date.now(),
            });
          } else {
            if (currentSong && room.isQueueLocked) {
              room.playback.currentTime = 0;
              room.playback.updatedAt = Date.now();
            }
          }

          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Group Playlists: Create named song list
        if (type === 'playlist:create') {
          const room = rooms.get(roomId);
          if (!room) return;
          const { title, songs } = data || {};
          const playlistTitle = (title || 'Untitled Playlist').trim();
          const newPlaylist = {
            id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: playlistTitle,
            createdAt: Date.now(),
            createdBy: user.id,
            createdByName: user.name,
            songs: Array.isArray(songs) ? songs : [],
          };
          room.playlists.push(newPlaylist);

          room.chat.push({
            id: `pl-create-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            text: `created playlist "${playlistTitle}" with ${newPlaylist.songs.length} songs`,
            type: 'system',
            timestamp: Date.now(),
          });

          ws.send(JSON.stringify({
            type: 'notification:toast',
            data: {
              type: 'success',
              title: 'Playlist Created',
              message: `"${playlistTitle}" saved with ${newPlaylist.songs.length} songs.`,
            },
          }));

          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Group Playlists: Load playlist into master queue
        if (type === 'playlist:load') {
          const room = rooms.get(roomId);
          if (!room) return;
          const { playlistId, mode } = data || {}; // mode: 'replace' | 'append'
          const target = room.playlists.find((p) => p.id === playlistId);
          if (!target) return;

          room.activePlaylistId = playlistId;

          let added = 0;
          let duplicates = 0;

          const matchSongInList = (s: any, list: any[]) => {
            const sVid = (s.videoId || '').trim();
            const sUrl = (s.sourceUrl || '').trim();
            const sTitle = (s.title || '').trim().toLowerCase();
            return list.some((item) => {
              if (sVid && item.videoId && item.videoId.trim() === sVid) return true;
              if (sUrl && item.sourceUrl && item.sourceUrl.trim() === sUrl) return true;
              if (sTitle && item.title && item.title.trim().toLowerCase() === sTitle) return true;
              return false;
            });
          };

          if (mode === 'replace') {
            const newQ: any[] = [];
            const curSong = room.playback.currentSong;
            for (const s of target.songs) {
              const isCur = curSong && matchSongInList(s, [curSong]);
              if (isCur) {
                duplicates++;
                continue;
              }
              if (!matchSongInList(s, newQ)) {
                newQ.push({
                  ...s,
                  id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  addedBy: user.id,
                  addedByName: user.name,
                });
                added++;
              } else {
                duplicates++;
              }
            }
            room.masterQueue = newQ;
            if (!room.playback.currentSong && room.masterQueue.length > 0) {
              room.playback.currentSong = room.masterQueue.shift()!;
              room.playback.isPlaying = true;
              room.playback.currentTime = 0;
              room.playback.updatedAt = Date.now();
            }
          } else {
            // Append with duplicate filtering against currentSong and masterQueue
            const curSong = room.playback.currentSong;
            for (const s of target.songs) {
              const isCur = curSong && matchSongInList(s, [curSong]);
              const inQ = matchSongInList(s, room.masterQueue);
              if (isCur || inQ) {
                duplicates++;
                continue;
              }
              room.masterQueue.push({
                ...s,
                id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                addedBy: user.id,
                addedByName: user.name,
              });
              added++;
            }
          }

          room.chat.push({
            id: `pl-load-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            text: `loaded playlist "${target.title}" into Master Queue (${added} added${duplicates > 0 ? `, ${duplicates} duplicates ignored` : ''})`,
            type: 'system',
            timestamp: Date.now(),
          });

          ws.send(JSON.stringify({
            type: 'notification:toast',
            data: {
              type: 'info',
              title: `Loaded ${target.title}`,
              message: `${added} songs added to queue${duplicates > 0 ? ` (${duplicates} duplicates ignored)` : ''}`,
            },
          }));

          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Group Playlists: Delete playlist
        if (type === 'playlist:delete') {
          const room = rooms.get(roomId);
          if (!room) return;
          const { playlistId } = data || {};
          room.playlists = room.playlists.filter((p) => p.id !== playlistId);
          broadcastRoom(roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }

        // Chat message or floating reaction
        if (type === 'chat:send') {
          const room = rooms.get(roomId);
          if (!room) return;

          const newMsg = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            text: data.text,
            type: data.type || 'chat',
            timestamp: Date.now(),
          };
          room.chat.push(newMsg);

          broadcastRoom(roomId, {
            type: 'chat:new',
            data: newMsg,
          });
        }
      } catch (e) {
        console.error('Socket message parse error:', e);
      }
    });

    ws.on('close', () => {
      if (ws.roomId && ws.userId) {
        const room = rooms.get(ws.roomId);
        if (room) {
          room.members.delete(ws.userId);
          // Filter queue to only active members
          room.baton.queue = room.baton.queue.filter((q) => q.userId !== ws.userId && room.members.has(q.userId));
          
          const isCurrentOwnerActive = room.baton.currentOwnerId && room.members.has(room.baton.currentOwnerId);

          // If the disconnected member was holding the baton, or current owner is now inactive:
          if (!isCurrentOwnerActive || room.baton.currentOwnerId === ws.userId) {
            if (room.baton.queue.length > 0) {
              const next = room.baton.queue.shift()!;
              room.baton.currentOwnerId = next.userId;
              room.baton.currentOwnerName = next.userName;
              room.baton.acquiredAt = Date.now();
              room.chat.push({
                id: `baton-auto-${Date.now()}`,
                userId: 'system',
                userName: 'System',
                text: `${ws.userName || 'Baton holder'} left. Baton passed to ${next.userName} (Next in line)`,
                type: 'baton',
                timestamp: Date.now(),
              });
            } else if (room.members.size === 1) {
              // Only 1 member left in the room - they automatically get the baton!
              const onlyMember = Array.from(room.members.values())[0];
              room.baton.currentOwnerId = onlyMember.id;
              room.baton.currentOwnerName = onlyMember.name;
              room.baton.acquiredAt = Date.now();
              room.chat.push({
                id: `baton-auto-${Date.now()}`,
                userId: 'system',
                userName: 'System',
                text: `Baton automatically assigned to ${onlyMember.name} (Sole member in room)`,
                type: 'baton',
                timestamp: Date.now(),
              });
            } else {
              room.baton.currentOwnerId = null;
              room.baton.currentOwnerName = null;
              room.baton.acquiredAt = null;
            }
          } else if (room.members.size === 1) {
            // Only 1 member remains in room, guarantee they have the baton
            const onlyMember = Array.from(room.members.values())[0];
            if (room.baton.currentOwnerId !== onlyMember.id) {
              room.baton.currentOwnerId = onlyMember.id;
              room.baton.currentOwnerName = onlyMember.name;
              room.baton.acquiredAt = Date.now();
            }
          }

          // If host left, assign host to first remaining active member
          if ((room.hostId === ws.userId || !room.members.has(room.hostId)) && room.members.size > 0) {
            const newHost = Array.from(room.members.values())[0];
            room.hostId = newHost.id;
            room.hostName = newHost.name;
            newHost.isHost = true;
          }

          broadcastRoom(ws.roomId, {
            type: 'room:sync',
            data: serializeRoom(room),
          });
        }
      }
    });
  });

  // REST API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // List public rooms
  app.get('/api/rooms', (req, res) => {
    const list = Array.from(rooms.values())
      .filter((r) => !r.isPrivate)
      .map((r) => ({
        id: r.id,
        name: r.name,
        membersCount: r.members.size,
        currentSong: r.playback.currentSong?.title || 'None',
        batonOwner: r.baton.currentOwnerName || 'Open',
      }));
    res.json(list);
  });

  // Create room endpoint
  app.post('/api/rooms/create', (req, res) => {
    const { name, isPrivate, pin, host } = req.body;
    const roomId = 'room-' + Math.random().toString(36).substring(2, 7);
    const room = getOrCreateRoom(roomId, name, Boolean(isPrivate), pin, host);
    res.json(serializeRoom(room));
  });

  // Get single room details
  app.get('/api/rooms/:roomId', (req, res) => {
    const room = rooms.get(req.params.roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(serializeRoom(room));
  });

  // AI Playlist Generator (Mood / Language / Country / Song Type)
  app.post('/api/ai/generate-playlist', async (req, res) => {
    const { mood = 'Chill', language = 'Any', country = 'Global', songType = 'Pop', count = 6 } = req.body || {};

    const fallbackCatalog = [
      { videoId: '4NRXx6U8ABQ', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80', mood: 'Energetic', language: 'English', songType: 'Pop' },
      { videoId: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio', artist: 'Lofi Girl', duration: 3600, thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80', mood: 'Chill', language: 'Instrumental', songType: 'Lo-Fi' },
      { videoId: 'TUVcZfQe-Kw', title: 'Levitating', artist: 'Dua Lipa', duration: 203, thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80', mood: 'Party', language: 'English', songType: 'Dance Pop' },
      { videoId: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', duration: 228, thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80', mood: 'Party', language: 'Spanish', songType: 'Latin' },
      { videoId: 'gdZLi9oWNZg', title: 'Dynamite', artist: 'BTS', duration: 199, thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80', mood: 'Upbeat', language: 'Korean', songType: 'K-Pop' },
      { videoId: 'Umhl_L70Zck', title: 'Kesariya', artist: 'Arijit Singh, Pritam', duration: 268, thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80', mood: 'Romantic', language: 'Hindi', songType: 'Bollywood' },
      { videoId: 'ALZHF5UqnU4', title: 'Alone', artist: 'Marshmello', duration: 198, thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80', mood: 'Focus', language: 'English', songType: 'Electronic' },
      { videoId: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', duration: 270, thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80', mood: 'Upbeat', language: 'English', songType: 'Funk' },
      { videoId: '7wtfhZwyrcc', title: 'Believer', artist: 'Imagine Dragons', duration: 204, thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80', mood: 'Intense', language: 'English', songType: 'Rock' },
      { videoId: 'kOHB85vDuow', title: 'Tum Hi Ho', artist: 'Arijit Singh', duration: 262, thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80', mood: 'Soulful', language: 'Hindi', songType: 'Bollywood' },
      { videoId: 'DYptgVvkVLQ', title: 'Chaiyya Chaiyya', artist: 'Sukhwinder Singh', duration: 395, thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127044b33?w=400&auto=format&fit=crop&q=80', mood: 'Energetic', language: 'Hindi', songType: 'Bollywood' },
      { videoId: '9bZkp7q19f0', title: 'Gangnam Style', artist: 'PSY', duration: 219, thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80', mood: 'Party', language: 'Korean', songType: 'K-Pop' },
      { videoId: 'I_2D8Eo15wE', title: 'Danza Kuduro', artist: 'Don Omar ft. Lucenzo', duration: 205, thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80', mood: 'Party', language: 'Spanish', songType: 'Latin' },
      { videoId: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', duration: 233, thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80', mood: 'Happy', language: 'English', songType: 'Pop' },
      { videoId: '09R8_2nJtjg', title: 'Sugar', artist: 'Maroon 5', duration: 235, thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127044b33?w=400&auto=format&fit=crop&q=80', mood: 'Upbeat', language: 'English', songType: 'Pop' },
      { videoId: 'NF-kLy44Hls', title: 'Stay', artist: 'The Kid LAROI, Justin Bieber', duration: 141, thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80', mood: 'Emotional', language: 'English', songType: 'Pop' },
    ];

    const safeCount = Math.min(Math.max(Number(count) || 6, 3), 12);
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `You are a world-class music director. Create a specialized playlist of ${safeCount} real, famous songs matching these exact criteria:
- Mood: ${mood}
- Language: ${language}
- Country / Region: ${country}
- Song Type / Genre: ${songType}

Give the playlist a creative, evocative title and a 1-sentence vibe summary.
Provide real song titles and real artists that have music videos on YouTube.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are a professional music curator. Return ONLY valid JSON adhering strictly to the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                songs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      artist: { type: Type.STRING },
                      approxDuration: { type: Type.INTEGER },
                      videoId: { type: Type.STRING },
                    },
                    required: ['title', 'artist'],
                  },
                },
              },
              required: ['title', 'description', 'songs'],
            },
          },
        });

        const raw = response.text ? JSON.parse(response.text) : null;
        if (raw && Array.isArray(raw.songs) && raw.songs.length > 0) {
          const songs = raw.songs.map((s: any, idx: number) => {
            // Assign a verified playable videoId fallback if not a clean 11-character ID
            const fallbackChoice = fallbackCatalog[idx % fallbackCatalog.length];
            const isValidId = s.videoId && /^[a-zA-Z0-9_-]{11}$/.test(s.videoId);
            return {
              id: `ai-song-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              videoId: isValidId ? s.videoId : fallbackChoice.videoId,
              title: s.title || fallbackChoice.title,
              artist: s.artist || fallbackChoice.artist,
              thumbnail: fallbackChoice.thumbnail,
              duration: s.approxDuration || fallbackChoice.duration,
            };
          });

          return res.json({
            title: raw.title || `${mood} ${songType} Mix`,
            description: raw.description || `AI curated for ${mood} vibes in ${language}`,
            songs,
          });
        }
      } catch (geminiError) {
        console.error('Gemini playlist generation error, using smart fallback:', geminiError);
      }
    }

    // Smart curated fallback tailored to the criteria
    const filtered = fallbackCatalog.filter((s) => {
      const matchLang = language === 'Any' || s.language.toLowerCase().includes(language.toLowerCase());
      const matchMood = mood === 'Any' || s.mood.toLowerCase().includes(mood.toLowerCase());
      return matchLang || matchMood;
    });

    const pool = filtered.length >= 3 ? filtered : fallbackCatalog;
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, safeCount);
    const songs = shuffled.map((s, idx) => ({
      id: `fb-song-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      videoId: s.videoId,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
      duration: s.duration,
    }));

    return res.json({
      title: `${mood} • ${country !== 'Global' ? country : ''} ${songType} Vibes`.trim(),
      description: `Handcrafted ${mood} collection celebrating ${language} & ${songType}.`,
      songs,
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Baton Audio Sync Server running on http://localhost:${PORT}`);
  });
}

startServer();
