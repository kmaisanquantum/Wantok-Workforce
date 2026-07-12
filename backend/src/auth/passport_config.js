const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const OpenIDConnectStrategy = require('passport-openidconnect').Strategy;
const UserModel = require('./models/user_model');

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

// Helper verify callback
const verifyCallback = (provider) => async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || profile.email;
    if (!email) {
      return done(null, false, { message: 'no_email' });
    }

    // Extract role from base64 state carrying the selected role
    let role = 'customer';
    const stateParam = req.query.state;
    if (stateParam) {
      try {
        const decodedState = Buffer.from(stateParam, 'base64').toString('utf8');
        const parsedState = JSON.parse(decodedState);
        if (parsedState && parsedState.role) {
          role = parsedState.role;
        }
      } catch (e) {
        if (['customer', 'provider'].includes(stateParam)) {
          role = stateParam;
        }
      }
    }

    const displayName = profile.displayName || profile.name || email.split('@')[0];
    const user = await UserModel.findOrCreateOAuthUser({
      email,
      name: displayName,
      provider,
      role
    });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Registering Google OAuth Strategy');
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    passReqToCallback: true
  }, verifyCallback('google')));
} else {
  console.log('⚠️ Google OAuth credentials missing. Strategy not registered.');
}

// Microsoft Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  console.log('✅ Registering Microsoft OAuth Strategy');
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: '/api/auth/microsoft/callback',
    passReqToCallback: true,
    scope: ['user.read']
  }, verifyCallback('microsoft')));
} else {
  console.log('⚠️ Microsoft OAuth credentials missing. Strategy not registered.');
}

// OIDC Strategy
if (process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET) {
  console.log('✅ Registering OIDC OAuth Strategy');
  passport.use('oidc', new OpenIDConnectStrategy({
    issuer: process.env.OIDC_ISSUER,
    authorizationURL: `${process.env.OIDC_ISSUER}/protocol/openid-connect/auth`,
    tokenURL: `${process.env.OIDC_ISSUER}/protocol/openid-connect/token`,
    userInfoURL: `${process.env.OIDC_ISSUER}/protocol/openid-connect/userinfo`,
    clientID: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    callbackURL: '/api/auth/oidc/callback',
    passReqToCallback: true
  }, verifyCallback('oidc')));
} else {
  console.log('⚠️ OIDC credentials missing. Strategy not registered.');
}

module.exports = passport;
