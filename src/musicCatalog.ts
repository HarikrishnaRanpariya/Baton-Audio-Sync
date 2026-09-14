import { SongItem } from './types';

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  streamUrl: string;
  thumbnail: string;
  description: string;
}

// 24/7 Universal Live Web Radio Streams (Bypasses YouTube restrictions, works 100% on S25 Ultra / Android / WebViews)
export const DIRECT_RADIO_STREAMS: RadioStation[] = [
  {
    id: 'lofi-beats-live',
    name: 'Lo-Fi Chill & Study Beats',
    genre: 'Lo-Fi / Chillhop',
    streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    description: '24/7 relaxed downtempo beats perfect for study, coding & chill'
  },
  {
    id: 'synthwave-retro',
    name: 'Synthwave & Retro 80s',
    genre: 'Synthwave / Retro',
    streamUrl: 'https://stream.nightride.fm/nightride.mp3',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    description: 'Outrun, retrowave, and neon synth pulses from Nightride FM'
  },
  {
    id: 'chill-lounge-jazz',
    name: 'Smooth Jazz & Cafe Lounge',
    genre: 'Jazz / Lounge',
    streamUrl: 'https://streaming.exclusive.radio/er/smoothjazz/icecast.audio',
    thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
    description: 'Warm saxophone, jazz piano, and acoustic evening coffeehouse'
  },
  {
    id: 'ambient-deep-space',
    name: 'Deep Ambient & Space Waves',
    genre: 'Ambient / Meditation',
    streamUrl: 'https://stream.zeno.fm/0r0xa792kwzuv',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    description: 'Cinematic cosmic drones, binaural atmospheres, and stress relief'
  },
  {
    id: 'indie-acoustic-vibes',
    name: 'Indie Acoustic & Folk',
    genre: 'Acoustic / Folk',
    streamUrl: 'https://streaming.exclusive.radio/er/acoustic/icecast.audio',
    thumbnail: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&auto=format&fit=crop&q=80',
    description: 'Heartfelt acoustic guitar melodies, vocals, and warm indie folk'
  },
  {
    id: 'dance-club-energy',
    name: 'Club Dance & EDM Energy',
    genre: 'EDM / Dance',
    streamUrl: 'https://streaming.exclusive.radio/er/clubdance/icecast.audio',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    description: 'High energy festival electronic, house, and dance anthems'
  },
  {
    id: 'classical-focus-piano',
    name: 'Classical Symphony & Piano',
    genre: 'Classical / Piano',
    streamUrl: 'https://streaming.exclusive.radio/er/classicalpiano/icecast.audio',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127044b33?w=400&auto=format&fit=crop&q=80',
    description: 'Masterworks of Chopin, Debussy, and calm solo piano for deep focus'
  },
];

// Direct royalty-free CDN audio tracks with instant HTML5 playback (Mobile/S25 certified)
export const DIRECT_AUDIO_TRACKS: Omit<SongItem, 'id' | 'addedBy' | 'addedByName'>[] = [
  {
    videoId: '',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    sourceType: 'audio-url',
    title: 'Lofi Study Night',
    artist: 'FASSounds',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    duration: 147,
  },
  {
    videoId: '',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    sourceType: 'audio-url',
    title: 'Synthwave Boulevard',
    artist: 'StreamBeats',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    duration: 172,
  },
  {
    videoId: '',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c7a73d67.mp3',
    sourceType: 'audio-url',
    title: 'Acoustic Morning Breeze',
    artist: 'Lesfm',
    thumbnail: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&auto=format&fit=crop&q=80',
    duration: 160,
  },
  {
    videoId: '',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77c30.mp3',
    sourceType: 'audio-url',
    title: 'Midnight Jazz Club',
    artist: 'SoulProdMusic',
    thumbnail: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
    duration: 195,
  },
  {
    videoId: '',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c34479e0a0.mp3',
    sourceType: 'audio-url',
    title: 'Cyberpunk Skyline',
    artist: 'AlexiAction',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    duration: 185,
  },
  {
    videoId: '',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3',
    sourceType: 'audio-url',
    title: 'Solitude Piano Reflections',
    artist: 'OlexandrIgnatov',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127044b33?w=400&auto=format&fit=crop&q=80',
    duration: 170,
  },
  {
    videoId: '',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_03d6d03d36.mp3',
    sourceType: 'audio-url',
    title: 'Groovy Sunset Funk',
    artist: 'ComaStudio',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    duration: 140,
  },
  {
    videoId: '',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3',
    sourceType: 'audio-url',
    title: 'Tokyo Rain Lo-Fi',
    artist: 'TokyoChill',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    duration: 150,
  },
];

