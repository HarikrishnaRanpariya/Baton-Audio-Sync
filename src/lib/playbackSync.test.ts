import { describe, it, expect } from 'vitest';
import { calculateExpectedTime } from './playbackSync';

describe('calculateExpectedTime', () => {
  it('returns the reported time when paused (ignores elapsed)', () => {
    const t = calculateExpectedTime(
      { isPlaying: false, currentTime: 42, updatedAt: 0, duration: 200 },
      10_000,
    );
    expect(t).toBe(42);
  });

  it('advances by elapsed wall-clock seconds while playing', () => {
    const updatedAt = 1_000_000;
    const t = calculateExpectedTime(
      { isPlaying: true, currentTime: 10, updatedAt, duration: 200 },
      updatedAt + 5_000, // 5s later
    );
    expect(t).toBe(15);
  });

  it('clamps to the track duration', () => {
    const updatedAt = 0;
    const t = calculateExpectedTime(
      { isPlaying: true, currentTime: 190, updatedAt, duration: 200 },
      updatedAt + 60_000, // would be 250s
    );
    expect(t).toBe(200);
  });

  it('uses a 1-hour ceiling when duration is missing', () => {
    const updatedAt = 0;
    const t = calculateExpectedTime(
      { isPlaying: true, currentTime: 0, updatedAt, duration: 0 },
      updatedAt + 10_000_000, // far beyond an hour
    );
    expect(t).toBe(3600);
  });
});
