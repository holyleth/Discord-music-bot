const {
  getMusicPlayer,
  getVoiceChannel,
  setBulkMode,
} = require('../utils/musicManager');
const { runYtDlp } = require('../utils/ytDlpPlugin');
const { SPOTIFY_URL_REGEX, resolveSpotifyUrl } = require('../utils/spotifyResolver');

async function resolveSource(query) {
  if (/^https?:\/\//i.test(query)) {
    const url = new URL(query);
    const hostname = url.hostname.toLowerCase();
    const isYouTube = hostname === 'youtu.be'
      || hostname === 'youtube.com'
      || hostname.endsWith('.youtube.com');

    if (!isYouTube) {
      throw new Error('Yalnızca YouTube veya Spotify bağlantıları destekleniyor.');
    }

    return query;
  }

  const result = await runYtDlp(`ytsearch1:${query}`);
  const entry = result.entries?.find(Boolean);

  if (!entry) {
    throw new Error(`YouTube'da sonuç bulunamadı: ${query}`);
  }

  const id = entry.id || entry.url;
  return entry.webpage_url || entry.original_url || `https://www.youtube.com/watch?v=${id}`;
}

module.exports = {
  name: 'play',
  aliases: ['çal', 'tocar', 'abspielen', 'играть', 'चलाएँ', 'reproducir'],

  async run(message, args) {
    const voiceChannel = getVoiceChannel(message);
    const musicPlayer = getMusicPlayer();

    if (!voiceChannel) {
      return message.reply('Önce bir ses kanalına katılmalısın!');
    }

    const queue = musicPlayer.getQueue(message.guild.id);
    const botVoiceChannel = queue?.voiceChannel || message.guild.members.me?.voice?.channel;

    if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
      return message.reply('Bot şu anda başka bir ses kanalında müzik çalıyor.');
    }

    const query = args.join(' ').trim();

    if (!query) {
      return message.reply(
        'Kullanım: `!play <şarkı adı, YouTube URL veya Spotify track/album/playlist URL>`',
      );
    }

    const searching = await message.reply('🔍 Aranıyor...');

    try {
      if (SPOTIFY_URL_REGEX.test(query)) {
        let firstBatch = true;
        let queuedCount = 0;

        await resolveSpotifyUrl(query, {
          onBatch: async (batch, total) => {
            setBulkMode(message.guild.id, true);
            try {
              const results = await Promise.allSettled(batch.map((song) => musicPlayer.play(voiceChannel, song.url, {
                  member: message.member,
                  textChannel: message.channel,
                  message,
              })));

              const failed = results.filter((result) => result.status === 'rejected');
              for (const result of failed) {
                console.error('Playlist parçası kuyruğa eklenemedi:', result.reason);
              }
            } finally {
              setBulkMode(message.guild.id, false);
            }

            queuedCount = total;
            await searching.edit(
              firstBatch
                ? `▶️ İlk ${batch.length} Spotify parçası hazır, liste arka planda ekleniyor...`
                : `📥 Spotify listesinden ${queuedCount} parça kuyruğa eklendi...`,
            );
            firstBatch = false;
          },
        });

        await searching.edit(`✅ Spotify listesinden ${queuedCount} parça kuyruğa eklendi.`);
        return;
      }

      const source = await resolveSource(query);
      await musicPlayer.play(voiceChannel, source, {
        member: message.member,
        textChannel: message.channel,
        message,
      });

      await searching.edit('✅ İstek alındı, oynatma kuyruğu hazırlanıyor.');
    } catch (error) {
      console.error(error);
      await searching.edit(`❌ ${error.message || 'Şarkı eklenirken bir hata oluştu.'}`);
    }
  },
};
