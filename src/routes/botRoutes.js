const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const { requireAdmin } = require('../middleware/auth');
const { log } = require('../utils/logger');

const router = express.Router();
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'app.db');

function getDb() {
  return new Database(DB_PATH);
}

// Simulated review bot for blind XSS training
// This never executes script; it simply scans content and logs where payloads would have fired.
router.post('/review-tickets', requireAdmin, (req, res) => {
  const db = getDb();
  try {
    const pending = db
      .prepare(
        'SELECT id, title, content, reporter_name, created_at FROM tickets WHERE status = ?'
      )
      .all('pending');

    let findings = 0;
    pending.forEach((t) => {
      // Naive heuristic to simulate detection
      if (/<script[\s>]/i.test(t.content) || /onerror=/i.test(t.content)) {
        findings += 1;
        log('BOT_REVIEW_FINDING', 'Simulated XSS payload detected in ticket', {
          ticketId: t.id
        });
      }
    });

    log('BOT_REVIEW', 'Simulated review bot executed', {
      pendingCount: pending.length,
      findings
    });

    res.render('tickets/bot-review', {
      title: 'Simulated Review Bot',
      pending,
      findings
    });
  } finally {
    db.close();
  }
});

module.exports = router;

