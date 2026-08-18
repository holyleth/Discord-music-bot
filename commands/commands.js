const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');
const { getLocale, locales, commandNames, commandOrder } = require('../utils/commandLocales');

const activePanels = new Map();
const selectedLocales = new Map();

function attachPrivateCollector(panel, ownerId, localeCode, prefix) {
  const collector = panel.createMessageComponentCollector();

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== ownerId) {
      await interaction.reply({
        content: 'Bu dil paneli yalnızca onu açan kullanıcıya aittir.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const selected = interaction.customId.split(':')[2];
    if (!locales[selected]) return;

    selectedLocales.set(ownerId, selected);
    await interaction.update(renderPanel(selected, prefix));
  });
}

function renderPanel(localeCode, prefix) {
  const locale = getLocale(localeCode);
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${locale.flag} ${locale.title}`)
    .setDescription(`${locale.subtitle}\n\`${prefix}commands\` ile bu paneli tekrar açabilirsiniz.`)
    .addFields({
      name: locale.label,
      value: commandOrder
        .map((name) => `**${prefix}${commandNames[localeCode][name]}**\n${locale.commands[name][1]}`)
        .join('\n\n'),
    });

  const languageCodes = Object.keys(locales);
  const rows = [];

  for (let index = 0; index < languageCodes.length; index += 5) {
    const row = new ActionRowBuilder();
    for (const code of languageCodes.slice(index, index + 5)) {
      const language = locales[code];
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`commands:language:${code}`)
          .setEmoji(language.flag)
          .setLabel(language.label)
          .setStyle(code === localeCode ? ButtonStyle.Primary : ButtonStyle.Secondary),
      );
    }
    rows.push(row);
  }

  return { embeds: [embed], components: rows };
}

module.exports = {
  name: 'commands',
  aliases: ['komutlar', 'komut'],

  async run(message) {
    let localeCode = selectedLocales.get(message.author.id)
      || message.guild.preferredLocale?.split('-')[0]
      || 'en';
    if (!locales[localeCode]) localeCode = 'en';

    const previousPanel = activePanels.get(message.guild.id);
    if (previousPanel) {
      previousPanel.collector.stop('replaced');
      await previousPanel.message.edit({ components: [] }).catch(() => {});
    }

    const panel = await message.reply(renderPanel(localeCode, process.env.PREFIX || '!'));
    const collector = panel.createMessageComponentCollector();
    activePanels.set(message.guild.id, { message: panel, collector });

    collector.on('collect', async (interaction) => {
      if (!interaction.customId.startsWith('commands:language:')) return;

      const selected = interaction.customId.split(':')[2];
      if (!locales[selected]) return;

      selectedLocales.set(interaction.user.id, selected);
      await interaction.reply({
        ...renderPanel(selected, process.env.PREFIX || '!'),
        flags: MessageFlags.Ephemeral,
      });
      const privatePanel = await interaction.fetchReply();
      attachPrivateCollector(privatePanel, interaction.user.id, selected, process.env.PREFIX || '!');
    });

    collector.on('end', () => {
      const activePanel = activePanels.get(message.guild.id);
      if (activePanel?.message.id === panel.id) activePanels.delete(message.guild.id);
    });
  },
};
