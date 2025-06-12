const fs = require('fs').promises;
const path = require('path');

class BotState {
  constructor() {
    this.apiKeys = [];
    this.currentApiIndex = 0;
    this.voiceModels = new Map([
      ['21m00Tcm4TlvDq8ikWAM', { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' }],
      ['AZnzlk1XvdvUeBnXmlld', { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' }],
      ['EXAVITQu4vr4xnSDxMaL', { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' }],
      ['ErXwobaYiN019PkySvjV', { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' }],
      ['MF3mGyEYCl7XYWbV9V6O', { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' }],
      ['TxGEqnHWrfWFTfGW9XjX', { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' }],
      ['VR6AewLTigWG4xSOukaG', { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold' }],
      ['pNInz6obpgDQGcFmaJgB', { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' }],
      ['yoZ06aMxZJJ28mfd3POQ', { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam' }],
      ['CYw3kZ02Hs0563khs1Fj', { id: 'CYw3kZ02Hs0563khs1Fj', name: 'Dave' }],
    ]);
    this.userModels = new Map();
    this.maintenance = false;
    this.adminIds = [];
  }

  getNextApiKey() {
    if (this.apiKeys.length === 0) return null;
    const apiKey = this.apiKeys[this.currentApiIndex];
    this.currentApiIndex = (this.currentApiIndex + 1) % this.apiKeys.length;
    return apiKey;
  }

  addApiKey(apiKey) {
    if (!this.apiKeys.includes(apiKey)) {
      this.apiKeys.push(apiKey);
    }
  }

  addVoiceModel(modelId, name) {
    this.voiceModels.set(modelId, { id: modelId, name });
  }

  isAdmin(userId) {
    return this.adminIds.includes(userId);
  }

  async saveToFile() {
    const data = {
      apiKeys: this.apiKeys,
      voiceModels: Object.fromEntries(this.voiceModels),
      userModels: Object.fromEntries(this.userModels),
      maintenance: this.maintenance,
    };
    await fs.writeFile('bot_data.json', JSON.stringify(data, null, 2));
  }

  async loadFromFile() {
    try {
      if (await fs.access('bot_data.json').then(() => true).catch(() => false)) {
        const data = JSON.parse(await fs.readFile('bot_data.json', 'utf-8'));
        this.apiKeys = data.apiKeys || [];
        this.voiceModels = new Map(Object.entries(data.voiceModels || {}));
        this.userModels = new Map(Object.entries(data.userModels || {}));
        this.maintenance = data.maintenance || false;
      }
    } catch (err) {
      console.error('Error loading bot state:', err);
    }
  }
}

module.exports = BotState;