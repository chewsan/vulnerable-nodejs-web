const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'data', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function log(eventType, message, meta = {}) {
  ensureLogDir();
  const entry = {
    timestamp: new Date().toISOString(),
    eventType,
    message,
    meta
  };
  const line = JSON.stringify(entry) + '\n';
  // Simple append for training lab (no log rotation)
  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to write log entry', err);
    }
  });
}

module.exports = {
  log,
  LOG_FILE
};

