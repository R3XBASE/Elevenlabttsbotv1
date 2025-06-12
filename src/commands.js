const BotState = require('./state');

async function handleCommand(bot, msg, command, state) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const isAdmin = state.isAdmin(userId);

  switch (command.command) {
    case '/help':
      await bot.sendMessage(chatId, `
🤖 *Telegram TTS Bot dengan ElevenLabs*

📝 *Cara Penggunaan:*
• Kirim teks untuk diubah menjadi audio
• Maksimal 1000 karakter per pesan

🎵 *Commands:*
/help - Tampilkan bantuan
/models - Lihat daftar model suara
/setmodel <model\\_id> - Ganti model suara
tts <pesan> untuk menghasilkan tts tanpa tanda / diawal
• (Group only) Kirim "voiceme <teks>" tanpa tanda / diawal untuk menggunakan tts sebagai pesan suara!

👨‍💼 *Admin Commands:*
/addmodel <model\\_id> <nama> - Tambah model
/newapi <api\\_key> - Tambah API key
/mt - Maintenance mode
/launch - Aktifkan bot
/status - Status bot
      `, { parse_mode: 'Markdown' });
      break;

    case '/models':
      let modelsText = '🎵 *Available Voice Models:*\n\n';
      for (const [id, model] of state.voiceModels) {
        modelsText += `• \`${id}\` - ${model.name}\n`;
      }
      modelsText += '\n💡 Gunakan /setmodel <model\\_id> untuk ganti suara';
      await bot.sendMessage(chatId, modelsText, { parse_mode: 'Markdown' });
      break;

    case '/setmodel':
      if (!command.args) {
        await bot.sendMessage(chatId, '❌ Masukkan model ID. Contoh: /setmodel 21m00Tcm4TlvDq8ikWAM');
        return;
      }
      if (state.voiceModels.has(command.args)) {
        state.userModels.set(userId, command.args);
        await state.saveToFile();
        const modelName = state.voiceModels.get(command.args).name;
        await bot.sendMessage(chatId, `✅ Model suara berhasil diubah ke: ${modelName} (${command.args})`);
      } else {
        await bot.sendMessage(chatId, '❌ Model ID tidak ditemukan. Gunakan /models untuk melihat daftar model.');
      }
      break;

    case '/addmodel':
      if (!isAdmin) {
        await bot.sendMessage(chatId, '❌ Command ini hanya untuk admin.');
        return;
      }
      const [modelId, ...nameParts] = command.args.split(' ');
      const name = nameParts.join(' ');
      if (!modelId || !name) {
        await bot.sendMessage(chatId, '❌ Format: /addmodel <model\\_id> <nama>');
        return;
      }
      state.addVoiceModel(modelId, name);
      await state.saveToFile();
      await bot.sendMessage(chatId, `✅ Model suara berhasil ditambahkan: ${name} (${modelId})`);
      break;

    case '/newapi':
      if (!isAdmin) {
        await bot.sendMessage(chatId, '❌ Command ini hanya untuk admin.');
        return;
      }
      if (!command.args) {
        await bot.sendMessage(chatId, '❌ Masukkan API key. Contoh: /newapi your\\_api\\_key');
        return;
      }
      state.addApiKey(command.args);
      await state.saveToFile();
      await bot.sendMessage(chatId, '✅ API key berhasil ditambahkan.');
      break;

    case '/mt':
      if (!isAdmin) {
        await bot.sendMessage(chatId, '❌ Command ini hanya untuk admin.');
        return;
      }
      state.maintenance = true;
      await state.saveToFile();
      await bot.sendMessage(chatId, '🔧 Bot telah diset ke maintenance mode.');
      break;

    case '/launch':
      if (!isAdmin) {
        await bot.sendMessage(chatId, '❌ Command ini hanya untuk admin.');
        return;
      }
      state.maintenance = false;
      await state.saveToFile();
      await bot.sendMessage(chatId, '🚀 Bot telah diaktifkan kembali.');
      break;

    case '/status':
      if (!isAdmin) {
        await bot.sendMessage(chatId, '❌ Command ini hanya untuk admin.');
        return;
      }
      await bot.sendMessage(chatId, `
📊 *Bot Status:*

🔧 Maintenance: ${state.maintenance ? 'ON' : 'OFF'}
🔑 API Keys: ${state.apiKeys.length}
🎵 Voice Models: ${state.voiceModels.size}
👥 Users with custom models: ${state.userModels.size}
      `, { parse_mode: 'Markdown' });
      break;

    default:
      await bot.sendMessage(chatId, '❌ Command tidak dikenal. Gunakan /help untuk melihat daftar command.');
  }
}

module.exports = { handleCommand };