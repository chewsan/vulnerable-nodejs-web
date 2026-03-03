const express = require('express');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Exposed debug config in lab mode
// INTENTIONALLY EXCESSIVE: exposes environment-style information.
// Secure alternative: restrict to offline diagnostics and avoid serving via HTTP.
router.get('/config', requireAdmin, (req, res) => {
  const config = {
    host: process.env.HOST || '127.0.0.1',
    port: process.env.PORT || 3000,
    labMode: process.env.LAB_MODE,
    allowRemote: process.env.ALLOW_REMOTE,
    // INTENTIONALLY LEAKING SHAPE OF SECRETS (values truncated)
    sessionSecretPreview: (process.env.SESSION_SECRET || 'change-me').slice(
      0,
      4
    ),
    dbPath: process.env.DB_PATH || './data/app.db',
    // Hardcoded demo secrets for training
    demoSecrets: {
      DEMO_API_KEY: 'demo-api-key-1234',
      DEMO_SIGNING_KEY: 'demo-signing-key-not-for-production'
    }
  };
  res.render('debug/config', {
    title: 'Debug Config (Lab Only)',
    config
  });
});

module.exports = router;

