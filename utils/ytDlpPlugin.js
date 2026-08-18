const { spawn } = require('child_process');
const path = require('path');
const {
  DisTubeError,
  PlayableExtractorPlugin,
  Playlist,
  Song,
} = require('distube');

const pluginPath = path.dirname(require.resolve('@distube/yt-dlp'));
const ytDlpPath = path.resolve(
  pluginPath,
  '..',
  'bin',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
);

function runYtDlp(url, format) {
  const args = [
    '--dump-single-json',
    '--no-warnings',
    '--prefer-free-formats',
    '--skip-download',
    '--simulate',
    '--extractor-args',
    'youtube:player_client=android',
  ];

  if (format) {
    args.push('--format', format);
  }

  args.push(url);

  return new Promise((resolve, reject) => {
    const process = spawn(ytDlpPath, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    process.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    process.once('error', reject);
    process.once('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `yt-dlp exited with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`yt-dlp JSON parse failed: ${error.message}`));
      }
    });
  });
}

function toSongInfo(info, plugin) {
  const id = info.id || info.url;
  const url = info.webpage_url || info.original_url || `https://www.youtube.com/watch?v=${id}`;

  return {
    plugin,
    source: info.extractor || 'YouTube',
    playFromSource: true,
    id,
    name: info.title || info.fulltitle || 'Bilinmeyen şarkı',
    url,
    isLive: Boolean(info.is_live),
    thumbnail: info.thumbnail || info.thumbnails?.[0]?.url,
    duration: info.is_live ? 0 : info.duration || 0,
    uploader: {
      name: info.uploader,
      url: info.uploader_url,
    },
    views: info.view_count,
    likes: info.like_count,
    ageRestricted: Boolean(info.age_limit) && info.age_limit >= 18,
  };
}

class LocalYtDlpPlugin extends PlayableExtractorPlugin {
  validate(url) {
    if (/^ytsearch\d*:/i.test(url)) return true;

    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname === 'youtu.be'
        || hostname === 'youtube.com'
        || hostname.endsWith('.youtube.com');
    } catch {
      return false;
    }
  }

  async resolve(url, options) {
    let info;

    try {
      info = await runYtDlp(url);
    } catch (error) {
      throw new DisTubeError('YTDLP_ERROR', error.message);
    }

    if (Array.isArray(info.entries)) {
      const entries = info.entries.filter(Boolean);

      if (!entries.length) {
        throw new DisTubeError('NO_RESULT', `Cannot find any song with this query (${url})`);
      }

      const songs = entries.map((entry) => {
        const song = new Song(toSongInfo(entry, this), options);
        return song;
      });

      return new Playlist(
        {
          source: info.extractor || 'YouTube',
          songs,
          id: String(info.id || url),
          name: info.title || 'YouTube araması',
          url: info.webpage_url || url,
          thumbnail: info.thumbnail || info.thumbnails?.[0]?.url,
        },
        options,
      );
    }

    return new Song(toSongInfo(info, this), options);
  }

  async getStreamURL(song) {
    try {
      const info = await runYtDlp(song.url, 'ba/ba*');

      if (!info.url) {
        throw new Error('yt-dlp ses URLsi döndürmedi.');
      }

      return info.url;
    } catch (error) {
      throw new DisTubeError('YTDLP_ERROR', error.message);
    }
  }

  getRelatedSongs() {
    return [];
  }
}

module.exports = {
  LocalYtDlpPlugin,
  runYtDlp,
  ytDlpPath,
};
