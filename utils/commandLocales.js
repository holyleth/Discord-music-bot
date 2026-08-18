const locales = {
  en: {
    flag: '🇺🇸',
    label: 'English',
    title: 'Bot Commands',
    subtitle: 'Use the prefix before each command.',
    commands: {
      play: ['Play', 'Play a song, YouTube URL, or Spotify URL'],
      pause: ['Pause', 'Pause the current song'],
      resume: ['Resume', 'Resume the paused song'],
      skip: ['Skip', 'Skip the current song'],
      stop: ['Stop', 'Stop playback and leave the voice channel'],
      queue: ['Queue', 'Show the interactive music queue'],
      nowplaying: ['Now Playing', 'Show the current song'],
    },
  },
  tr: {
    flag: '🇹🇷',
    label: 'Türkçe',
    title: 'Bot Komutları',
    subtitle: 'Her komutun başına prefix ekleyin.',
    commands: {
      play: ['Çal', 'Şarkı adı, YouTube veya Spotify bağlantısı çal'],
      pause: ['Duraklat', 'Çalan şarkıyı duraklat'],
      resume: ['Devam', 'Duraklatılan şarkıyı devam ettir'],
      skip: ['Atla', 'Çalan şarkıyı atla'],
      stop: ['Durdur', 'Müziği durdur ve ses kanalından ayrıl'],
      queue: ['Sıra', 'Etkileşimli müzik sırasını göster'],
      nowplaying: ['Şimdi Çalıyor', 'Çalan şarkıyı göster'],
    },
  },
  pt: {
    flag: '🇧🇷',
    label: 'Português',
    title: 'Comandos do Bot',
    subtitle: 'Adicione o prefixo antes de cada comando.',
    commands: {
      play: ['Tocar', 'Toque uma música ou link do YouTube/Spotify'],
      pause: ['Pausar', 'Pause a música atual'],
      resume: ['Continuar', 'Continue a música pausada'],
      skip: ['Pular', 'Pule a música atual'],
      stop: ['Parar', 'Pare a música e saia do canal'],
      queue: ['Fila', 'Mostre a fila interativa'],
      nowplaying: ['Tocando Agora', 'Mostre a música atual'],
    },
  },
  de: {
    flag: '🇩🇪',
    label: 'Deutsch',
    title: 'Bot-Befehle',
    subtitle: 'Setze das Präfix vor jeden Befehl.',
    commands: {
      play: ['Abspielen', 'Spiele einen Titel oder YouTube/Spotify-Link'],
      pause: ['Pause', 'Pausiere den aktuellen Titel'],
      resume: ['Fortsetzen', 'Setze den pausierten Titel fort'],
      skip: ['Überspringen', 'Überspringe den aktuellen Titel'],
      stop: ['Stoppen', 'Stoppe die Musik und verlasse den Kanal'],
      queue: ['Warteschlange', 'Zeige die interaktive Warteschlange'],
      nowplaying: ['Jetzt Läuft', 'Zeige den aktuellen Titel'],
    },
  },
  ru: {
    flag: '🇷🇺',
    label: 'Русский',
    title: 'Команды бота',
    subtitle: 'Добавьте префикс перед командой.',
    commands: {
      play: ['Играть', 'Воспроизвести песню или ссылку YouTube/Spotify'],
      pause: ['Пауза', 'Приостановить текущую песню'],
      resume: ['Продолжить', 'Продолжить приостановленную песню'],
      skip: ['Пропустить', 'Пропустить текущую песню'],
      stop: ['Стоп', 'Остановить музыку и выйти из канала'],
      queue: ['Очередь', 'Показать интерактивную очередь'],
      nowplaying: ['Сейчас играет', 'Показать текущую песню'],
    },
  },
  hi: {
    flag: '🇮🇳',
    label: 'हिन्दी',
    title: 'बॉट कमांड',
    subtitle: 'हर कमांड से पहले prefix लगाएँ।',
    commands: {
      play: ['चलाएँ', 'गाना या YouTube/Spotify लिंक चलाएँ'],
      pause: ['रोकें', 'वर्तमान गाना रोकें'],
      resume: ['जारी रखें', 'रुका हुआ गाना जारी रखें'],
      skip: ['छोड़ें', 'वर्तमान गाना छोड़ें'],
      stop: ['बंद करें', 'संगीत बंद करके वॉइस चैनल छोड़ें'],
      queue: ['कतार', 'इंटरैक्टिव संगीत कतार दिखाएँ'],
      nowplaying: ['अभी चल रहा है', 'वर्तमान गाना दिखाएँ'],
    },
  },
  es: {
    flag: '🇪🇸',
    label: 'Español',
    title: 'Comandos del bot',
    subtitle: 'Añade el prefijo antes de cada comando.',
    commands: {
      play: ['Reproducir', 'Reproduce una canción o enlace de YouTube/Spotify'],
      pause: ['Pausar', 'Pausa la canción actual'],
      resume: ['Continuar', 'Continúa la canción pausada'],
      skip: ['Saltar', 'Salta la canción actual'],
      stop: ['Detener', 'Detén la música y sal del canal'],
      queue: ['Cola', 'Muestra la cola interactiva'],
      nowplaying: ['Reproduciendo', 'Muestra la canción actual'],
    },
  },
};

const commandOrder = ['play', 'pause', 'resume', 'skip', 'stop', 'queue', 'nowplaying'];

const commandNames = {
  en: { play: 'play', pause: 'pause', resume: 'resume', skip: 'skip', stop: 'stop', queue: 'queue', nowplaying: 'nowplaying' },
  tr: { play: 'çal', pause: 'duraklat', resume: 'devam', skip: 'atla', stop: 'durdur', queue: 'sıra', nowplaying: 'şimdiçalıyor' },
  pt: { play: 'tocar', pause: 'pausar', resume: 'continuar', skip: 'pular', stop: 'parar', queue: 'fila', nowplaying: 'tocandoagora' },
  de: { play: 'abspielen', pause: 'pause', resume: 'fortsetzen', skip: 'überspringen', stop: 'stoppen', queue: 'warteschlange', nowplaying: 'jetztläuft' },
  ru: { play: 'играть', pause: 'пауза', resume: 'продолжить', skip: 'пропустить', stop: 'стоп', queue: 'очередь', nowplaying: 'сейчасиграет' },
  hi: { play: 'चलाएँ', pause: 'रोकें', resume: 'जारीरखें', skip: 'छोड़ें', stop: 'बंदकरें', queue: 'कतार', nowplaying: 'अभीचलरहाहै' },
  es: { play: 'reproducir', pause: 'pausar', resume: 'continuar', skip: 'saltar', stop: 'detener', queue: 'cola', nowplaying: 'reproduciendo' },
};

function getLocale(code) {
  return locales[code] || locales.en;
}

module.exports = { locales, commandNames, commandOrder, getLocale };
