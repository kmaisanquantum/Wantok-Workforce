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
        query += ' WHERE EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = users.id AND ur.role_name = $1)';
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

  static async getSystemLedgerStats(req, res) {
    try {
      const pool = UserModel.getPool();
      const query = "SELECT key, value FROM system_settings WHERE key IN ('active_escrow_flow', 'total_disbursements', 'platform_revenue')";
      const { rows } = await pool.query(query);

      const statsMap = {};
      rows.forEach(r => { statsMap[r.key] = parseFloat(r.value || 0); });

      return res.status(200).json({
        success: true,
        data: {
          totalEscrowCapital: statsMap['active_escrow_flow'] || 0,
          totalDisbursements: statsMap['total_disbursements'] || 0,
          totalRevenue: statsMap['platform_revenue'] || 0
        }
      });
    } catch (error) {
      console.error('getSystemLedgerStats Error:', error);
      return res.status(500).json({ error: 'Failed to fetch ledger stats' });
    }
  }

  static async getDisputedJobs(req, res) {
    try {
      const pool = UserModel.getPool();
      const query = "SELECT b.*, c.name as customer_name, p.name as provider_name FROM bookings b LEFT JOIN users c ON b.customer_id = c.id LEFT JOIN users p ON b.provider_id = p.id WHERE b.status = 'disputed' ORDER BY b.updated_at DESC";
      const { rows } = await pool.query(query);
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch disputed jobs' });
    }
  }

  static async releasePayout(req, res) {
    let client;
    try {
      const { bookingId } = req.params;
      client = await UserModel.getPool().connect();
      await client.query('BEGIN');

      const bookingQuery = "UPDATE bookings SET status = 'completed', payout_status = 'disbursed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'completed_awaiting_approval' AND payout_status = 'escrowed' RETURNING price, provider_id";
      const { rows } = await client.query(bookingQuery, [bookingId]);

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Booking not found or not in escrow' });
      }

      const { price, provider_id } = rows[0];
      const amount = parseFloat(price);

      // Reconcile Platform Fee on manual release
      const settingValue = await AdminController.getInternalSetting('global_fee_percent', 10);
      const feePercent = parseFloat(settingValue);
      const platformFee = Math.round(amount * (feePercent / 100) * 100) / 100;
      const providerNet = Math.max(0, amount - platformFee);

      // 1. Adjust system settings
      await client.query("UPDATE system_settings SET value = (COALESCE(value, '0')::DECIMAL - $1)::TEXT WHERE key = 'active_escrow_flow'", [amount]);
      await client.query("UPDATE system_settings SET value = (COALESCE(value, '0')::DECIMAL + $1)::TEXT WHERE key = 'total_disbursements'", [providerNet]);
      await client.query("INSERT INTO system_settings (key, value, group_category) VALUES ('platform_revenue', $1, 'financial') ON CONFLICT (key) DO UPDATE SET value = (COALESCE(system_settings.value, '0')::DECIMAL + $1)::TEXT", [platformFee]);

      // 2. Credit provider wallet
      await client.query("UPDATE provider_profiles SET wallet_balance = wallet_balance + $1 WHERE user_id = $2", [providerNet, provider_id]);
      await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2", [providerNet, provider_id]);

      // 3. Record the fee on the booking
      await client.query("UPDATE bookings SET platform_fee = $1 WHERE id = $2", [platformFee, bookingId]);

      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: 'Payout released successfully' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      console.error('releasePayout Error:', error);
      return res.status(500).json({ error: 'Failed to release payout' });
    } finally {
      if (client) client.release();
    }
  }

  static async refundEscrow(req, res) {
    let client;
    try {
      const { bookingId } = req.params;
      client = await UserModel.getPool().connect();
      await client.query('BEGIN');

      // MUST strictly validate payout_status == 'escrowed'
      const bookingQuery = `
        UPDATE bookings
        SET status = 'cancelled',
            payout_status = 'refunded',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND payout_status = 'escrowed'
        RETURNING price, customer_id
      `;
      const { rows } = await client.query(bookingQuery, [bookingId]);

      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Booking not found or funds not in escrowed state.' });
      }

      const { price, customer_id } = rows[0];
      const amount = parseFloat(price);

      // 1. Adjust global system ledger
      await client.query("UPDATE system_settings SET value = (COALESCE(value, '0')::DECIMAL - $1)::TEXT WHERE key = 'active_escrow_flow'", [amount]);

      // 2. Safely refund the customer's unified wallet
      await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2", [amount, customer_id]);

      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: 'Escrowed funds successfully refunded to customer wallet.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      console.error('refundEscrow Error:', error);
      return res.status(500).json({ error: 'Transactional refund failed.' });
    } finally {
      if (client) client.release();
    }
  }
  static async getStats(req, res) { return res.status(200).json({ success: true }); }

  static async getMatchDetails(req, res) {
    try {
      const { matchId } = req.params;
      const bookingQuery = `
        SELECT b.*,
               c.name as customer_name, c.email as customer_email, c.phone_number as customer_phone,
               p.name as provider_name, p.email as provider_email, p.phone_number as provider_phone, p.primary_skill as provider_skill
        FROM bookings b
        LEFT JOIN users c ON b.customer_id = c.id
        LEFT JOIN users p ON b.provider_id = p.id
        WHERE b.id = $1
      `;
      const bookingResult = await UserModel.getPool().query(bookingQuery, [matchId]);
      if (bookingResult.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });

      const logsQuery = `
        SELECT l.*, a.name as admin_name
        FROM match_review_logs l
        LEFT JOIN users a ON l.admin_id = a.id
        WHERE l.match_id = $1
        ORDER BY l.created_at DESC
      `;
      const logsResult = await UserModel.getPool().query(logsQuery, [matchId]);

      const scoresQuery = `
        SELECT m.*, u.name as provider_name
        FROM matches m
        JOIN users u ON m.provider_id = u.id
        WHERE m.booking_id = $1
        ORDER BY m.score DESC
      `;
      const scoresResult = await UserModel.getPool().query(scoresQuery, [matchId]);

      return res.status(200).json({
        success: true,
        data: {
          booking: bookingResult.rows[0],
          logs: logsResult.rows,
          scores: scoresResult.rows
        }
      });
    } catch (error) {
      console.error('Get Match Details Error:', error);
      return res.status(500).json({ error: 'Failed to fetch match details' });
    }
  }

  static async reassignMatch(req, res) {
    try {
      const { matchId } = req.params;
      const { providerId } = req.body;
      const adminId = req.user.id;

      const client = await UserModel.getPool().connect();
      try {
        await client.query('BEGIN');

        await client.query(
          'UPDATE bookings SET provider_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [providerId, 'accepted', matchId]
        );

        await client.query(
          'INSERT INTO match_review_logs (match_id, admin_id, action, internal_notes) VALUES ($1, $2, $3, $4)',
          [matchId, adminId, 'CLEARED', `Manually reassigned to provider ID: ${providerId}`]
        );

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'Match reassigned successfully' });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Reassign Match Error:', error);
      return res.status(500).json({ error: 'Failed to reassign match' });
    }
  }

  static async getTrustMetrics(req, res) {
    try {
      const pool = UserModel.getPool();
      const verifiedQuery = "SELECT COUNT(*) FROM users WHERE is_verified = true AND (role = 'provider' OR role = 'mixed')";
      const pendingQuery = "SELECT COUNT(*) FROM users WHERE status = 'pending_verification' AND (role = 'provider' OR role = 'mixed')";
      const reviewsQuery = "SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND feedback_rating IS NOT NULL";
      const avgScoreQuery = "SELECT AVG(feedback_rating) FROM bookings WHERE status = 'completed' AND feedback_rating IS NOT NULL";

      const [verified, pending, reviews, avgScore] = await Promise.all([
        pool.query(verifiedQuery),
        pool.query(pendingQuery),
        pool.query(reviewsQuery),
        pool.query(avgScoreQuery)
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          verifiedWorkers: parseInt(verified.rows[0].count),
          pendingReview: parseInt(pending.rows[0].count),
          totalReviews: parseInt(reviews.rows[0].count),
          avgTrustScore: parseFloat(avgScore.rows[0].avg || 0).toFixed(1)
        }
      });
    } catch (error) {
      console.error('getTrustMetrics Error:', error);
      return res.status(500).json({ error: 'Failed to fetch trust metrics' });
    }
  }

  static async getInternalSetting(key, defaultValue) {
    try {
      const { rows } = await UserModel.getPool().query('SELECT value FROM system_settings WHERE key = $1', [key]);
      return rows.length > 0 ? rows[0].value : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  static async getWorkerTrustList(req, res) {
    try {
      const pool = UserModel.getPool();
      const query = `
        SELECT u.id, u.name, u.is_verified, u.status,
               COALESCE(AVG(b.feedback_rating), 0) as avg_rating,
               COUNT(b.id) as review_count
        FROM users u
        LEFT JOIN bookings b ON u.id = b.provider_id AND b.status = 'completed' AND b.feedback_rating IS NOT NULL
        WHERE u.role = 'provider' OR u.role = 'mixed'
        GROUP BY u.id
        ORDER BY avg_rating DESC, review_count DESC
      `;
      const { rows } = await pool.query(query);
      return res.status(200).json({
        success: true,
        data: rows.map(r => ({
          ...r,
          avg_rating: parseFloat(r.avg_rating).toFixed(1),
          review_count: parseInt(r.review_count)
        }))
      });
    } catch (error) {
      console.error('getWorkerTrustList Error:', error);
      return res.status(500).json({ error: 'Failed to fetch worker trust list' });
    }
  }
}

module.exports = AdminController;
