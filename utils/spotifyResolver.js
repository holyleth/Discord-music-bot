const SpotifyWebApi = require('spotify-web-api-node');
const createSpotifyUrlInfo = require('spotify-url-info');
const { runYtDlp } = require('./ytDlpPlugin');

const SPOTIFY_URL_REGEX = /^https?:\/\/(?:open\.)?spotify\.com\/(?:intl-[^/]+\/)?(?:embed\/)?(track|album|playlist)\/([A-Za-z0-9]+)(?:\?.*)?$/i;
const spotifyUrlInfo = createSpotifyUrlInfo(fetch);

function createSpotifyClient() {
  const { SPOTIFY_CLIENT_ID: clientId, SPOTIFY_CLIENT_SECRET: clientSecret } = process.env;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify desteği için SPOTIFY_CLIENT_ID ve SPOTIFY_CLIENT_SECRET gerekli.');
  }

  return new SpotifyWebApi({ clientId, clientSecret });
}

async function getSpotifyToken(client) {
  const token = await client.clientCredentialsGrant();
  client.setAccessToken(token.body.access_token);
}

async function getAllPlaylistTracks(client, playlistId) {
  const tracks = [];
  let offset = 0;
  let page;

  do {
    page = await client.getPlaylistTracks(playlistId, { limit: 100, offset });
    tracks.push(...page.body.items);
    offset += page.body.items.length;
  } while (page.body.next && page.body.items.length > 0);

  return tracks;
}

async function getAllAlbumTracks(client, albumId) {
  const tracks = [];
  let offset = 0;
  let page;

  do {
    page = await client.getAlbumTracks(albumId, { limit: 50, offset });
    tracks.push(...page.body.items);
    offset += page.body.items.length;
  } while (page.body.next && page.body.items.length > 0);

  return tracks;
}

function trackQuery(track) {
  const artists = Array.isArray(track.artists)
    ? track.artists.map((artist) => artist.name).join(' ')
    : track.artist || '';
  return `${artists} ${track.name || ''}`.trim();
}

async function searchYouTubeUrl(query) {
  const result = await runYtDlp(`ytsearch1:${query}`);
  const entry = result.entries?.find(Boolean);

  if (!entry) return null;

  const id = entry.id || entry.url;
  return entry.webpage_url || entry.original_url || `https://www.youtube.com/watch?v=${id}`;
}

async function resolveTracksInParallel(tracks, concurrency = 8) {
  const songs = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tracks.length) {
      const index = nextIndex;
      nextIndex += 1;
      const track = tracks[index];
      const query = trackQuery(track);

      try {
        const youtubeUrl = await searchYouTubeUrl(query);

        if (youtubeUrl) {
          songs[index] = {
            title: track.name,
            artist: Array.isArray(track.artists)
              ? track.artists.map((artist) => artist.name).join(', ')
              : track.artist || '',
            url: youtubeUrl,
          };
        } else {
          console.error(`Spotify parçası YouTube'da bulunamadı: ${query}`);
        }
      } catch (error) {
        console.error(`Spotify parçası aranamadı (${query}):`, error.message);
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tracks.length) },
    () => worker(),
  );
  await Promise.all(workers);

  return songs.filter(Boolean);
}

async function resolveSpotifyUrl(url, options = {}) {
  const match = url.match(SPOTIFY_URL_REGEX);

  if (!match) return null;

  const [, type, id] = match;
  let tracks;
  const hasApiCredentials = process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET;

  if (!hasApiCredentials) {
    tracks = await spotifyUrlInfo.getTracks(url);
  } else {
    const client = createSpotifyClient();
    await getSpotifyToken(client);

    if (type.toLowerCase() === 'track') {
      const response = await client.getTrack(id);
      tracks = [response.body];
    } else if (type.toLowerCase() === 'album') {
      const response = await client.getAlbum(id);
      tracks = await getAllAlbumTracks(client, id);
      tracks = tracks.map((track) => ({
        ...track,
        album: response.body,
      }));
    } else {
      tracks = (await getAllPlaylistTracks(client, id))
        .map((item) => item.track)
        .filter((track) => track && track.type === 'track');
    }
  }

  if (!tracks.length) {
    throw new Error('Spotify kaynağında çalınabilir parça bulunamadı.');
  }

  const songs = [];
  const batchSize = 8;

  for (let index = 0; index < tracks.length; index += batchSize) {
    const batch = await resolveTracksInParallel(tracks.slice(index, index + batchSize));
    songs.push(...batch);

    if (batch.length && options.onBatch) {
      await options.onBatch(batch, songs.length, tracks.length);
    }
  }

  if (!songs.length) {
    throw new Error('Spotify parçaları YouTube üzerinde bulunamadı.');
  }

  return songs;
}

module.exports = {
  SPOTIFY_URL_REGEX,
  resolveSpotifyUrl,
};
