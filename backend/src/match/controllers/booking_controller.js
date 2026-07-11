const UserModel = require('../../auth/models/user_model');

const createJob = async (req, res) => {
  let client;
  try {
    const { service_type, price, scheduled_at } = req.body;
    const customer_id = req.user.id;

    client = await UserModel.getPool().connect();
    const query = 'INSERT INTO bookings (customer_id, service_type, price, scheduled_at, status, payout_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const { rows } = await client.query(query, [customer_id, service_type, price, scheduled_at, 'pending', 'pending']);

    return res.status(201).json({ success: true, booking: rows[0] });
  } catch (error) {
    console.error('Create Job Error:', error);
    return res.status(500).json({ error: 'Failed to create job' });
  } finally {
    if (client) client.release();
  }
};

const getBookings = async (req, res) => {
  let client;
  try {
    const userId = req.user.id;
    client = await UserModel.getPool().connect();
    const query = `
      SELECT b.*, c.name as customer_name, p.name as provider_name
      FROM bookings b
      LEFT JOIN users c ON b.customer_id = c.id
      LEFT JOIN users p ON b.provider_id = p.id
      WHERE b.customer_id = $1 OR b.provider_id = $1
      ORDER BY b.created_at DESC
    `;
    const { rows } = await client.query(query, [userId]);
    return res.status(200).json({ success: true, bookings: rows });
  } catch (error) {
    console.error('Get Bookings Error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  } finally {
    if (client) client.release();
  }
};

const acceptJob = async (req, res) => {
  let client;
  try {
    const { bookingId } = req.params;
    const provider_id = req.user.id;

    client = await UserModel.getPool().connect();
    const query = "UPDATE bookings SET provider_id = $1, status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = 'pending' RETURNING *";
    const { rows } = await client.query(query, [provider_id, bookingId]);

    if (rows.length === 0) return res.status(404).json({ error: 'Job not found or already accepted' });
    return res.status(200).json({ success: true, booking: rows[0] });
  } catch (error) {
    console.error('Accept Job Error:', error);
    return res.status(500).json({ error: 'Failed to accept job' });
  } finally {
    if (client) client.release();
  }
};

const lockEscrow = async (req, res) => {
  let client;
  try {
    const { bookingId } = req.params;
    client = await UserModel.getPool().connect();
    await client.query('BEGIN');

    const bookingQuery = "UPDATE bookings SET status = 'in_progress', payout_status = 'escrowed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'accepted' RETURNING price";
    const { rows } = await client.query(bookingQuery, [bookingId]);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Job not found or not ready for escrow' });
    }

    const price = parseFloat(rows[0].price);

    // Update global escrow flow
    await client.query("UPDATE system_settings SET value = (COALESCE(value, '0')::DECIMAL + $1)::TEXT WHERE key = 'active_escrow_flow'", [price]);

    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: 'Escrow locked' });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Lock Escrow Error:', error);
    return res.status(500).json({ error: 'Failed to lock escrow' });
  } finally {
    if (client) client.release();
  }
};

const markComplete = async (req, res) => {
  let client;
  try {
    const { bookingId } = req.params;
    const provider_id = req.user.id;

    client = await UserModel.getPool().connect();
    const query = "UPDATE bookings SET status = 'completed_awaiting_approval', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND provider_id = $2 AND status = 'in_progress' RETURNING *";
    const { rows } = await client.query(query, [bookingId, provider_id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Job not found or not in progress' });
    return res.status(200).json({ success: true, booking: rows[0] });
  } catch (error) {
    console.error('Mark Complete Error:', error);
    return res.status(500).json({ error: 'Failed to mark job complete' });
  } finally {
    if (client) client.release();
  }
};

const approveWork = async (req, res) => {
  let client;
  try {
    const { bookingId } = req.params;
    const customer_id = req.user.id;

    client = await UserModel.getPool().connect();
    await client.query('BEGIN');

    const bookingQuery = "UPDATE bookings SET status = 'completed', payout_status = 'disbursed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND customer_id = $2 AND status = 'completed_awaiting_approval' RETURNING price, provider_id";
    const { rows } = await client.query(bookingQuery, [bookingId, customer_id]);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Job not found or not awaiting approval' });
    }

    const { price, provider_id } = rows[0];
    const amount = parseFloat(price);

    // 1. Subtract from global active_escrow_flow
    await client.query("UPDATE system_settings SET value = (COALESCE(value, '0')::DECIMAL - $1)::TEXT WHERE key = 'active_escrow_flow'", [amount]);

    // 2. Add to global total_disbursements
    await client.query("UPDATE system_settings SET value = (COALESCE(value, '0')::DECIMAL + $1)::TEXT WHERE key = 'total_disbursements'", [amount]);

    // 3. Credit provider wallet
    await client.query("UPDATE provider_profiles SET wallet_balance = wallet_balance + $1 WHERE user_id = $2", [amount, provider_id]);

    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: 'Work approved and funds disbursed' });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Approve Work Error:', error);
    return res.status(500).json({ error: 'Failed to approve work' });
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  createJob,
  getBookings,
  acceptJob,
  lockEscrow,
  markComplete,
  approveWork
};
