const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const AuthController = require('../controllers/auth_controller');
const { authMiddleware } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rate_limit');
const maintenanceMiddleware = require('../../admin/middlewares/maintenance');

router.post('/register', maintenanceMiddleware, AuthController.register);
router.post('/login', loginLimiter, AuthController.login);
router.post('/admin-login', loginLimiter, AuthController.login);

// OAuth Routes
const providers = ['google', 'microsoft', 'oidc'];
providers.forEach(provider => {
  router.get(`/${provider}`, (req, res, next) => {
    let { role, platform } = req.query;
    if (!['customer', 'provider'].includes(role)) role = 'customer';
    const state = Buffer.from(JSON.stringify({ role, platform: platform || 'web' })).toString('base64');
    passport.authenticate(provider === 'oidc' ? 'oidc' : provider, {
      scope: provider === 'google' ? ['profile', 'email'] : (provider === 'microsoft' ? ['user.read', 'openid', 'profile', 'email'] : ['openid', 'profile', 'email']),
      state
    })(req, res, next);
  });

  router.get(`/${provider}/callback`, (req, res, next) => {
    passport.authenticate(provider === 'oidc' ? 'oidc' : provider, { failureRedirect: '/?authError=1' }, (err, user, info) => {
      if (err || !user) {
        return res.redirect('/?authError=1');
      }

      const state = req.query.state ? JSON.parse(Buffer.from(req.query.state, 'base64').toString()) : {};
      const JWT_SECRET = process.env.JWT_SECRET || 'wantok-development-secret-2024';
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      if (user.isNew && state.role === 'provider') {
        // Redirect to provider onboarding if new provider
        if (state.platform === 'native') {
           return res.redirect(`wantok://auth-callback?token=${token}&onboarding=1`);
        } else {
           return res.redirect(`/?token=${token}&onboarding=1`);
        }
      }

      if (state.platform === 'native') {
        return res.redirect(`wantok://auth-callback?token=${token}`);
      } else {
        return res.redirect(`/?token=${token}`);
      }
    })(req, res, next);
  });
});

// Persona Management
router.post('/select-role', authMiddleware, AuthController.selectRole);
router.patch('/switch-persona', authMiddleware, AuthController.switchPersona);

// Profile
router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      active_persona: req.user.active_persona,
      roles: req.user.roles,
      is_available: req.user.is_available,
      avatar_url: req.user.avatar_url,
      primary_skill: req.user.primary_skill,
      location_name: req.user.location_name
    }
  });
});
router.patch('/profile', authMiddleware, AuthController.updateProfile);

// Availability
router.patch('/availability', authMiddleware, AuthController.toggleAvailability);

module.exports = router;
