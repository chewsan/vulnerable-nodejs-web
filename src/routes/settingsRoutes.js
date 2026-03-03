const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const { requireLogin } = require('../middleware/auth');
const { log } = require('../utils/logger');

const router = express.Router();
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'app.db');

function getDb() {
  return new Database(DB_PATH);
}

router.get('/', requireLogin, (req, res) => {
  const db = getDb();
  try {
    const notes = db
      .prepare(
        'SELECT id, title, body, owner, created_at FROM notes ORDER BY created_at DESC'
      )
      .all();
    res.render('settings/index', {
      title: 'Settings & Internal Notes',
      notes,
      message: null
    });
  } finally {
    db.close();
  }
});

// INTENTIONALLY MISSING CSRF PROTECTION AND OUTPUT ENCODING.
// Vulnerabilities:
//  - Stored XSS via note body.
//  - Missing CSRF token on POST.
// Secure alternative: add CSRF tokens and encode content on output.
router.post('/notes', requireLogin, (req, res) => {
  const user = req.session.user;
  const { title, body } = req.body;
  const db = getDb();
  try {
    const stmt = db.prepare(
      'INSERT INTO notes (title, body, owner, created_at) VALUES (?, ?, ?, ?)'
    );
    stmt.run(
      title || 'Untitled',
      body || '',
      user.username,
      new Date().toISOString()
    );
    log('NOTE_CREATED', 'Note created', { owner: user.username });
    const notes = db
      .prepare(
        'SELECT id, title, body, owner, created_at FROM notes ORDER BY created_at DESC'
      )
      .all();
    res.render('settings/index', {
      title: 'Settings & Internal Notes',
      notes,
      message: 'Note saved (CSRF protection intentionally disabled in lab).'
    });
  } finally {
    db.close();
  }
});

// IDOR-style access: any logged-in user can view any note by ID
router.get('/notes/:id', requireLogin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = getDb();
  try {
    const note = db
      .prepare(
        'SELECT id, title, body, owner, created_at FROM notes WHERE id = ?'
      )
      .get(id);
    if (!note) {
      return res.status(404).send('Note not found.');
    }
    res.render('settings/view-note', {
      title: `Note #${note.id}`,
      note
    });
  } finally {
    db.close();
  }
});

module.exports = router;

