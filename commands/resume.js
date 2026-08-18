const { getQueue, getVoiceChannel, canManagePlayback } = require('../utils/musicManager');

module.exports = {
  name: 'resume',
  aliases: ['devam', 'continuar', 'fortsetzen', 'продолжить', 'जारीरखें'],

  async run(message) {
    const voiceChannel = getVoiceChannel(message);

    if (!voiceChannel) {
      return message.reply('Önce bir ses kanalına katılmalısın!');
    }

    const queue = getQueue(message.guild.id);

    if (!canManagePlayback(message, queue)) {
      return message.reply('Müziği yönetmek için botla aynı ses kanalında olmalısın.');
    }

    if (!queue || !queue.paused) {
      return message.reply('Devam ettirilecek duraklatılmış bir şarkı yok.');
    }

    queue.resume();
    await message.reply('▶️ Müzik devam ediyor.');
  },
};
