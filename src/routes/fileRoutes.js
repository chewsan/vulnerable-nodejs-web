const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Database = require('better-sqlite3');
const { requireLogin } = require('../middleware/auth');
const { log } = require('../utils/logger');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const SANDBOX_DIR = path.join(DATA_DIR, 'sandbox');
const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'app.db');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function getDb() {
  return new Database(DB_PATH);
}

// INTENTIONALLY WEAK MULTER CONFIG: trusts extension and MIME type
// Secure alternative: generate strong random names, enforce strict allowlists, and validate file content.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // INTENTIONALLY PREDICTABLE: uses original name with timestamp
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const name = Date.now() + '-' + safeName;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // INTENTIONALLY TRUSTING: logs MIME type but mostly allows
    if (!file.mimetype) {
      return cb(null, false);
    }
    cb(null, true);
  }
});

router.get('/', requireLogin, (req, res) => {
  const db = getDb();
  try {
    const files = db
      .prepare(
        'SELECT id, original_name, stored_name, mime_type, size, uploader, created_at, note FROM uploads ORDER BY created_at DESC'
      )
      .all();
    res.render('files/index', {
      title: 'File Center',
      files,
      message: null,
      rceBanner: null
    });
  } finally {
    db.close();
  }
});

router.post('/upload', requireLogin, upload.single('file'), (req, res) => {
  const user = req.session.user;
  const file = req.file;
  const db = getDb();
  let rceBanner = null;
  try {
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }

    // Mock processor: never executes code, only simulates detection.
    const dangerousPatterns = ['.js', '.php', '.sh', '.exe', '.bat'];
    const lowerName = file.originalname.toLowerCase();
    const triggered = dangerousPatterns.some((p) => lowerName.endsWith(p));
    if (triggered) {
      // SIMULATED RCE: write to app log, do NOT execute.
      log('SIMULATED_RCE_TRIGGERED', 'Suspicious upload detected', {
        filename: file.originalname,
        stored: file.filename,
        user: user.username
      });
      rceBanner =
        'SIMULATED_RCE_TRIGGERED - this is a training-only simulation logged in app logs.';
    }

    const stmt = db.prepare(
      'INSERT INTO uploads (original_name, stored_name, mime_type, size, uploader, created_at, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      file.originalname,
      file.filename,
      file.mimetype,
      file.size,
      user.username,
      new Date().toISOString(),
      triggered ? 'SIMULATED_RCE_TRIGGERED' : null
    );
    log('UPLOAD', 'File uploaded', {
      filename: file.originalname,
      stored: file.filename,
      user: user.username
    });

    const files = db
      .prepare(
        'SELECT id, original_name, stored_name, mime_type, size, uploader, created_at, note FROM uploads ORDER BY created_at DESC'
      )
      .all();
    res.render('files/index', {
      title: 'File Center',
      files,
      message: 'File uploaded (mock processing complete).',
      rceBanner
    });
  } finally {
    db.close();
  }
});

// Directory listing style behavior: lists all uploaded files metadata
router.get('/list', requireLogin, (req, res) => {
  const db = getDb();
  try {
    const files = db
      .prepare(
        'SELECT id, original_name, stored_name, mime_type, size, uploader, created_at, note FROM uploads ORDER BY created_at DESC'
      )
      .all();
    res.json(files);
  } finally {
    db.close();
  }
});

// IDOR-style access to file details
// INTENTIONALLY MISSING OWNERSHIP CHECKS.
router.get('/view/:id', requireLogin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const db = getDb();
  try {
    const file = db
      .prepare(
        'SELECT id, original_name, stored_name, mime_type, size, uploader, created_at, note FROM uploads WHERE id = ?'
      )
      .get(id);
    if (!file) {
      return res.status(404).send('File not found.');
    }
    res.render('files/view', {
      title: `File #${file.id}`,
      file
    });
  } finally {
    db.close();
  }
});

// LFI / path traversal-style preview within sandbox only
// Vulnerable pattern: weak normalization and exposing "secret" sandbox files.
// Secure alternative: use a strict allowlist of known paths and libraries like path traversal guards.
router.get('/sandbox-preview', requireLogin, (req, res) => {
  const file = req.query.file || '';

  // Weak normalization: strips only obvious patterns but keeps traversal semantics
  const normalized = file.replace(/\\/g, '/').replace(/\.\.+/g, '..');
  const requestedPath = path.join(SANDBOX_DIR, normalized);

  // Hard guard: never leave sandbox directory
  if (!requestedPath.startsWith(SANDBOX_DIR)) {
    return res
      .status(400)
      .send('Access to files outside the lab sandbox is blocked.');
  }

  fs.readFile(requestedPath, 'utf8', (err, content) => {
    if (err) {
      return res
        .status(404)
        .send('Sandbox file not found. This lab only exposes ./data/sandbox.');
    }
    res.render('files/sandbox-preview', {
      title: 'Sandbox File Preview',
      filePath: path.relative(SANDBOX_DIR, requestedPath),
      content
    });
  });
});

module.exports = router;

