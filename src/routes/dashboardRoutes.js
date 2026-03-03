const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'app.db');

function getDb() {
  return new Database(DB_PATH);
}

router.get('/dashboard', requireLogin, (req, res) => {
  const db = getDb();
  try {
    const recentTickets = db
      .prepare(
        'SELECT id, title, status, created_at FROM tickets ORDER BY created_at DESC LIMIT 5'
      )
      .all();
    const recentMessages = db
      .prepare(
        'SELECT id, subject, created_at FROM internal_messages ORDER BY created_at DESC LIMIT 5'
      )
      .all();
    const uploadSummary = db
      .prepare(
        'SELECT COUNT(*) AS count, IFNULL(SUM(size),0) AS totalSize FROM uploads'
      )
      .get();
    const recentAudit = db
      .prepare(
        'SELECT id, event_type, details, created_at FROM audit_log ORDER BY created_at DESC LIMIT 5'
      )
      .all();

    res.render('dashboard/index', {
      title: 'Dashboard',
      recentTickets,
      recentMessages,
      uploadSummary,
      recentAudit
    });
  } finally {
    db.close();
  }
});

module.exports = router;

