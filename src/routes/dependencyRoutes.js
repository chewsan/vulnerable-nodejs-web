const express = require('express');
const moment = require('moment');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, (req, res) => {
  const now = new Date();
  res.render('dependencies/index', {
    title: 'Dependency Demo',
    nowIso: now.toISOString(),
    // INTENTIONALLY USING MOMENT.JS AS LEGACY DEPENDENCY.
    // This is kept to drive SCA and modernization discussions.
    nowHuman: moment(now).format('YYYY-MM-DD HH:mm:ss'),
    note:
      'moment.js is intentionally included as a legacy dependency to trigger SCA findings and remediation conversations.'
  });
});

module.exports = router;

