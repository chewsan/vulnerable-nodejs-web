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
  res.render('search/index', {
    title: 'Customer Search',
    results: [],
    query: '',
    info: null
  });
});

// INTENTIONALLY VULNERABLE BLIND SQLI-STYLE SEARCH
// Vulnerable pattern: unsafely concatenating user input into SQL.
// Secure alternative: always use parameterized queries and strict validation.
router.get('/customers', requireLogin, (req, res) => {
  const { q, slow } = req.query;
  const db = getDb();
  try {
    let where = '1=1';
    if (q && q.trim()) {
      // INTENTIONALLY UNSAFE CONCATENATION
      where += ` AND (name LIKE '%${q}%' OR email LIKE '%${q}%')`;
    }
    const sql = `SELECT id, name, email, department, status, created_at FROM customers WHERE ${where} ORDER BY created_at DESC LIMIT 50`;

    if (slow === '1') {
      // Simulate timing differences for blind SQLi-style training
      const delayMs = 1500;
      setTimeout(() => {
        const results = db.prepare(sql).all();
        log('SEARCH', 'Slow customer search executed', {
          q,
          slow: true,
          count: results.length
        });
        res.render('search/index', {
          title: 'Customer Search',
          results,
          query: q || '',
          info:
            'Search completed with an artificial delay to simulate timing analysis.'
        });
      }, delayMs);
    } else {
      const results = db.prepare(sql).all();
      log('SEARCH', 'Customer search executed', {
        q,
        slow: false,
        count: results.length
      });
      res.render('search/index', {
        title: 'Customer Search',
        results,
        query: q || '',
        info: null
      });
    }
  } catch (err) {
    log('SEARCH_ERROR', 'Search failed', { error: err.message });
    throw err;
  } finally {
    // db.close will run even if setTimeout path is used, but a new connection
    // will be created for each request in this simple lab.
    db.close();
  }
});

module.exports = router;

