const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const { log } = require('../utils/logger');

const router = express.Router();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'app.db');

function getDb() {
  return new Database(DB_PATH);
}

router.get('/auth/login', (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    error: null
  });
});

// INTENTIONALLY WEAK: no rate limiting, verbose errors, and plaintext passwords
// Secure alternative: implement rate limiting, password hashing, and generic error messages.
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    if (!user || user.password !== password) {
      log('LOGIN_FAILURE', 'Invalid credentials', { username, ip: req.ip });
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid username or password (lab shows verbose errors).'
      });
    }
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    log('LOGIN', 'User logged in', { username: user.username, ip: req.ip });
    return res.redirect('/dashboard');
  } finally {
    db.close();
  }
});

router.get('/auth/logout', (req, res) => {
  const username = req.session.user && req.session.user.username;
  req.session.destroy(() => {
    log('LOGOUT', 'User logged out', { username });
    res.redirect('/auth/login');
  });
});

// INTENTIONALLY INSECURE LOGIN BYPASS ROUTE (LAB ONLY)
// WARNING: This route demonstrates unsafe authentication logic.
// Vulnerable pattern: trusting user-controlled branch to short-circuit checks.
// Secure alternative: always validate credentials against a trusted user store.
router.post('/auth/lab-insecure-login', (req, res) => {
  const { username, password, fastPath } = req.body;
  const db = getDb();
  try {
    let user = null;
    if (fastPath === '1') {
      // INTENTIONALLY BAD: "fast path" that trusts username alone
      const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
      user = stmt.get(username);
    } else {
      const stmt = db.prepare(
        'SELECT * FROM users WHERE username = ? AND password = ?'
      );
      user = stmt.get(username, password);
    }

    if (!user) {
      log('LOGIN_FAILURE', 'Lab insecure login failed', { username });
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Lab insecure login path failed.'
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    log('LOGIN', 'Lab insecure login used', {
      username: user.username,
      ip: req.ip,
      fastPath
    });
    return res.redirect('/dashboard');
  } finally {
    db.close();
  }
});

module.exports = router;

