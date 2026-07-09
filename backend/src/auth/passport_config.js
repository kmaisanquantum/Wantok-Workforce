const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const OpenIDConnectStrategy = require('passport-openidconnect').Strategy;
const UserModel = require('./models/user_model');

const CALLBACK_BASE = process.env.OAUTH_CALLBACK_BASE_URL || 'https://wantok.dspng.tech';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${CALLBACK_BASE}/api/auth/google/callback`,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const state = req.query.state ? JSON.parse(Buffer.from(req.query.state, 'base64').toString()) : {};
      const user = await UserModel.findOrCreateOAuthUser({
        provider: 'google',
        providerUserId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        role: state.role || 'customer',
        avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

// Microsoft Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: `${CALLBACK_BASE}/api/auth/microsoft/callback`,
    passReqToCallback: true,
    scope: ['user.read']
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const state = req.query.state ? JSON.parse(Buffer.from(req.query.state, 'base64').toString()) : {};
      const user = await UserModel.findOrCreateOAuthUser({
        provider: 'microsoft',
        providerUserId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        role: state.role || 'customer',
        avatarUrl: null // Microsoft profile photo requires separate graph call
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

// OpenID Connect Strategy
if (process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET) {
  passport.use('oidc', new OpenIDConnectStrategy({
    issuer: process.env.OIDC_ISSUER,
    authorizationURL: `${process.env.OIDC_ISSUER}/protocol/openid-connect/auth`,
    tokenURL: `${process.env.OIDC_ISSUER}/protocol/openid-connect/token`,
    userInfoURL: `${process.env.OIDC_ISSUER}/protocol/openid-connect/userinfo`,
    clientID: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    callbackURL: `${CALLBACK_BASE}/api/auth/oidc/callback`,
    passReqToCallback: true
  }, async (req, issuer, profile, done) => {
    try {
      const state = req.query.state ? JSON.parse(Buffer.from(req.query.state, 'base64').toString()) : {};
      const user = await UserModel.findOrCreateOAuthUser({
        provider: 'oidc',
        providerUserId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        role: state.role || 'customer',
        avatarUrl: null
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

module.exports = passport;
