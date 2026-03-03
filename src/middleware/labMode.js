const { log } = require('../utils/logger');

function enforceLabMode() {
  return (req, res, next) => {
    const labMode = process.env.LAB_MODE;
    if (labMode !== 'true') {
      // Prevent accidental non-lab usage entirely
      const msg =
        'LAB_MODE must be true to run this intentionally insecure training lab.';
      log('LAB_MODE_VIOLATION', msg, { ip: req.ip });
      return res
        .status(503)
        .send('This application only runs in LAB_MODE. Set LAB_MODE=true.');
    }
    res.locals.labMode = true;
    res.locals.env = {
      host: process.env.HOST || '127.0.0.1',
      port: process.env.PORT || 3000
    };
    next();
  };
}

function attachBannerAndUser() {
  return (req, res, next) => {
    res.locals.warningBanner = 'INTENTIONALLY INSECURE TRAINING LAB';
    res.locals.currentUser = req.session && req.session.user;
    next();
  };
}

module.exports = {
  enforceLabMode,
  attachBannerAndUser
};

