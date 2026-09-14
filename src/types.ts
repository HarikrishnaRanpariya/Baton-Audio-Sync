export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  color: string;
}

export interface SongItem {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number; // in seconds
  addedBy: string;
  addedByName: string;
  sourceUrl?: string;
  sourceType?: 'youtube' | 'audio-url' | 'local-file';
}

export interface BatonState {
  currentOwnerId: string | null;
  currentOwnerName: string | null;
  acquiredAt: number | null;
  queue: Array<{
    userId: string;
    userName: string;
    avatar: string;
    requestedAt: number;
  }>;
}

export interface PlaybackState {
  currentSong: SongItem | null;
  isPlaying: boolean;
  currentTime: number; // seconds
  updatedAt: number;   // timestamp when currentTime was reported (for latency sync)
  duration: number;    // seconds
  updatedBy: string;   // userId of baton holder who triggered update
  masterVolume?: number; // 0-100 master level broadcast by Baton Owner (defaults to 80)
}

export interface RoomMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  joinedAt: number;
  status: 'active' | 'pending';
  device?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  type: 'chat' | 'system' | 'baton' | 'reaction';
  timestamp: number;
}

export interface PlaylistGroup {
  id: string;
  title: string;
  createdAt: number;
  createdBy: string;
  createdByName: string;
  songs: SongItem[];
}

export interface AiPlaylistCriteria {
  mood: string;
  language: string;
  country: string;
  songType: string;
  count?: number;
}

export interface RoomData {
  id: string;
  name: string;
  isPrivate: boolean;
  hasPin: boolean;
  pin?: string;
  hostId: string;
  hostName: string;
  createdAt: number;
  members: RoomMember[];
  pendingMembers: RoomMember[];
  baton: BatonState;
  playback: PlaybackState;
  playlist: SongItem[];
  masterQueue: SongItem[];
  isQueueLocked: boolean;
  playlists: PlaylistGroup[];
  activePlaylistId?: string;
  chat: ChatMessage[];
}

export type DeviceMode = 'responsive' | 'iphone' | 'android';

export interface NotificationSettings {
  enabled: boolean;
  alertOnBatonGranted: boolean;
  alertOnNewSong: boolean;
  soundEnabled: boolean;
}