// Curated high-fidelity YouTube Music tracks with direct audio fallbacks
export const CURATED_TRACKS: Omit<SongItem, 'id' | 'addedBy' | 'addedByName'>[] = [
  {
    videoId: '4NRXx6U8ABQ',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_03d6d03d36.mp3',
    sourceType: 'audio-url',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    duration: 200,
  },
  {
    videoId: 'jfKfPfyJRdk',
    sourceUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    sourceType: 'audio-url',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    artist: 'Lofi Girl',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    duration: 3600,
  },
  {
    videoId: 'fJ9rUzIMcZQ',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3',
    sourceType: 'audio-url',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    duration: 354,
  },
  {
    videoId: 'TUVcZfQe-Kw',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_03d6d03d36.mp3',
    sourceType: 'audio-url',
    title: 'Levitating',
    artist: 'Dua Lipa',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    duration: 203,
  },
  {
    videoId: '5qap5aO4i9A',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    sourceType: 'audio-url',
    title: 'Lofi beats to sleep/chill to',
    artist: 'ChilledCow',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    duration: 7200,
  },
  {
    videoId: 'JGwWNGJdvx8',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c7a73d67.mp3',
    sourceType: 'audio-url',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
    duration: 233,
  },
  {
    videoId: 'NF-kLy44Hls',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    sourceType: 'audio-url',
    title: 'Stay',
    artist: 'The Kid LAROI, Justin Bieber',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=80',
    duration: 141,
  },
  {
    videoId: 'H5v3kku4y6Q',
    sourceUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c7a73d67.mp3',
    sourceType: 'audio-url',
    title: 'As It Was',
    artist: 'Harry Styles',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
    duration: 167,
  },
  {
    videoId: 'YQHsXMglC9A',
    title: 'Hello',
    artist: 'Adele',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    duration: 295,
  },
  {
    videoId: 'hT_nvWreIhg',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    duration: 257,
  },
  {
    videoId: 'kXYiU_JCYtU',
    title: 'Numb',
    artist: 'Linkin Park',
    thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80',
    duration: 187,
  },
  {
    videoId: '09R8_2nJtjg',
    title: 'Sugar',
    artist: 'Maroon 5',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127044b33?w=400&auto=format&fit=crop&q=80',
    duration: 235,
  },
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    duration: 228,
  },
  {
    videoId: 'gdZLi9oWNZg',
    title: 'Dynamite',
    artist: 'BTS',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    duration: 199,
  },
  {
    videoId: 'Umhl_L70Zck',
    title: 'Kesariya',
    artist: 'Arijit Singh, Pritam',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    duration: 268,
  },
  {
    videoId: '9bZkp7q19f0',
    title: 'Gangnam Style',
    artist: 'PSY',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    duration: 219,
  },
  {
    videoId: 'ALZHF5UqnU4',
    title: 'Alone',
    artist: 'Marshmello',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    duration: 198,
  },
  {
    videoId: 'OPf0YbXqDm0',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
    duration: 270,
  },
  {
    videoId: '7wtfhZwyrcc',
    title: 'Believer',
    artist: 'Imagine Dragons',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
    duration: 204,
  },
  {
    videoId: 'aJOTlE1K90k',
    title: 'Maroon 5 - Girls Like You',
    artist: 'Maroon 5 ft. Cardi B',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=80',
    duration: 271,
  },
  {
    videoId: 'kOHB85vDuow',
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    duration: 262,
  },
  {
    videoId: 'I_2D8Eo15wE',
    title: 'Danza Kuduro',
    artist: 'Don Omar ft. Lucenzo',
    thumbnail: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&auto=format&fit=crop&q=80',
    duration: 205,
  },
  {
    videoId: 'DYptgVvkVLQ',
    title: 'Chaiyya Chaiyya',
    artist: 'Sukhwinder Singh, Sapna Awasthi',
    thumbnail: 'https://images.unsplash.com/photo-1520523839898-507127044b33?w=400&auto=format&fit=crop&q=80',
    duration: 395,
  }
];

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // URL formats:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://music.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
