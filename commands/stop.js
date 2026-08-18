const { getQueue, getVoiceChannel, canManagePlayback, isPlaying } = require('../utils/musicManager');

module.exports = {
  name: 'stop',
  aliases: ['durdur', 'parar', 'stoppen', 'стоп', 'बंदकरें', 'detener'],

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
      return message.reply('Durdurulacak bir müzik yok.');
    }

    queue.voice?.leave();
    await queue.stop();
    await message.reply('⏹️ Müzik durduruldu ve bot kanaldan ayrıldı.');
  },
};
