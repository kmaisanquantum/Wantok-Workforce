const UserModel = require('../../auth/models/user_model');
const AdminController = require('../../admin/controllers/admin_controller');
const redisClient = require('../../../db/redis_init');

// Helper for real-time status updates with Redis fallback
const emitBookingUpdate = (req, payload) => {
  if (redisClient) {
    redisClient.publish('booking_updates', JSON.stringify(payload));
  } else {
    const io = req.app.get('io');
    if (io) {
      console.log('⚠️ Redis unavailable. Falling back to direct Socket.io emission.');
      if (payload.customerId) io.to(`user_${payload.customerId}`).emit('booking_status_update', payload);
      if (payload.providerId) io.to(`user_${payload.providerId}`).emit('booking_status_update', payload);
    }
  }
};

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
    const customerId = req.user.id;
    console.log(`[Escrow] Attempting to lock escrow for booking ${bookingId} by user ${customerId}`);

    client = await UserModel.getPool().connect();

    // 1. Pre-fetch booking to diagnose state
    const { rows: preCheck } = await client.query('SELECT status, provider_id, price, customer_id FROM bookings WHERE id = $1', [bookingId]);
    if (preCheck.length === 0) {
      console.warn(`[Escrow] Booking ${bookingId} not found.`);
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = preCheck[0];
    console.log(`[Escrow] Current state for ${bookingId}: status=${booking.status}, provider_id=${booking.provider_id}, customer_id=${booking.customer_id}, price=${booking.price}`);

    if (booking.customer_id !== customerId) {
      console.warn(`[Escrow] Unauthorized attempt to pay for booking ${bookingId} by user ${customerId}`);
      return res.status(403).json({ error: 'Unauthorized: You are not the customer for this booking' });
    }

    // MUST strictly validate: 'accepted' -> 'in_progress'
    if (booking.status !== 'accepted') {
      console.warn(`[Escrow] Booking ${bookingId} has invalid status for escrow: ${booking.status}. Expected: accepted`);
      return res.status(400).json({ error: `Job not ready for escrow. Current status: ${booking.status}` });
    }

    if (!booking.provider_id) {
      console.error(`[Escrow] CRITICAL: Booking ${bookingId} has no assigned provider ID.`);
      return res.status(400).json({ error: 'Cannot pay for a job with no assigned provider. Please wait for a worker to be matched.' });
    }

    await client.query('BEGIN');

    const bookingQuery = "UPDATE bookings SET status = 'in_progress', payout_status = 'escrowed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'accepted' RETURNING price";
    const { rows } = await client.query(bookingQuery, [bookingId]);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Job state changed during processing. Please try again.' });
    }

    const price = parseFloat(rows[0].price || 0);

    // Update global escrow flow
    await client.query("UPDATE system_settings SET value = (COALESCE(value, '0')::DECIMAL + $1)::TEXT WHERE key = 'active_escrow_flow'", [price]);

    await client.query('COMMIT');
    console.log(`[Escrow] Successfully locked K${price} for booking ${bookingId}`);

    emitBookingUpdate(req, {
      bookingId,
      status: 'in_progress',
      customerId,
      providerId: booking.provider_id
    });

    return res.status(200).json({ success: true, message: 'Escrow locked and job started' });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Lock Escrow Error:', error);
    return res.status(500).json({ error: 'Failed to lock escrow: ' + error.message });
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

    const booking = rows[0];
    emitBookingUpdate(req, {
      bookingId,
      status: 'completed_awaiting_approval',
      customerId: booking.customer_id,
      providerId: booking.provider_id
    });

    return res.status(200).json({ success: true, booking });
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

    // Calculate Platform Fee
    const feeMetric = await AdminController.getInternalSetting('global_fee_metric_kina', 10.00);
    const platformFee = parseFloat(feeMetric);
    const providerNet = Math.max(0, amount - platformFee);

    // 1. Subtract from global active_escrow_flow
    await client.query("UPDATE system_settings SET value = (COALESCE(value, '0')::DECIMAL - $1)::TEXT WHERE key = 'active_escrow_flow'", [amount]);

    // 2. Add to global total_disbursements (net to provider)
    await client.query("UPDATE system_settings SET value = (COALESCE(value, '0')::DECIMAL + $1)::TEXT WHERE key = 'total_disbursements'", [providerNet]);

    // 3. Add to platform_revenue
    await client.query("INSERT INTO system_settings (key, value, group_category) VALUES ('platform_revenue', $1, 'financial') ON CONFLICT (key) DO UPDATE SET value = (COALESCE(system_settings.value, '0')::DECIMAL + $1)::TEXT", [platformFee]);

    // 4. Update booking with the fee recorded
    await client.query("UPDATE bookings SET platform_fee = $1 WHERE id = $2", [platformFee, bookingId]);

    // 5. Credit provider wallet (net amount)
    await client.query("UPDATE provider_profiles SET wallet_balance = wallet_balance + $1 WHERE user_id = $2", [providerNet, provider_id]);
    await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2", [providerNet, provider_id]);

    await client.query('COMMIT');

    emitBookingUpdate(req, {
      bookingId,
      status: 'completed',
      customerId: customer_id,
      providerId: provider_id
    });

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
