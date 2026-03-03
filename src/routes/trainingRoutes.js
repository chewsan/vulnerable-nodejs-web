const express = require('express');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, (req, res) => {
  const modules = [
    {
      name: 'Authentication',
      path: '/auth/login',
      objectives: [
        'Explore weak password policy and insecure login logic.',
        'Identify missing rate limiting and verbose error messages.'
      ]
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      objectives: [
        'Understand how multiple data sources are aggregated.',
        'Use as a hub to navigate to other modules.'
      ]
    },
    {
      name: 'Ticketing / Admin Review',
      path: '/tickets/submit',
      objectives: [
        'Trace public ticket submission to admin review.',
        'Identify and reason about blind XSS-style issues.'
      ]
    },
    {
      name: 'Search / Reporting',
      path: '/search',
      objectives: [
        'Practice blind SQL injection-style analysis.',
        'Observe differences in responses, results, and timing.'
      ]
    },
    {
      name: 'File Center',
      path: '/files',
      objectives: [
        'Investigate upload validation weaknesses.',
        'Explore sandboxed file preview and path traversal concepts.'
      ]
    },
    {
      name: 'Settings / Internal Notes',
      path: '/settings',
      objectives: [
        'Identify stored XSS and missing CSRF.',
        'Recognize IDOR-style access to internal resources.'
      ]
    },
    {
      name: 'Dependency Demo',
      path: '/dependencies',
      objectives: [
        'Discuss legacy dependencies and SCA findings.',
        'Plan modernization and patching strategies.'
      ]
    },
    {
      name: 'Debug & Lab Controls',
      path: '/debug/config',
      objectives: [
        'Review lab-only debug surfaces.',
        'Emphasize why these must never be exposed in production.'
      ]
    }
  ];

  res.render('training/index', {
    title: 'Training Notes',
    modules
  });
});

module.exports = router;

