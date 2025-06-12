const axios = require('axios');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

async function generateSpeech(text, voiceId, apiKey) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        responseType: 'arraybuffer',
      }
    );

    if (response.status === 200) {
      const fileName = `audio_${uuidv4()}.mp3`;
      await fs.writeFile(fileName, response.data);
      return fileName;
    } else {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }
  } catch (err) {
    throw new Error(`ElevenLabs API error: ${err.message}`);
  }
}

module.exports = { generateSpeech };