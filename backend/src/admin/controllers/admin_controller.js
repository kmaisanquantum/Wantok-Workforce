const UserModel = require('../../auth/models/user_model');
const bcrypt = require('bcrypt');

class AdminController {
  static async getDashboardMetrics(req, res) {
    try {
      // Use user_roles for accurate, exclusive counts
      const customerQuery = "SELECT COUNT(*) as \"totalCustomers\" FROM user_roles WHERE role_name = 'customer'";
      const providerQuery = "SELECT COUNT(*) as \"totalProviders\" FROM user_roles WHERE role_name = 'provider'";
      const bookingQuery = "SELECT COUNT(*) as \"totalMatches\" FROM bookings";

      const [customers, providers, matches] = await Promise.all([
        UserModel.getPool().query(customerQuery),
        UserModel.getPool().query(providerQuery),
        UserModel.getPool().query(bookingQuery)
      ]);

      return res.status(200).json({
        success: true,
        data: {
          totalCustomers: parseInt(customers.rows[0].totalCustomers),
          totalProviders: parseInt(providers.rows[0].totalProviders),
          totalMatches: parseInt(matches.rows[0].totalMatches)
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const { role, search } = req.query;
      let query = "";
      let queryParams = [];

      const roleMap = {
        "Service Providers": "provider",
        "Customers": "customer",
        "Admins": "admin"
      };

      const dbRole = roleMap[role] || null;

      // STRICT ADMIN FILTERING: If Admin tab is selected, only show pure admins
      if (dbRole === 'admin' || role === 'admin' || role === 'Admins') {
        query = `
          SELECT u.id, u.name, u.email, u.phone_number, u.status, u.role, u.is_verified, u.is_flagged, u.created_at,
                 ARRAY['admin']::TEXT[] as roles
          FROM users u
          WHERE u.role = 'admin'::account_role
        `;
      } else {
        query = `
          SELECT u.id, u.name, u.email, u.phone_number, u.status, u.role, u.is_verified, u.is_flagged, u.created_at,
                 COALESCE(ARRAY(SELECT role_name::TEXT FROM user_roles WHERE user_id = u.id), ARRAY[]::TEXT[]) as roles
          FROM users u
          WHERE u.role != 'admin'::account_role
        `;

        if (dbRole) {
          queryParams.push(dbRole);
          query += ` AND EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = u.id
            AND ur.role_name = $1
          )`;
        }
      }

      if (search) {
        const searchIdx = queryParams.length + 1;
        queryParams.push("%" + search + "%");
        query += ` AND (u.name ILIKE $${searchIdx} OR u.email ILIKE $${searchIdx} OR u.phone_number ILIKE $${searchIdx})`;
      }

      query += " ORDER BY u.created_at DESC";

      const { rows } = await UserModel.getPool().query(query, queryParams);
      return res.status(200).json({ success: true, users: rows });
    } catch (error) {
      console.error('❌ Admin Get Users Error:', error);
      return res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
  }

  static async forceSyncUsers(req, res) {
    let client;
    try {
      client = await UserModel.getPool().connect();
      await client.query('BEGIN');

            // 1. Resolve 'mixed' or invalid roles to a single persona
      await client.query(`
        UPDATE users
        SET role = COALESCE(active_persona, 'customer')::account_role
        WHERE role::TEXT IN ('mixed', 'null', 'undefined', '') OR role IS NULL
      `);

      // 2. Re-synchronize user_roles table with exclusive 1:1 mapping
      await client.query("DELETE FROM user_roles");
      await client.query(`
        INSERT INTO user_roles (user_id, role_name)
        SELECT id, role::account_role
        FROM users
        WHERE role IS NOT NULL
          AND role::TEXT NOT IN ('null', 'undefined', '', 'mixed')
      `);

      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: "Role exclusivity enforced." });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      console.error('❌ Sync Error:', error); return res.status(500).json({ error: 'Sync failed: ' + error.message });
    } finally {
      if (client) client.release();
    }
  }

  static async createUser(req, res) {
    let client;
    try {
      const { name, email, phone_number, password, role, is_verified, is_flagged } = req.body;
      const passwordHash = await bcrypt.hash(password || 'Wantok2024!', 12);
      client = await UserModel.getPool().connect();
      await client.query('BEGIN');

      const cleanRole = ['customer', 'provider', 'admin'].includes(role) ? role : 'customer';

      const { rows } = await client.query('INSERT INTO users (name, email, phone_number, password_hash, role, active_persona, is_verified, is_flagged) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id', [name, email, phone_number, passwordHash, cleanRole, cleanRole, is_verified || false, is_flagged || false]);

      await client.query('DELETE FROM user_roles WHERE user_id = $1', [rows[0].id]);
      await client.query('INSERT INTO user_roles (user_id, role_name) VALUES ($1, $2)', [rows[0].id, cleanRole]);

      await client.query('COMMIT');
      return res.status(201).json({ success: true, message: 'User created successfully', userId: rows[0].id });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to create user' });
    } finally {
      if (client) client.release();
    }
  }

  static async updateUser(req, res) {
    let client;
    try {
      const { userId } = req.params;
      const { name, email, phone_number, role, password, is_verified, is_flagged } = req.body;

      client = await UserModel.getPool().connect();
      await client.query('BEGIN');

      const cleanRole = ['customer', 'provider', 'admin'].includes(role) ? role : null;

      let updateFields = ["name = $1", "email = $2", "phone_number = $3", "is_verified = $4", "is_flagged = $5"];
      let params = [name, email, phone_number, is_verified ?? false, is_flagged ?? false];

      if (cleanRole) {
        updateFields.push(`role = $${params.length + 1}`);
        updateFields.push(`active_persona = $${params.length + 1}`);
        params.push(cleanRole);
      }

      if (password && password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(password, 12);
        updateFields.push(`password_hash = $${params.length + 1}`);
        params.push(hashedPassword);
      }

      params.push(userId);
      const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING id`;

      const { rows } = await client.query(query, params);

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      if (cleanRole) {
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        await client.query('INSERT INTO user_roles (user_id, role_name) VALUES ($1, $2)', [userId, cleanRole]);
      }

      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      console.error('Update User Error:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    } finally {
      if (client) client.release();
    }
  }

  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      await UserModel.getPool().query('DELETE FROM users WHERE id = $1', [userId]);
      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  static async getQueue(req, res) {
    try {
      const query = 'SELECT b.*, c.name as customer_name, p.name as provider_name FROM bookings b LEFT JOIN users c ON b.customer_id = c.id LEFT JOIN users p ON b.provider_id = p.id ORDER BY b.created_at DESC';
      const { rows } = await UserModel.getPool().query(query);
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch queue' });
    }
  }

  static async overrideQueue(req, res) {
    try {
      const { matchId, action } = req.body;
      let newStatus = action === 'force_complete' ? 'completed' : 'cancelled';
      await UserModel.getPool().query('UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, matchId]);
      return res.status(200).json({ success: true, message: "Queue updated" });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to override queue' });
    }
  }

  static async getSettings(req, res) {
    try {
      const { rows } = await UserModel.getPool().query('SELECT key, value, group_category FROM system_settings');
      return res.status(200).json({ success: true, settings: rows });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  static async updateSettings(req, res) {
    try {
      const { settings } = req.body;
      for (const [k, v] of Object.entries(settings)) {
        await UserModel.getPool().query('INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [k, String(v)]);
      }
      return res.status(200).json({ success: true, message: 'Settings updated' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  static async updateMatchConfig(req, res) {
    try {
      const { radius, fee } = req.body;
      if (radius) await UserModel.getPool().query('INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['match_radius', String(radius)]);
      if (fee) await UserModel.getPool().query('INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['platform_fee', String(fee)]);
      return res.status(200).json({ success: true, message: 'Match config updated' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update match config' });
    }
  }

  static async getSystemLogs(req, res) {
    try {
      const { rows } = await UserModel.getPool().query('SELECT id, timestamp, level, action as message FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }

  static async getSystemLogsV2(req, res) {
    return AdminController.getSystemLogs(req, res);
  }

  static async getPendingProviders(req, res) {
    try {
      const query = "SELECT id, name, email, phone_number, created_at, status FROM users WHERE role = 'provider' AND status = 'pending_verification' ORDER BY created_at DESC";
      const { rows } = await UserModel.getPool().query(query);
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch pending providers' });
    }
  }

  static async approveProvider(req, res) {
    try {
      const { providerId } = req.params;
      const query = "UPDATE users SET status = 'active', is_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id";
      const { rows } = await UserModel.getPool().query(query, [providerId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Provider not found' });
      return res.status(200).json({ success: true, message: 'Provider approved successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to approve provider' });
    }
  }

  static async flagUser(req, res) {
    try {
      const { userId } = req.params;
      const { isFlagged } = req.body;
      const query = "UPDATE users SET is_flagged = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id";
      await UserModel.getPool().query(query, [isFlagged, userId]);
      return res.status(200).json({ success: true, message: 'User flagging status updated' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update user flag status' });
    }
  }

  static async getPendingVouching(req, res) {
    try {
      const query = `
        SELECT v.*, u.name as provider_name, u.email as provider_email
        FROM community_verifications v
        JOIN users u ON v.provider_id = u.id
        WHERE v.status = 'pending'
        ORDER BY v.created_at DESC
      `;
      const { rows } = await UserModel.getPool().query(query);
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch pending vouching' });
    }
  }

  static async approveVouch(req, res) {
    let client;
    try {
      const { vouchId } = req.params;
      client = await UserModel.getPool().connect();
      await client.query('BEGIN');

      const vouchQuery = `
        UPDATE community_verifications
        SET status = 'verified', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING provider_id
      `;
      const { rows } = await client.query(vouchQuery, [vouchId]);

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Vouch request not found' });
      }

      const providerId = rows[0].provider_id;

      await client.query(`
        UPDATE provider_profiles
        SET is_community_verified = true, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `, [providerId]);

      await client.query(`
        INSERT INTO audit_logs (level, action)
        VALUES ('INFO', 'Community vouch approved for provider ' || $1)
      `, [providerId]);

      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: 'Vouch approved successfully' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to approve vouch' });
    } finally {
      if (client) client.release();
    }
  }

  static async getSystemLedgerStats(req, res) { return res.status(200).json({ success: true, data: {} }); }
  static async getDisputedJobs(req, res) { return res.status(200).json({ success: true, data: [] }); }
  static async releasePayout(req, res) { return res.status(200).json({ success: true }); }
  static async refundEscrow(req, res) { return res.status(200).json({ success: true }); }
  static async getStats(req, res) { return res.status(200).json({ success: true }); }
}

module.exports = AdminController;
