function parseCommand(text) {
  const match = text.match(/^\/(\w+)(?:\s+(.+))?$/);
  if (!match) return null;
  return { command: `/${match[1]}`, args: match[2] || '' };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { parseCommand, sleep };