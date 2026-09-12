import { SongItem } from './types';

// Curated high-fidelity YouTube Music tracks with validated IDs for immediate synchronous play
export const CURATED_TRACKS: Omit<SongItem, 'id' | 'addedBy' | 'addedByName'>[] = [
  {
    videoId: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    duration: 200,
  },
  {
    videoId: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    artist: 'Lofi Girl',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    duration: 3600,
  },
  {
    videoId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    duration: 354,
  },
  {
    videoId: 'TUVcZfQe-Kw',
    title: 'Levitating',
    artist: 'Dua Lipa',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    duration: 203,
  },
  {
    videoId: '5qap5aO4i9A',
    title: 'Lofi beats to sleep/chill to',
    artist: 'ChilledCow',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    duration: 7200,
  },
  {
    videoId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
    duration: 233,
  },
  {
    videoId: 'NF-kLy44Hls',
    title: 'Stay',
    artist: 'The Kid LAROI, Justin Bieber',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&auto=format&fit=crop&q=80',
    duration: 141,
  },
  {
    videoId: 'H5v3kku4y6Q',
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
