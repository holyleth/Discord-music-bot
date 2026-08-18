require('dotenv').config();

if (!process.env.DISCORD_TOKEN) {
  console.error('HATA: DISCORD_TOKEN bulunamadı.');
  console.error('.env dosyasının proje klasöründe olduğundan emin olun.');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const { createMusicPlayer } = require('./utils/musicManager');

const PREFIX = process.env.PREFIX || '!';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
createMusicPlayer(client);

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsPath, file));
    const name = command.data?.name ?? command.name;

    if (name) {
      client.commands.set(name, command);
      for (const alias of command.aliases || []) {
        client.commands.set(alias, command);
      }
    }
  } catch (error) {
    console.error(`Komut yüklenemedi (${file}):`, error);
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot hazır! ${readyClient.user.tag} olarak giriş yapıldı.`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = client.commands.get(commandName);
  if (!command?.run) return;

  try {
    await command.run(message, args);
  } catch (error) {
    console.error(error);
    await message.reply('Komut çalıştırılırken bir hata oluştu.');
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    const errorMessage = {
      content: 'Komut çalıştırılırken bir hata oluştu.',
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

process.on('unhandledRejection', (error) => {
  console.error('İşlenmeyen Promise hatası:', error);
});
