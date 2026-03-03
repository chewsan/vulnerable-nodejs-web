const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'app.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

function ensureDataDirs() {
  const dirs = [
    DATA_DIR,
    path.join(DATA_DIR, 'uploads'),
    path.join(DATA_DIR, 'sandbox'),
    path.join(DATA_DIR, 'sandbox', 'config'),
    path.join(DATA_DIR, 'sandbox', 'exports'),
    path.join(DATA_DIR, 'sandbox', 'logs'),
    path.join(DATA_DIR, 'sandbox', 'secrets'),
    path.join(DATA_DIR, 'logs')
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function seedSandboxFiles() {
  const sandbox = path.join(DATA_DIR, 'sandbox');
  fs.writeFileSync(
    path.join(sandbox, 'config', 'dev-note.txt'),
    'Developer note: This sandbox file is safe to expose inside the lab.'
  );
  fs.writeFileSync(
    path.join(sandbox, 'exports', 'finance.csv'),
    'id,department,amount\n1,Sales,12000\n2,Marketing,8000\n3,Engineering,15000\n'
  );
  fs.writeFileSync(
    path.join(sandbox, 'logs', 'old-app.log'),
    '[2023-01-01] INFO Old app started\n[2023-01-02] ERROR Old app crashed\n'
  );
  fs.writeFileSync(
    path.join(sandbox, 'secrets', 'demo-config.txt'),
    'DEMO_API_KEY=not-a-real-key\nINTERNAL_FLAG=TRAINING_ONLY'
  );
  // Additional fake finance/export style files
  fs.writeFileSync(
    path.join(sandbox, 'exports', 'finance-q2.csv'),
    'id,department,amount\n4,Sales,13000\n5,Support,5000\n'
  );
  fs.writeFileSync(
    path.join(sandbox, 'exports', 'finance-q3.csv'),
    'id,department,amount\n6,Sales,14000\n7,Research,9000\n'
  );
}

function seedDatabase() {
  ensureDataDirs();
  seedSandboxFiles();

  const db = new Database(DB_PATH);
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  // Clear existing data
  db.exec(`
    DELETE FROM users;
    DELETE FROM tickets;
    DELETE FROM internal_messages;
    DELETE FROM uploads;
    DELETE FROM notes;
    DELETE FROM customers;
    DELETE FROM audit_log;
    VACUUM;
  `);

  const now = new Date();

  const userStmt = db.prepare(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
  );

  // INTENTIONALLY WEAK: simple, common passwords and plaintext storage
  userStmt.run('alice', 'password1', 'user');
  userStmt.run('bob', 'Password123', 'user');
  userStmt.run('admin', 'admin123', 'admin');

  const ticketStmt = db.prepare(
    'INSERT INTO tickets (title, content, status, reporter_name, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  for (let i = 1; i <= 12; i++) {
    ticketStmt.run(
      `Support ticket #${i}`,
      i === 3
        ? 'Sometimes users paste weird HTML into this box...'
        : `User reports intermittent issue #${i}`,
      i % 3 === 0 ? 'pending' : 'open',
      i % 2 === 0 ? 'alice' : 'bob',
      new Date(now.getTime() - i * 3600 * 1000).toISOString()
    );
  }

  const msgStmt = db.prepare(
    'INSERT INTO internal_messages (subject, body, created_at) VALUES (?, ?, ?)'
  );
  for (let i = 1; i <= 10; i++) {
    msgStmt.run(
      `Internal message #${i}`,
      `This is an internal announcement message number ${i}.`,
      new Date(now.getTime() - i * 7200 * 1000).toISOString()
    );
  }

  const uploadStmt = db.prepare(
    'INSERT INTO uploads (original_name, stored_name, mime_type, size, uploader, created_at, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const sampleUploads = [
    ['report-q1.pdf', 'report-q1.pdf', 'application/pdf', 123456],
    ['team-photo.png', 'team-photo.png', 'image/png', 45678],
    ['script.js', 'script.js', 'application/javascript', 9876],
    ['export.csv', 'export.csv', 'text/csv', 6543],
    ['notes.txt', 'notes.txt', 'text/plain', 3210],
    ['diagram.svg', 'diagram.svg', 'image/svg+xml', 1234],
    ['archive.zip', 'archive.zip', 'application/zip', 9999],
    ['legacy-backup.bak', 'legacy-backup.bak', 'application/octet-stream', 7777]
  ];
  sampleUploads.forEach((u, idx) => {
    uploadStmt.run(
      u[0],
      u[1],
      u[2],
      u[3],
      idx % 2 === 0 ? 'alice' : 'bob',
      new Date(now.getTime() - idx * 1800 * 1000).toISOString(),
      idx === 2 ? 'Legacy script kept for reference' : null
    );
  });

  const notesStmt = db.prepare(
    'INSERT INTO notes (title, body, owner, created_at) VALUES (?, ?, ?, ?)'
  );
  for (let i = 1; i <= 10; i++) {
    notesStmt.run(
      `Internal note #${i}`,
      i === 4
        ? 'Some users paste HTML here to highlight text.'
        : `This is the body of internal note number ${i}.`,
      i % 3 === 0 ? 'admin' : 'alice',
      new Date(now.getTime() - i * 5400 * 1000).toISOString()
    );
  }

  const custStmt = db.prepare(
    'INSERT INTO customers (name, email, department, status, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  const departments = ['Sales', 'Support', 'Engineering', 'Finance', 'HR'];
  for (let i = 1; i <= 25; i++) {
    custStmt.run(
      `Customer ${i}`,
      `customer${i}@example.test`,
      departments[i % departments.length],
      i % 4 === 0 ? 'inactive' : 'active',
      new Date(now.getTime() - i * 86400 * 1000).toISOString()
    );
  }

  const auditStmt = db.prepare(
    'INSERT INTO audit_log (event_type, details, actor, created_at) VALUES (?, ?, ?, ?)'
  );
  const events = [
    ['LOGIN', 'User alice logged in', 'alice'],
    ['LOGIN', 'User bob logged in', 'bob'],
    ['LOGIN_FAILURE', 'Failed login for alice', null],
    ['TICKET_CREATED', 'New ticket submitted by public form', null],
    ['NOTE_UPDATED', 'Admin updated internal note', 'admin'],
    ['UPLOAD', 'File report-q1.pdf uploaded', 'alice'],
    ['UPLOAD', 'File script.js uploaded', 'bob'],
    ['DEBUG', 'Debug config viewed', 'admin'],
    ['LAB_RESET', 'Lab reset script executed', 'system'],
    ['SEARCH', 'Customer search run from dashboard', 'alice'],
    ['SEARCH', 'Customer search with filter department=Sales', 'bob'],
    ['TICKET_REVIEW', 'Admin reviewed public ticket queue', 'admin'],
    ['BOT_REVIEW', 'Simulated XSS review bot run', 'system'],
    ['SIMULATED_RCE', 'Pattern detected in uploaded script.js', 'system'],
    ['EXPORT', 'Finance export downloaded', 'admin'],
    ['REPORT', 'Quarterly report viewed', 'alice'],
    ['NOTE_CREATED', 'New note created by alice', 'alice'],
    ['NOTE_CREATED', 'New note created by admin', 'admin'],
    ['UPLOAD', 'Legacy backup uploaded', 'admin'],
    ['LOGIN_FAILURE', 'Failed login for admin', null]
  ];
  events.forEach(([type, details, actor], idx) => {
    auditStmt.run(
      type,
      details,
      actor,
      new Date(now.getTime() - idx * 2700 * 1000).toISOString()
    );
  });

  console.log('Database seeded at', DB_PATH);
  db.close();
}

seedDatabase();

