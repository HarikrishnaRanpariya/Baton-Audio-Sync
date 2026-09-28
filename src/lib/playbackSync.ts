// Pure playback-sync math. Converts the server's authoritative playback snapshot
// into the position a client should currently be at, using elapsed wall-clock time.

export interface PlaybackTiming {
  isPlaying: boolean;
  currentTime: number; // seconds at the moment of updatedAt
  updatedAt: number; // ms epoch when currentTime was reported
  duration: number; // seconds
}

// Expected playhead position (seconds) for the given timing, clamped to the track duration.
// When paused, the reported currentTime is authoritative.
export function calculateExpectedTime(playback: PlaybackTiming, now: number = Date.now()): number {
  if (!playback.isPlaying) {
    return playback.currentTime;
  }
  const elapsed = (now - playback.updatedAt) / 1000;
  const computed = playback.currentTime + elapsed;
  return Math.min(computed, playback.duration || 3600);
}
