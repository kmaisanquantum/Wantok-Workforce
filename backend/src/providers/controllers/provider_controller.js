const UserModel = require('../../auth/models/user_model');

class ProviderController {
    static async updateProfile(req, res) {
    try {
      const provider_id = req.user.id;
      const { primary_skill, skills_specialization, years_experience, hourly_rate, operating_location } = req.body;

      if (!primary_skill) {
        return res.status(400).json({ success: false, error: 'Primary skill is required' });
      }

      const pool = UserModel.getPool();
      const parsedYears = parseInt(years_experience) || 0;
      const parsedRate = parseFloat(hourly_rate) || 0;

      // Update basic user info (primary skill, rate, and sync location_name)
      await pool.query(
        'UPDATE users SET primary_skill = $1, hourly_rate = $2, location_name = $3 WHERE id = $4',
        [primary_skill, parsedRate, operating_location, provider_id]
      );

      // Update provider profile info
      await pool.query(
        'INSERT INTO provider_profiles (user_id, skills_specialization, years_experience, operating_location) ' +
        'VALUES ($1, $2, $3, $4) ' +
        'ON CONFLICT (user_id) DO UPDATE SET ' +
        'skills_specialization = EXCLUDED.skills_specialization, ' +
        'years_experience = EXCLUDED.years_experience, ' +
        'operating_location = EXCLUDED.operating_location',
        [provider_id, skills_specialization, parsedYears, operating_location]
      );

      return res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('❌ Update Profile Error:', error);
      return res.status(500).json({ success: false, error: 'Failed to update provider profile' });
    }
  }


  static async submitVouch(req, res) {
    try {
      const { gatekeeper_name, gatekeeper_role, gatekeeper_contact } = req.body;
      const provider_id = req.user.id;

      if (!gatekeeper_name || !gatekeeper_role || !gatekeeper_contact) {
        return res.status(400).json({ success: false, error: 'All gatekeeper details are required' });
      }

      const query = `
        INSERT INTO community_verifications (provider_id, gatekeeper_name, gatekeeper_role, gatekeeper_contact)
        VALUES ($1, $2, $3, $4)
        RETURNING id, status
      `;
      const { rows } = await UserModel.getPool().query(query, [provider_id, gatekeeper_name, gatekeeper_role, gatekeeper_contact]);

      return res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('❌ Submit Vouch Error:', error);
      return res.status(500).json({ success: false, error: 'Failed to submit vouch request' });
    }
  }

  static async getVerificationStatus(req, res) {
    try {
      const provider_id = req.user.id;
      const query = `
        SELECT is_community_verified
        FROM provider_profiles
        WHERE user_id = $1
      `;
      const { rows } = await UserModel.getPool().query(query, [provider_id]);

      const vouchQuery = `
        SELECT status FROM community_verifications
        WHERE provider_id = $1
        ORDER BY created_at DESC LIMIT 1
      `;
      const vouchRows = await UserModel.getPool().query(vouchQuery, [provider_id]);

      return res.status(200).json({
        success: true,
        verified: rows[0]?.is_community_verified || false,
        vouch_status: vouchRows.rows[0]?.status || 'none'
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch verification status' });
    }
  }

  static async getLedger(req, res) {
    try {
      const provider_id = req.user.id;

      // 1. Fetch Profile Stats (Wallet & Withdrawn)
      const profileQuery = 'SELECT wallet_balance, withdrawn_total FROM provider_profiles WHERE user_id = $1';
      const profileResult = await UserModel.getPool().query(profileQuery, [provider_id]);
      const profile = profileResult.rows[0] || { wallet_balance: 0, withdrawn_total: 0 };

      // 2. Fetch Job Stats
      const statsQuery = `
        SELECT
          COALESCE(SUM(price), 0) as "totalEarned",
          COALESCE(SUM(price) FILTER (WHERE payout_status = 'escrowed'), 0) as "inEscrow"
        FROM bookings
        WHERE provider_id = $1 AND status IN ('completed', 'confirmed', 'disputed')
      `;
      const statsResult = await UserModel.getPool().query(statsQuery, [provider_id]);
      const stats = statsResult.rows[0];

      // 3. Fetch Job History (Permanent Record Cards)
      const historyQuery = `
        SELECT b.id, b.service_type, b.price, b.status, b.completed_at, b.feedback_rating, b.feedback_text,
               u.name as customer_name
        FROM bookings b
        JOIN users u ON b.customer_id = u.id
        WHERE b.provider_id = $1 AND b.status = 'completed'
        ORDER BY b.completed_at DESC
      `;
      const historyResult = await UserModel.getPool().query(historyQuery, [provider_id]);

      return res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalEarned: stats.totalEarned,
            fundsInEscrow: stats.inEscrow,
            withdrawnToWallet: profile.withdrawn_total
          },
          history: historyResult.rows
        }
      });
    } catch (error) {
      console.error('❌ Get Ledger Error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch financial ledger' });
    }
  }
}

module.exports = ProviderController;
