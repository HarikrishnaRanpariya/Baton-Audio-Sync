// Pure helpers for resolving and classifying a song's audio source.
// Shared by the client player and the music search/URL flows; no DOM or React deps.

export type SourceType = 'youtube' | 'audio-url' | 'local-file';

export interface AudioSourceLike {
  videoId?: string;
  sourceUrl?: string;
  sourceType?: string;
  title?: string;
  artist?: string;
  duration?: number;
}

// Extract an 11-char YouTube video ID from a raw ID or any common YouTube/YouTube Music URL.
// Supports watch?v=, youtu.be/, embed/, v/, shorts/, live/, music.youtube.com, and youtube-nocookie.
export function parseYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare 11-char ID.
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const patterns = [
    /(?:youtube\.com|youtube-nocookie\.com|music\.youtube\.com)\/(?:watch\?(?:[^#]*&)?v=|embed\/|v\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

// True when the song should play through the direct HTML5 <audio> engine (has a stream URL),
// as opposed to the YouTube IFrame player.
export function isAudioSource(song: AudioSourceLike | null | undefined): boolean {
  return Boolean(song?.sourceUrl && song.sourceUrl.trim());
}

// Infer the concrete source type from a song's fields.
export function getSourceType(song: AudioSourceLike | null | undefined): SourceType {
  const url = song?.sourceUrl?.trim();
  if (url) {
    if (url.includes('/audio-uploads/')) return 'local-file';
    return 'audio-url';
  }
  if (song?.videoId && song.videoId.trim()) return 'youtube';
  const declared = song?.sourceType;
  if (declared === 'youtube' || declared === 'audio-url' || declared === 'local-file') {
    return declared;
  }
  return 'youtube';
}

// A direct-audio song that behaves like a continuous live stream (radio) rather than a fixed track.
export function isLiveRadio(song: AudioSourceLike | null | undefined): boolean {
  if (!song || song.sourceType !== 'audio-url') return false;
  return (
    (song.duration || 0) >= 3600 ||
    Boolean(song.title?.toLowerCase().includes('radio')) ||
    Boolean(song.artist?.toLowerCase().includes('radio')) ||
    Boolean(song.sourceUrl?.includes('stream')) ||
    Boolean(song.sourceUrl?.includes('icecast'))
  );
}
