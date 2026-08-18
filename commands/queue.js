const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require('discord.js');
const { getQueue, formatDuration } = require('../utils/musicManager');

const PAGE_SIZE = 10;
const activePanels = new Map();

function canViewPanel(interaction, queue, ownerId) {
  if (interaction.user.id === ownerId) return true;
  if (interaction.member?.permissions?.has(PermissionFlagsBits.ManageGuild)) return true;

  return Boolean(
    interaction.member?.voice?.channelId
      && interaction.member.voice.channelId === queue?.voiceChannel?.id,
  );
}

function renderQueue(queue, page) {
  const currentSong = queue?.songs?.[0];
  const upcoming = queue?.songs?.slice(1) || [];
  const totalPages = Math.max(1, Math.ceil(upcoming.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const pageSongs = upcoming.slice(start, start + PAGE_SIZE);

  const embed = new EmbedBuilder()
    .setColor(0x1db954)
    .setTitle('🎵 Müzik Kuyruğu')
    .setFooter({ text: `Sayfa ${safePage + 1}/${totalPages} • ${upcoming.length} sıradaki şarkı` });

  if (currentSong) {
    embed.addFields({
      name: '▶️ Şimdi çalıyor',
      value: `**${currentSong.name}**\nSüre: \`${formatDuration(currentSong)}\``,
    });
  }

  embed.addFields({
    name: '📋 Sıradaki şarkılar',
    value: pageSongs.length
      ? pageSongs
        .map((song, index) => `${start + index + 1}. **${song.name}** \`[${formatDuration(song)}]\``)
        .join('\n')
      : 'Sırada başka şarkı yok.',
  });

  return { embed, page: safePage, totalPages };
}

function renderButtons(page, totalPages, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('queue:previous')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || page === 0),
    new ButtonBuilder()
      .setCustomId('queue:next')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || page >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId('queue:skip')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId('queue:shuffle')
      .setEmoji('🔀')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
  );
}

module.exports = {
  name: 'queue',
  aliases: ['sıra', 'sira', 'fila', 'warteschlange', 'очередь', 'कतार', 'cola'],

  async run(message) {
    const queue = getQueue(message.guild.id);

    if (!queue || queue.songs.length === 0 || queue.stopped) {
      return message.reply('Sıra boş.');
    }

    const previousPanel = activePanels.get(message.guild.id);
    if (previousPanel) {
      previousPanel.collector.stop('replaced');
      await previousPanel.message.edit({ components: [] }).catch(() => {});
      activePanels.delete(message.guild.id);
    }

    let page = 0;
    const initial = renderQueue(queue, page);
    const panel = await message.reply({
      embeds: [initial.embed],
      components: [renderButtons(initial.page, initial.totalPages)],
    });

    const collector = panel.createMessageComponentCollector();
    activePanels.set(message.guild.id, { message: panel, collector });

    collector.on('collect', async (interaction) => {
      const liveQueue = getQueue(message.guild.id);

      if (!canViewPanel(interaction, liveQueue, message.author.id)) {
        await interaction.reply({
          content: 'Bu kuyruk panelini kullanmak için botla aynı ses kanalında olmalısın.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (interaction.customId === 'queue:skip') {
        if (!liveQueue || liveQueue.songs.length < 2) {
          await interaction.reply({
            content: 'Atlanacak başka bir şarkı yok.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        await liveQueue.skip();
        page = 0;
      }

      if (interaction.customId === 'queue:shuffle') {
        if (!liveQueue || liveQueue.songs.length < 3) {
          await interaction.reply({
            content: 'Karıştırmak için sırada en az iki şarkı olmalı.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const currentSong = liveQueue.songs[0];
        await liveQueue.shuffle();
        liveQueue.songs = [currentSong, ...liveQueue.songs.filter((song) => song !== currentSong)];
        page = 0;
      }

      if (interaction.customId === 'queue:next') page += 1;
      if (interaction.customId === 'queue:previous') page -= 1;
      const rendered = renderQueue(liveQueue, page);
      page = rendered.page;
      await interaction.update({
        embeds: [rendered.embed],
        components: [renderButtons(rendered.page, rendered.totalPages)],
      });
    });

    collector.on('end', () => {
      const activePanel = activePanels.get(message.guild.id);
      if (activePanel?.message.id === panel.id) {
        activePanels.delete(message.guild.id);
      }
    });

  },
};
