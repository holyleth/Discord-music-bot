const { DisTube } = require('distube');
const { PermissionFlagsBits } = require('discord.js');
const ffmpegPath = require('ffmpeg-static');
const { LocalYtDlpPlugin } = require('./ytDlpPlugin');

let player;
const bulkGuilds = new Set();

function createMusicPlayer(client) {
  if (player) return player;

  player = new DisTube(client, {
    emitNewSongOnly: true,
    ffmpeg: {
      path: ffmpegPath || 'ffmpeg',
    },
    plugins: [new LocalYtDlpPlugin()],
  });

  player.on('playSong', (queue, song) => {
    if (bulkGuilds.has(queue.id)) return;
    queue.textChannel?.send(`🎵 Çalıyor: **${song.name}** \`[${formatDuration(song)}]\``);
  });

  player.on('addSong', (queue, song) => {
    if (bulkGuilds.has(queue.id)) return;
    queue.textChannel?.send(`📥 Sıraya eklendi: **${song.name}** \`[${formatDuration(song)}]\``);
  });

  player.on('addList', (queue, playlist) => {
    if (bulkGuilds.has(queue.id)) return;
    queue.textChannel?.send(`📥 Liste sıraya eklendi: **${playlist.name}** (${playlist.songs.length} şarkı)`);
  });

  player.on('finish', async (queue) => {
    queue.voice?.leave();
    await queue.textChannel?.send('✅ Sıra bitti, kanaldan ayrılıyorum.').catch(() => {});
  });

  player.on('empty', (channel) => {
    channel.send('👋 Ses kanalında kimse kalmadı, kanaldan ayrılıyorum.').catch(() => {});
  });

  player.on('error', (error, queue, song) => {
    console.error('DisTube error:', error);
    queue?.textChannel?.send(
      `❌ ${song?.name ? `**${song.name}** çalınamadı. ` : ''}Başka bir YouTube linki veya arama deneyin.`,
    ).catch(() => {});
  });

  player.on('ffmpegDebug', (debug) => {
    if (/Will reconnect .*error=Error number -10054 occurred/i.test(debug)) return;
    console.error('FFmpeg:', debug);
  });

  return player;
}

function getMusicPlayer() {
  if (!player) throw new Error('Müzik oynatıcı henüz başlatılmadı.');
  return player;
}

function setBulkMode(guildId, enabled) {
  if (enabled) bulkGuilds.add(guildId);
  else bulkGuilds.delete(guildId);
}

function getVoiceChannel(message) {
  return message.member?.voice?.channel ?? null;
}

function canManagePlayback(message, queue) {
  if (message.member?.permissions?.has(PermissionFlagsBits.ManageGuild)) return true;

  const userChannel = getVoiceChannel(message);
  return Boolean(userChannel && queue?.voiceChannel?.id === userChannel.id);
}

function getQueue(guildId) {
  return getMusicPlayer().getQueue(guildId);
}

function isPlaying(queue) {
  return Boolean(queue && !queue.stopped && !queue.paused);
}

function formatDuration(song) {
  if (!song) return '?:??';
  if (typeof song.formatDuration === 'function') return song.formatDuration();
  return song.formattedDuration || '?:??';
}

module.exports = {
  createMusicPlayer,
  getMusicPlayer,
  setBulkMode,
  getVoiceChannel,
  canManagePlayback,
  getQueue,
  isPlaying,
  formatDuration,
};