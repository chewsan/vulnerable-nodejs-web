require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');

const { enforceLabMode, attachBannerAndUser } = require('./middleware/labMode');
const { log } = require('./utils/logger');
const expressLayouts = require('express-ejs-layouts');



// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const searchRoutes = require('./routes/searchRoutes');
const fileRoutes = require('./routes/fileRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dependencyRoutes = require('./routes/dependencyRoutes');
const debugRoutes = require('./routes/debugRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const botRoutes = require('./routes/botRoutes');

const app = express();

// LAB MODE GATE: refuse startup unless LAB_MODE=true
if (process.env.LAB_MODE !== 'true') {
  // eslint-disable-next-line no-console
  console.error(
    'LAB_MODE must be true to run this intentionally insecure training lab.'
  );
  process.exit(1);
}

const allowRemote = process.env.ALLOW_REMOTE === 'true';
const ack = process.env.I_UNDERSTAND_THIS_IS_AN_INSECURE_LAB;

let host = process.env.HOST || '127.0.0.1';
if (allowRemote) {
  if (ack !== 'yes') {
    // eslint-disable-next-line no-console
    console.error(
      'ALLOW_REMOTE is true, but I_UNDERSTAND_THIS_IS_AN_INSECURE_LAB is not "yes". Refusing to start.'
    );
    process.exit(1);
  }
  // INTENTIONALLY LOOSER: allow binding to all interfaces in lab demo
  host = '0.0.0.0';
  // eslint-disable-next-line no-console
  console.warn(
    '*** CRITICAL WARNING *** ALLOW_REMOTE=true. This intentionally insecure lab is exposed beyond localhost.'
  );
}

const port = parseInt(process.env.PORT || '3000', 10);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    // INTENTIONALLY WEAK: simple session secret and cookie flags for training
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: false, // should be true in production
      secure: false, // should be true when using HTTPS
      sameSite: 'lax'
    }
  })
);

app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(enforceLabMode());
app.use(attachBannerAndUser());

app.use((req, res, next) => {
  res.locals.isAdmin = req.session.user && req.session.user.role === 'admin';
  next();
});

app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/tickets', ticketRoutes);
app.use('/search', searchRoutes);
app.use('/files', fileRoutes);
app.use('/settings', settingsRoutes);
app.use('/dependencies', dependencyRoutes);
app.use('/debug', debugRoutes);
app.use('/training', trainingRoutes);
app.use('/bot', botRoutes);

app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  return res.redirect('/dashboard');
});

// Verbose error handler in lab mode
// INTENTIONALLY VERBOSE: exposes stack traces for training
// Secure alternative: log stack server-side and show generic message to users.
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error', err);
  log('ERROR', err.message, {
    stack: err.stack,
    path: req.path
  });
  res
    .status(500)
    .send(
      `<h1>Lab error</h1><pre>${err.message}\n\n${err.stack}</pre><p>This verbose output is for training only and must never be enabled in production.</p>`
    );
});

app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Intentionally insecure training lab running at http://${host}:${port}`
  );
});

module.exports = app;

