const { getQueue, getVoiceChannel, canManagePlayback, isPlaying } = require('../utils/musicManager');

module.exports = {
  name: 'pause',
  aliases: ['duraklat', 'pausar', 'pause', 'пауза', 'रोकें'],

  async run(message) {
    const voiceChannel = getVoiceChannel(message);

    if (!voiceChannel) {
      return message.reply('Önce bir ses kanalına katılmalısın!');
    }

    const queue = getQueue(message.guild.id);

    if (!canManagePlayback(message, queue)) {
      return message.reply('Müziği yönetmek için botla aynı ses kanalında olmalısın.');
    }

    if (!isPlaying(queue)) {
      return message.reply('Duraklatılacak bir şarkı yok.');
    }

    queue.pause();
    await message.reply('⏸️ Müzik duraklatıldı.');
  },
};
