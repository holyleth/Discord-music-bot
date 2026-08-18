const { getQueue, formatDuration } = require('../utils/musicManager');

module.exports = {
  name: 'nowplaying',
  aliases: ['şimdiçalıyor', 'simdicaliyor', 'şimdi', 'tocandoagora', 'jetztläuft', 'сейчасиграет', 'अभीचलरहाहै', 'reproduciendo'],

  async run(message) {
    const queue = getQueue(message.guild.id);

    const song = queue?.songs?.[0];

    if (!song || queue.stopped) {
      return message.reply('Şu anda çalan bir şarkı yok.');
    }

    await message.reply(
      `🎶 **${song.name}**\nSüre: \`${formatDuration(song)}\`\nKaynak: YouTube`,
    );
  },
};
