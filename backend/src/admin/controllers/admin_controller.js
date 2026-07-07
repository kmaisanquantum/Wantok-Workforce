const UserModel = require('../../auth/models/user_model');
const bcrypt = require('bcrypt');

class AdminController {
  static async getDashboardMetrics(req, res) {
    try {
      const totalUsers = await UserModel.getPool().query('SELECT COUNT(*) FROM users');
      const totalBookings = await UserModel.getPool().query('SELECT COUNT(*) FROM bookings');
      const activeProviders = await UserModel.getPool().query("SELECT COUNT(*) FROM users WHERE role = 'provider' AND status = 'active'");

      return res.status(200).json({
        success: true,
        stats: {
          totalUsers: parseInt(totalUsers.rows[0].count),
          totalBookings: parseInt(totalBookings.rows[0].count),
          activeProviders: parseInt(activeProviders.rows[0].count)
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const { role } = req.query;
      let query = 'SELECT id, name, email, role, status, is_verified, is_flagged, created_at FROM users';
      let params = [];

      if (role) {
        query += ' WHERE role = $1';
        params.push(role);
      }

      query += ' ORDER BY created_at DESC';
      const { rows } = await UserModel.getPool().query(query, params);
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  static async forceSyncUsers(req, res) {
    try {
      return res.status(200).json({ success: true, message: 'User synchronization triggered' });
    } catch (error) {
      return res.status(500).json({ error: 'Sync failed' });
    }
  }

  static async createUser(req, res) {
    try {
      const { name, email, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = 'INSERT INTO users (name, email, password_hash, role, active_persona) VALUES ($1, $2, $3, $4, $4) RETURNING id, name, email, role';
      const { rows } = await UserModel.getPool().query(query, [name, email, hashedPassword, role]);
      return res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async updateUser(req, res) {
    let client;
    try {
      const { userId } = req.params;
      const { name, email, role, status, password } = req.body;

      client = await UserModel.getPool().connect();
      await client.query('BEGIN');

      let updateFields = [];
      let params = [];
      let idx = 1;

      if (name) { updateFields.push(`name = $${idx++}`); params.push(name); }
      if (email) { updateFields.push(`email = $${idx++}`); params.push(email); }
      if (role) {
        updateFields.push(`role = $${idx++}`); params.push(role);
        updateFields.push(`active_persona = $${idx++}`); params.push(role);
      }
      if (status) { updateFields.push(`status = $${idx++}`); params.push(status); }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push(`password_hash = $${idx++}`); params.push(hashedPassword);
      }

      if (updateFields.length > 0) {
        params.push(userId);
        const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING id`;
        await client.query(query, params);
      }

      if (role) {
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
        await client.query('INSERT INTO user_roles (user_id, role_name) VALUES ($1, $2)', [userId, role]);
      }

      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
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
      const query = `
        SELECT b.*, c.name as customer_name, p.name as provider_name,
               m.provider_id as suggested_provider_id, mp.name as suggested_provider_name
        FROM bookings b
        LEFT JOIN users c ON b.customer_id = c.id
        LEFT JOIN users p ON b.provider_id = p.id
        LEFT JOIN LATERAL (
            SELECT provider_id FROM matches WHERE booking_id = b.id ORDER BY score DESC LIMIT 1
        ) m ON b.provider_id IS NULL
        LEFT JOIN users mp ON m.provider_id = mp.id
        ORDER BY b.created_at DESC
      `;
      const { rows } = await UserModel.getPool().query(query);
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error('Get Queue Error:', error);
      return res.status(500).json({ error: 'Failed to fetch queue' });
    }
  }

  static async overrideQueue(req, res) {
    try {
      const { matchId, action, providerId } = req.body;
      let newStatus = action === 'force_complete' ? 'completed' : 'cancelled';
      let finalProviderId = providerId;

      if (action === 'force_complete') {
        const bookingCheck = await UserModel.getPool().query('SELECT provider_id FROM bookings WHERE id = $1', [matchId]);
        if (bookingCheck.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
        let existingProviderId = bookingCheck.rows[0].provider_id;
        if (!finalProviderId && !existingProviderId) {
          const matchQuery = 'SELECT provider_id FROM matches WHERE booking_id = $1 ORDER BY score DESC LIMIT 1';
          const { rows: matchRows } = await UserModel.getPool().query(matchQuery, [matchId]);
          if (matchRows.length > 0) finalProviderId = matchRows[0].provider_id;
        }
        if (!finalProviderId && !existingProviderId) return res.status(400).json({ error: 'Cannot complete a job with no assigned provider.' });
      }

      let sql = 'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP';
      let params = [newStatus];
      if (finalProviderId && action === 'force_complete') {
        sql += ', provider_id = $' + (params.length + 1);
        params.push(finalProviderId);
      }
      sql += ' WHERE id = $' + (params.length + 1);
      params.push(matchId);
      await UserModel.getPool().query(sql, params);
      return res.status(200).json({ success: true, message: 'Queue updated' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to override queue' });
    }
  }

  static async reviewMatch(req, res) {
    let client;
    try {
      const { matchId } = req.body;
      const { action, internalNotes } = req.body;
      const adminId = req.user.id;

      client = await UserModel.getPool().connect();
      await client.query('BEGIN');

      await client.query(
        'INSERT INTO match_review_logs (match_id, admin_id, action, internal_notes) VALUES ($1, $2, $3, $4)',
        [matchId, adminId, action, internalNotes]
      );

      if (action === 'FORCE_TERMINATED') {
        await client.query('UPDATE bookings SET status = $1, is_under_review = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['cancelled', matchId]);
      } else if (action === 'FORCE_COMPLETED') {
        await client.query('UPDATE bookings SET status = $1, is_under_review = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['completed', matchId]);
      } else if (action === 'FLAGGED') {
        await client.query('UPDATE bookings SET status = $1, is_under_review = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['FLAGGED', matchId]);
      } else if (action === 'CLEARED') {
        // Find if it has a provider already
        const { rows } = await client.query('SELECT provider_id FROM bookings WHERE id = $1', [matchId]);
        const hasProvider = rows.length > 0 && rows[0].provider_id;
        const nextStatus = hasProvider ? 'assigned' : 'pending';
        await client.query('UPDATE bookings SET status = $1, is_under_review = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [nextStatus, matchId]);
      }

      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: `Match ${action.toLowerCase()} successfully` });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      console.error('Review Match Error:', error);
      return res.status(500).json({ error: 'Failed to review match' });
    } finally {
      if (client) client.release();
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
      const isFlagged = req.body.isFlagged !== undefined ? req.body.isFlagged : true;
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
      const { rows } = await client.query("UPDATE community_verifications SET status = 'verified', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING provider_id", [vouchId]);
      if (rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Vouch request not found' }); }
      const providerId = rows[0].provider_id;
      await client.query("UPDATE provider_profiles SET is_community_verified = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1", [providerId]);
      await client.query("INSERT INTO audit_logs (level, action) VALUES ('INFO', 'Community vouch approved for provider ' || $1)", [providerId]);
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
