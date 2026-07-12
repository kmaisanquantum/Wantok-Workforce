const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const JWT_SECRET = process.env.JWT_SECRET || 'wantok-development-secret-2024';
const AuthController = require('../controllers/auth_controller');
const { authMiddleware } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rate_limit');
const maintenanceMiddleware = require('../../admin/middlewares/maintenance');

router.post('/register', maintenanceMiddleware, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/admin-login', loginLimiter, AuthController.login);

// Persona Management
router.post('/select-role', authMiddleware, AuthController.selectRole);
router.patch('/switch-persona', authMiddleware, AuthController.switchPersona);

// Profile
router.patch('/profile', authMiddleware, AuthController.updateProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);

// Availability
router.patch('/availability', authMiddleware, AuthController.toggleAvailability);


// OAuth authentication endpoints
router.get('/:provider', (req, res, next) => {
  const { provider } = req.params;
  if (!['google', 'microsoft', 'oidc'].includes(provider)) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  const role = req.query.role || 'customer';
  const stateObj = { role };
  const base64State = Buffer.from(JSON.stringify(stateObj)).toString('base64');

  let scope = ['email', 'profile'];
  if (provider === 'microsoft') {
    scope = ['user.read'];
  }

  passport.authenticate(provider, {
    state: base64State,
    scope
  })(req, res, next);
});

router.get('/:provider/callback', (req, res, next) => {
  const { provider } = req.params;
  if (!['google', 'microsoft', 'oidc'].includes(provider)) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  passport.authenticate(provider, { session: false }, (err, user, info) => {
    const callbackBase = process.env.OAUTH_CALLBACK_BASE_URL || 'https://wantok.dspng.tech';

    if (err || !user) {
      console.error('❌ OAuth callback failed:', err, info);
      const errMsg = err?.message || info?.message || 'Authentication failed';
      return res.redirect(`${callbackBase}/?authError=${encodeURIComponent(errMsg)}`);
    }

    try {
      const userPersona = user.active_persona || 'customer';
      const token = jwt.sign(
        { id: user.id, role: userPersona, email: user.email, name: user.name, roles: user.roles || [userPersona] },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log(`✅ OAuth successful, redirecting with token for user ${user.email}`);
      return res.redirect(`${callbackBase}/?token=${token}`);
    } catch (tokenErr) {
      console.error('❌ Token signing/redirect error:', tokenErr);
      return res.redirect(`${callbackBase}/?authError=TokenGenerationError`);
    }
  })(req, res, next);
});


module.exports = router;
