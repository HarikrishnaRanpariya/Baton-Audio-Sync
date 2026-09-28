// Single identity/dedupe check shared by the server's queue, playlist, and history logic.
// Matches on videoId, then sourceUrl, then title (optionally also requiring artist).

export type SongLike = {
  videoId?: string;
  sourceUrl?: string;
  title?: string;
  artist?: string;
};

export function songsMatch(
  a: SongLike | null | undefined,
  b: SongLike | null | undefined,
  opts: { requireArtist?: boolean } = {},
): boolean {
  if (!a || !b) return false;
  const aVid = (a.videoId || '').trim();
  const bVid = (b.videoId || '').trim();
  if (aVid && bVid && aVid === bVid) return true;
  const aUrl = (a.sourceUrl || '').trim();
  const bUrl = (b.sourceUrl || '').trim();
  if (aUrl && bUrl && aUrl === bUrl) return true;
  const aTitle = (a.title || '').trim().toLowerCase();
  const bTitle = (b.title || '').trim().toLowerCase();
  if (aTitle && bTitle && aTitle === bTitle) {
    if (!opts.requireArtist) return true;
    const aArtist = (a.artist || '').trim().toLowerCase();
    const bArtist = (b.artist || '').trim().toLowerCase();
    if (aArtist && bArtist && aArtist === bArtist) return true;
  }
  return false;
}
