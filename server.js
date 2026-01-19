'use strict';

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  name: 'hatchery.sid',
  secret: process.env.SESSION_SECRET || 'change_this_long_random_string',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

if (!ADMIN_PASSWORD_HASH) {
  console.warn('WARNING: No ADMIN_PASSWORD_HASH set. Create a hash and set ADMIN_PASSWORD_HASH in your environment.');
}

// Authentication helper: supports bcrypt hash or plain text in ADMIN_PASSWORD_HASH
async function verifyPassword(plain) {
  if (!ADMIN_PASSWORD_HASH) return false;
  // if looks like bcrypt hash, use bcrypt.compare
  if (ADMIN_PASSWORD_HASH.startsWith('$2')) {
    try { return await bcrypt.compare(plain, ADMIN_PASSWORD_HASH); }
    catch (e) { console.error('bcrypt compare error', e); return false; }
  }
  // fallback: compare plaintext (use only for convenience/testing)
  return plain === ADMIN_PASSWORD_HASH;
}

function requireAuth(req, res, next) {
  if (req.path.startsWith('/login') || req.path.startsWith('/assets') || req.path.startsWith('/static')) return next();
  if (req.session && req.session.authenticated) return next();
  return res.redirect('/login');
}

app.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.redirect('/login?error=1');
  if (username !== ADMIN_USERNAME) return res.redirect('/login?error=1');

  try {
    const ok = await verifyPassword(password);
    if (ok) {
      req.session.authenticated = true;
      return res.redirect('/');
    }
  } catch (err) {
    console.error('verify error', err);
  }
  return res.redirect('/login?error=1');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('hatchery.sid');
    res.redirect('/login');
  });
});

app.use(requireAuth);
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => res.status(404).send('Not found'));

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
