const redisClient = require('../../db/redis_init');
const UserModel = require('../auth/models/user_model');
const AdminController = require('../admin/controllers/admin_controller');

/**
 * MatchWorker
 * Background engine for autonomous user matching.
 * Polling loop isolated from main request threads.
 */
class MatchWorker {
  constructor() {
    this.isProcessing = false;
    this.interval = null;
    this.pollingIntervalMs = 30000; // 30 seconds
  }

  async start() {
    console.log('🤖 [MatchWorker] Background engine starting...');
    this.interval = setInterval(() => this.processQueue(), this.pollingIntervalMs);
    // Initial run
    await this.processQueue();
  }

  async stop() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('🤖 [MatchWorker] Background engine stopped.');
    }
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pool = UserModel.getPool();
      if (!pool) {
        console.warn('🤖 [MatchWorker] DB pool not ready. Skipping cycle.');
        this.isProcessing = false;
        return;
      }

      console.log('🤖 [MatchWorker] Scanning for unmatched open jobs...');

      // Find unmatched pending jobs
      const query = `
        SELECT b.id, b.service_type, b.customer_id,
               CASE WHEN u.location_coords IS NOT NULL THEN ST_X(u.location_coords::geometry) ELSE NULL END as lon,
               CASE WHEN u.location_coords IS NOT NULL THEN ST_Y(u.location_coords::geometry) ELSE NULL END as lat
        FROM bookings b
        JOIN users u ON b.customer_id = u.id
        WHERE b.status = 'pending'
          AND b.provider_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM matches WHERE booking_id = b.id)
      `;
      const { rows: openJobs } = await pool.query(query);

      if (openJobs.length === 0) {
        console.log('🤖 [MatchWorker] No open jobs found in this cycle.');
      } else {
        console.log(`🤖 [MatchWorker] Found ${openJobs.length} unmatched job(s). Processing...`);
        for (const job of openJobs) {
          await this.matchJob(job);
        }
      }
    } catch (error) {
      console.error('❌ [MatchWorker] Error in polling cycle:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  async matchJob(job) {
    const pool = UserModel.getPool();
    try {
      const radius = await AdminController.getInternalSetting('match_radius', 50);

      console.log(`🤖 [MatchWorker] Finding candidates for job ${job.id} (${job.service_type}) within ${radius}km`);

      // PostGIS query to find available providers with matching skill
      const candidateQuery = `
        SELECT u.id, u.name,
               CASE WHEN u.location_coords IS NOT NULL AND $1::FLOAT IS NOT NULL AND $2::FLOAT IS NOT NULL THEN ST_Distance(u.location_coords, ST_SetSRID(ST_MakePoint($1, $2), 4326)) / 1000 ELSE NULL END as distance_km
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_name = 'provider'
          AND u.is_available = TRUE
          AND u.is_flagged = FALSE
          AND u.primary_skill = $3
          AND ($1::FLOAT IS NULL OR $2::FLOAT IS NULL OR (u.location_coords IS NOT NULL AND ST_DWithin(u.location_coords, ST_SetSRID(ST_MakePoint($1, $2), 4326), $4 * 1000)))
        ORDER BY distance_km ASC
        LIMIT 5
      `;

      const { rows: candidates } = await pool.query(candidateQuery, [job.lon, job.lat, job.service_type, radius]);

      if (candidates.length === 0) {
        console.log(`🤖 [MatchWorker] No candidates found for job ${job.id}`);
        return;
      }

      console.log(`🤖 [MatchWorker] Found ${candidates.length} candidate(s) for job ${job.id}`);

      // 1. Propose all matches for scoring/record
      for (const candidate of candidates) {
        const score = Math.max(0, 100 - (candidate.distance_km || 0));
        await pool.query(
          'INSERT INTO matches (booking_id, provider_id, score, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [job.id, candidate.id, score, 'proposed']
        );
      }

      // 2. AUTOMATION: Select the best candidate (first one from order) and assign
      const bestCandidate = candidates[0];

      console.log(`🤖 [MatchWorker] Automatically assigning provider ${bestCandidate.name} (${bestCandidate.id}) to job ${job.id}`);

      await pool.query(
        "UPDATE bookings SET provider_id = $1, status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [bestCandidate.id, job.id]
      );

      await pool.query(
        "UPDATE matches SET status = 'accepted' WHERE booking_id = $1 AND provider_id = $2",
        [job.id, bestCandidate.id]
      );

      // Audit log entry
      try {
        await pool.query(
          "INSERT INTO audit_logs (level, action) VALUES ('INFO', $1)",
          [`Automated match: Assigned provider ${bestCandidate.id} to booking ${job.id}`]
        );
      } catch (logErr) {}


      // 3. NOTIFICATION: Publish to Redis for real-time Socket.io broadcast
      if (redisClient) {
        const payload = {
          type: 'booking_assigned',
          bookingId: job.id,
          customerId: job.customer_id,
          providerId: bestCandidate.id,
          providerName: bestCandidate.name,
          serviceType: job.service_type,
          timestamp: new Date().toISOString()
        };
        redisClient.publish('match_assigned', JSON.stringify(payload));
      }

      console.log(`✅ [MatchWorker] Successfully automated assignment and published notification for job ${job.id}`);
    } catch (error) {
      console.error(`❌ [MatchWorker] Failed to match job ${job.id}:`, error.message);
    }
  }
}

// Self-starting if run directly
if (require.main === module) {
    const worker = new MatchWorker();
    worker.start();
}

module.exports = MatchWorker;
