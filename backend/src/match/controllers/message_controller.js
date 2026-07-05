const UserModel = require('../../auth/models/user_model');

class MessageController {
  static async sendMessage(req, res) {
    const { receiverId, providerId, text } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !providerId || !text) {
      return res.status(400).json({ error: 'Missing required fields: receiverId, providerId, text' });
    }

    try {
      const pool = UserModel.getPool();
      const sql = `
        INSERT INTO messages (sender_id, receiver_id, provider_id, text)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const { rows } = await pool.query(sql, [senderId, receiverId, providerId, text]);
      return res.status(201).json(rows[0]);
    } catch (error) {
      console.error('❌ sendMessage Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getChatHistory(req, res) {
    const { providerId, userId } = req.query;

    if (!providerId || !userId) {
      return res.status(400).json({ error: 'Missing required query params: providerId, userId' });
    }

    try {
      const pool = UserModel.getPool();
      const sql = `
        SELECT m.*, u.name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.provider_id = $1
        AND (
          (m.sender_id = $2 AND m.receiver_id = $3) OR
          (m.sender_id = $3 AND m.receiver_id = $2)
        )
        ORDER BY m.created_at ASC
      `;

      // We need to know who the other party is.
      // If the requester is the user, the other party is the provider (associated with providerId).
      // But for history, we just need the two IDs.
      // providerId identifies the specific service context.

      // Assuming userId in query is the Customer ID.
      // We need the Provider's User ID too.
      const { rows: providerRows } = await pool.query('SELECT user_id FROM provider_profiles WHERE user_id = $1', [providerId]);
      const providerUserId = providerRows.length > 0 ? providerRows[0].user_id : providerId;

      const { rows } = await pool.query(sql, [providerId, userId, providerUserId]);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('❌ getChatHistory Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getInbox(req, res) {
    const userId = req.user.id;

    try {
      const pool = UserModel.getPool();
      // Fetch distinct conversations for the logged-in user (acting as sender or receiver)
      const sql = `
        SELECT DISTINCT ON (m.provider_id, other_party_id)
          m.provider_id,
          CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_party_id,
          u.name as other_party_name,
          m.text as last_message,
          m.created_at as last_message_time
        FROM messages m
        JOIN users u ON (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END) = u.id
        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY m.provider_id, other_party_id, m.created_at DESC
      `;
      const { rows } = await pool.query(sql, [userId]);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('❌ getInbox Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = MessageController;
