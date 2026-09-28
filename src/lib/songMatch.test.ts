import { describe, it, expect } from 'vitest';
import { songsMatch } from './songMatch';

describe('songsMatch', () => {
  it('matches by videoId first', () => {
    expect(songsMatch({ videoId: 'abc' }, { videoId: 'abc' })).toBe(true);
    expect(songsMatch({ videoId: 'abc' }, { videoId: 'xyz' })).toBe(false);
  });

  it('matches by sourceUrl', () => {
    expect(songsMatch({ sourceUrl: 'https://x/a.mp3' }, { sourceUrl: 'https://x/a.mp3' })).toBe(true);
    expect(songsMatch({ sourceUrl: 'https://x/a.mp3' }, { sourceUrl: 'https://x/b.mp3' })).toBe(false);
  });

  it('matches by title case-insensitively (loose mode)', () => {
    expect(songsMatch({ title: 'Levitating' }, { title: 'levitating' })).toBe(true);
    expect(songsMatch({ title: 'Levitating' }, { title: 'Blinding Lights' })).toBe(false);
  });

  it('requires artist when requireArtist is set', () => {
    const a = { title: 'Levitating', artist: 'Dua Lipa' };
    expect(songsMatch(a, { title: 'Levitating', artist: 'Dua Lipa' }, { requireArtist: true })).toBe(true);
    expect(songsMatch(a, { title: 'Levitating', artist: 'Cover Band' }, { requireArtist: true })).toBe(false);
    // Same title but missing artist should NOT match in requireArtist mode
    expect(songsMatch(a, { title: 'Levitating' }, { requireArtist: true })).toBe(false);
  });

  it('ignores empty/whitespace fields and null inputs', () => {
    expect(songsMatch({ videoId: '' }, { videoId: '' })).toBe(false);
    expect(songsMatch({ title: '  ' }, { title: '  ' })).toBe(false);
    expect(songsMatch(null, { videoId: 'abc' })).toBe(false);
    expect(songsMatch({ videoId: 'abc' }, undefined)).toBe(false);
  });
});
