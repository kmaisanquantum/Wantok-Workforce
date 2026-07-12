const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user_model');
const redisClient = require('../../../db/redis_init');

const JWT_SECRET = process.env.JWT_SECRET || 'wantok-development-secret-2024';

class AuthController {
  static async register(req, res) {
    console.log('📥 Registration request received:', { ...req.body, password: '****' });
    try {
      const { name, phone, password, role } = req.body;
      const email = req.body.email?.toLowerCase().trim();

      if (!name || !phone || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const userRole = role || 'customer';
      if (!['customer', 'provider'].includes(userRole)) {
        return res.status(400).json({ error: 'Invalid role selection' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      console.log('🔐 Hashing password...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      console.log('🗄️ Saving user to database...');
      const user = await UserModel.create({
        name,
        phone,
        email,
        passwordHash,
        role: userRole
      });

      console.log('🎟️ Issuing JWT session...');
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      if (redisClient) {
        try {
          await redisClient.incr(userRole === 'provider' ? 'metrics:total_providers' : 'metrics:total_customers');
        } catch (redisErr) {
          console.error('⚠️ Redis metrics update failed but continuing registration:', redisErr.message);
        }
      }
      console.log('✅ Registration successful for:', email, 'Role:', userRole);
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone_number,
          role: user.role,
          roles: [user.role],
          is_available: user.is_available
        }
      });
    } catch (error) {
      console.error('❌ Registration Error:', error);
      if (error.code === '23505') return res.status(409).json({ error: 'Email or phone number already registered' });
      return res.status(500).json({ error: 'Internal server error during registration', details: error.message });
    }
  }

  static async login(req, res) {
    console.log('📥 Login attempt:', req.body.identifier);
    try {
      const { password } = req.body;
      const identifier = req.body.identifier?.toLowerCase().trim();

      if (!identifier || !password) {
        return res.status(400).json({ error: 'Identifier and password are required' });
      }

      const user = await UserModel.findByIdentifier(identifier);
      if (!user) {
        console.warn(`🚫 Login failed: User not found (${identifier})`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('🔐 Verifying credentials...');
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        console.warn(`🚫 Login failed: Password mismatch for ${identifier}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const userPersona = user.active_persona || 'customer';
      const token = jwt.sign({ id: user.id, role: userPersona }, JWT_SECRET, { expiresIn: '7d' });

      console.log('✅ Login successful:', user.email);
      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          active_persona: userPersona,
          roles: user.roles || [userPersona],
          is_available: user.is_available,
          primary_skill: user.primary_skill,
          location_name: user.location_name
        }
      });
    } catch (error) {
      console.error('❌ Login Error:', error);
      return res.status(500).json({ error: 'Internal server error during login', details: error.message });
    }
  }

  static async selectRole(req, res) {
    try {
      const { role } = req.body;
      const userId = req.user.id;

      if (!['customer', 'provider'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      console.log(`👤 User ${userId} selecting initial role: ${role}`);
      await UserModel.addRole(userId, role);
      const updated = await UserModel.updateActivePersona(userId, role);

      return res.status(200).json({
        message: 'Role selected successfully',
        active_persona: updated.active_persona
      });
    } catch (error) {
      console.error('❌ selectRole Error:', error);
      return res.status(500).json({ error: 'Failed to select role' });
    }
  }

  static async switchPersona(req, res) {
    try {
      const { role } = req.body;
      const userId = req.user.id;

      if (!['customer', 'provider', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      console.log(`🔄 User ${userId} switching active persona to: ${role}`);
      const user = await UserModel.findById(userId);
      if (!user.roles.includes(role)) {
        console.log(`➕ Adding missing role ${role} to user ${userId}`);
        await UserModel.addRole(userId, role);
      }

      const updated = await UserModel.updateActivePersona(userId, role);
      return res.status(200).json({
        message: 'Persona switched successfully',
        active_persona: updated.active_persona
      });
    } catch (error) {
      console.error('❌ switchPersona Error:', error);
      return res.status(500).json({ error: 'Failed to switch persona' });
    }
  }

  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { primary_skill, location_name } = req.body;

      if (!primary_skill || !location_name) {
        return res.status(400).json({ error: 'Missing skill or location' });
      }

      console.log(`📝 Updating trade profile for user ${userId}`);
      const updated = await UserModel.updateTradeProfile(userId, { primary_skill, location_name });

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: updated
      });
    } catch (error) {
      console.error('❌ updateProfile Error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  static async toggleAvailability(req, res) {
    try {
      const { is_available } = req.body;
      if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });
      const userId = req.user.id;

      if (typeof is_available !== 'boolean') {
        return res.status(400).json({ error: 'is_available must be a boolean' });
      }

      console.log(`📡 Updating availability for user ${userId} to: ${is_available}`);
      const updated = await UserModel.updateAvailability(userId, is_available);

      if (!updated) return res.status(404).json({ error: 'User not found' });

      // Redis Geospatial & Status Cache Sync
      if (redisClient) {
        try {
          const statusKey = `provider:status:${userId}`;
          if (updated.is_available) {
            // Geospatial add
            if (updated.longitude !== null && updated.latitude !== null) {
              await redisClient.geoadd('active_providers', updated.longitude, updated.latitude, userId);
            }
            // Lightweight Status Cache (24h TTL)
            await redisClient.set(statusKey, 'active', 'EX', 86400);
            console.log(`📍 Redis: Provider ${userId} is now ACTIVE (Cached & Geoindexed)`);
          } else {
            await redisClient.zrem('active_providers', userId);
            await redisClient.del(statusKey);
            console.log(`📍 Redis: Provider ${userId} is now OFFLINE (Cache cleared)`);
          }
        } catch (redisErr) {
          console.error('⚠️ Redis Sync Error:', redisErr.message);
        }
      }

      return res.status(200).json({
        message: 'Availability updated',
        is_available: updated.is_available
      });
    } catch (error) {
      console.error('❌ toggleAvailability Error:', error);
      return res.status(500).json({ error: 'Failed to update availability' });
    }
  }
}

module.exports = AuthController;
