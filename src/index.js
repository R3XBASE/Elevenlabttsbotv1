require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const BotState = require('./state');
const { generateSpeech } = require('./api');
const { handleCommand } = require('./commands');
const { parseCommand, sleep } = require('./utils');
const fs = require('fs').promises;

async function main() {
  console.log('Starting Telegram TTS Bot...');

  // Initialize environment variables
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) throw new Error('BOT_TOKEN must be set');

  const adminIds = process.env.ADMIN_IDS
    ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim()))
    : [];
  const initialApiKeys = process.env.ELEVENLABS_API_KEYS
    ? process.env.ELEVENLABS_API_KEYS.split(',').map(key => key.trim())
    : [];

  // Initialize bot state
  const state = new BotState();
  state.adminIds = adminIds;
  state.apiKeys = initialApiKeys;
  await state.loadFromFile();

  // Initialize Telegram bot
  const bot = new TelegramBot(botToken, { polling: true });

  // Handle messages
  bot.on('message', async msg => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const text = msg.text;
      const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
      const userMention = msg.from.username
        ? `@${msg.from.username}`
        : msg.from.first_name || 'User';
      const userName = msg.from.first_name || msg.from.username || 'User';

      if (!text) return;

      // Check for commands
      const command = parseCommand(text);
      if (command) {
        await handleCommand(bot, msg, command, state);
        return;
      }

      // Check maintenance mode
      if (state.maintenance) {
        await bot.sendMessage(chatId, '🔧 Bot sedang dalam maintenance mode.');
        return;
      }

      // Get API key and voice ID
      const apiKey = state.getNextApiKey();
      if (!apiKey) {
        await bot.sendMessage(chatId, '❌ Tidak ada API key yang tersedia. Hubungi admin.');
        return;
      }

      const voiceId = state.userModels.get(userId) || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel

      // Handle 'tts ' prefix (works in both private and group chats)
      if (text.toLowerCase().startsWith('tts ')) {
        const ttsText = text.slice(4).trim();
        if (!ttsText) {
          await bot.sendMessage(chatId, '❌ Masukkan teks setelah "tts ". Contoh: tts Halo, apa kabar?');
          return;
        }

        if (ttsText.length > 1000) {
          await bot.sendMessage(chatId, '❌ Teks terlalu panjang. Maksimal 1000 karakter.');
          return;
        }

        // Show typing indicator
        await bot.sendChatAction(chatId, 'typing');
        await sleep(2000 + Math.random() * 3000); // Natural delay (2-5s)

        // Generate and send audio
        const statusMsg = await bot.sendMessage(chatId, '🎙️ Generating audio...');
        try {
          const audioFile = await generateSpeech(ttsText, voiceId, apiKey);
          await bot.deleteMessage(chatId, statusMsg.message_id);
          await bot.sendVoice(chatId, audioFile);
          await fs.unlink(audioFile); // Clean up
        } catch (err) {
          await bot.deleteMessage(chatId, statusMsg.message_id);
          await bot.sendMessage(chatId, `❌ Error generating audio: ${err.message}`);
        }
        return;
      }

      // Handle 'voiceme ' prefix (group chats only)
      if (isGroup && text.toLowerCase().startsWith('voiceme ')) {
        const ttsText = text.slice(8).trim();
        if (!ttsText) {
          await bot.sendMessage(chatId, '❌ Masukkan teks setelah "voiceme ". Contoh: voiceme Halo, apa kabar?');
          return;
        }

        if (ttsText.length > 1000) {
          await bot.sendMessage(chatId, '❌ Teks terlalu panjang. Maksimal 1000 karakter.');
          return;
        }

        // Delete the user's message
        try {
          await bot.deleteMessage(chatId, msg.message_id);
        } catch (err) {
          console.error('Error deleting message:', err);
        }

        // Show typing indicator
        await bot.sendChatAction(chatId, 'typing');
        await sleep(2000 + Math.random() * 3000); // Natural delay (2-5s)

        // Generate and send audio with user mention
        const statusMsg = await bot.sendMessage(chatId, `${userName}\n${userMention} use voiceme!`);
        try {
          const audioFile = await generateSpeech(ttsText, voiceId, apiKey);
          await bot.deleteMessage(chatId, statusMsg.message_id);
          await bot.sendVoice(chatId, audioFile, { caption: `${userName}\n${userMention}` });
          await fs.unlink(audioFile); // Clean up
        } catch (err) {
          await bot.deleteMessage(chatId, statusMsg.message_id);
          await bot.sendMessage(chatId, `❌ Error generating audio for ${userMention}: ${err.message}`);
        }
        return;
      }

      // Ignore messages without 'tts ' or 'voiceme ' prefix
    } catch (err) {
      console.error('Error handling message:', err);
      await bot.sendMessage(msg.chat.id, '❌ Terjadi kesalahan. Coba lagi nanti.');
    }
  });

  console.log('Bot is running...');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});