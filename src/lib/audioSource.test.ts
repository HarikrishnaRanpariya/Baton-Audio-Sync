import { describe, it, expect } from 'vitest';
import {
  parseYouTubeId,
  isAudioSource,
  getSourceType,
  isLiveRadio,
} from './audioSource';

describe('parseYouTubeId', () => {
  const ID = 'dQw4w9WgXcQ';

  it('returns a bare 11-char id unchanged', () => {
    expect(parseYouTubeId(ID)).toBe(ID);
  });

  it('parses standard watch URLs', () => {
    expect(parseYouTubeId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(parseYouTubeId(`http://youtube.com/watch?v=${ID}&t=30s`)).toBe(ID);
    expect(parseYouTubeId(`https://www.youtube.com/watch?list=RD&v=${ID}`)).toBe(ID);
  });

  it('parses youtu.be, embed, shorts, live and music URLs', () => {
    expect(parseYouTubeId(`https://youtu.be/${ID}`)).toBe(ID);
    expect(parseYouTubeId(`https://youtu.be/${ID}?t=42`)).toBe(ID);
    expect(parseYouTubeId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
    expect(parseYouTubeId(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
    expect(parseYouTubeId(`https://www.youtube.com/live/${ID}`)).toBe(ID);
    expect(parseYouTubeId(`https://music.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it('returns null for non-YouTube or empty input', () => {
    expect(parseYouTubeId('')).toBeNull();
    expect(parseYouTubeId('   ')).toBeNull();
    expect(parseYouTubeId(null)).toBeNull();
    expect(parseYouTubeId('https://example.com/song.mp3')).toBeNull();
    expect(parseYouTubeId('not a url')).toBeNull();
  });
});

describe('isAudioSource', () => {
  it('is true only when a non-empty sourceUrl exists', () => {
    expect(isAudioSource({ sourceUrl: 'https://x/a.mp3' })).toBe(true);
    expect(isAudioSource({ videoId: 'abc' })).toBe(false);
    expect(isAudioSource({ sourceUrl: '' })).toBe(false);
    expect(isAudioSource({ sourceUrl: '   ' })).toBe(false);
    expect(isAudioSource(null)).toBe(false);
  });
});

describe('getSourceType', () => {
  it('classifies uploaded files, direct urls and youtube', () => {
    expect(getSourceType({ sourceUrl: '/audio-uploads/abc123' })).toBe('local-file');
    expect(getSourceType({ sourceUrl: 'https://cdn/x.mp3' })).toBe('audio-url');
    expect(getSourceType({ videoId: 'dQw4w9WgXcQ' })).toBe('youtube');
  });

  it('falls back to a declared sourceType, else youtube', () => {
    expect(getSourceType({ sourceType: 'audio-url' })).toBe('audio-url');
    expect(getSourceType({})).toBe('youtube');
  });
});

describe('isLiveRadio', () => {
  it('detects long or radio-flavored audio streams', () => {
    expect(isLiveRadio({ sourceType: 'audio-url', duration: 86400 })).toBe(true);
    expect(isLiveRadio({ sourceType: 'audio-url', title: 'Lofi Radio' })).toBe(true);
    expect(isLiveRadio({ sourceType: 'audio-url', sourceUrl: 'https://x/stream' })).toBe(true);
    expect(isLiveRadio({ sourceType: 'audio-url', sourceUrl: 'https://x/icecast' })).toBe(true);
  });

  it('is false for regular tracks and youtube songs', () => {
    expect(isLiveRadio({ sourceType: 'audio-url', duration: 200, title: 'Song' })).toBe(false);
    expect(isLiveRadio({ sourceType: 'youtube', duration: 86400 })).toBe(false);
    expect(isLiveRadio(null)).toBe(false);
  });
});
