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

// Public ticket submission (Blind XSS sink)
router.get('/submit', (req, res) => {
  res.render('tickets/submit', {
    title: 'Submit Support Ticket',
    message: null
  });
});

// INTENTIONALLY UNSANITIZED STORAGE: Blind XSS training sink.
// Secure alternative: validate/encode input and store safely, then encode on output.
router.post('/submit', (req, res) => {
  const { name, title, content } = req.body;
  const db = getDb();
  try {
    const stmt = db.prepare(
      'INSERT INTO tickets (title, content, status, reporter_name, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(
      title || 'Untitled',
      content || '',
      'pending',
      name || 'anonymous',
      new Date().toISOString()
    );
    log('TICKET_CREATED', 'Public ticket submitted', {
      reporter: name || 'anonymous'
    });
    res.render('tickets/submit', {
      title: 'Submit Support Ticket',
      message: 'Thank you. Your ticket has been queued for review.'
    });
  } finally {
    db.close();
  }
});

// Admin review page (Blind XSS view)
router.get('/admin', requireAdmin, (req, res) => {
  const db = getDb();
  try {
    const tickets = db
      .prepare(
        'SELECT id, title, content, status, reporter_name, created_at FROM tickets ORDER BY created_at DESC'
      )
      .all();
    res.render('tickets/admin', {
      title: 'Ticket Review (Admin)',
      tickets
    });
  } finally {
    db.close();
  }
});

// INTENTIONALLY LAX: basic IDOR-style pattern on ticket IDs for training
// Secure alternative: check permissions for the current user and ticket ownership.
router.get('/view/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = getDb();
  try {
    const ticket = db
      .prepare(
        'SELECT id, title, content, status, reporter_name, created_at FROM tickets WHERE id = ?'
      )
      .get(id);
    if (!ticket) {
      return res.status(404).send('Ticket not found in lab database.');
    }
    res.render('tickets/view', {
      title: `Ticket #${ticket.id}`,
      ticket
    });
  } finally {
    db.close();
  }
});

module.exports = router;

