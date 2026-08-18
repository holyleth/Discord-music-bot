const { getQueue, getVoiceChannel, canManagePlayback, isPlaying } = require('../utils/musicManager');

module.exports = {
  name: 'skip',
  aliases: ['atla', 'pular', 'überspringen', 'пропустить', 'छोड़ें', 'saltar'],

  async run(message) {
    const voiceChannel = getVoiceChannel(message);

    if (!voiceChannel) {
      return message.reply('Önce bir ses kanalına katılmalısın!');
    }

    const queue = getQueue(message.guild.id);

    if (!canManagePlayback(message, queue)) {
      return message.reply('Müziği yönetmek için botla aynı ses kanalında olmalısın.');
    }

    if (!queue || (!isPlaying(queue) && queue.songs.length === 0)) {
      return message.reply('Şu anda çalan bir şarkı yok.');
    }

    const skipped = queue.songs[0]?.name || 'Mevcut şarkı';
    await queue.skip();
    await message.reply(`⏭️ Atlandı: **${skipped}**`);
  },
};
