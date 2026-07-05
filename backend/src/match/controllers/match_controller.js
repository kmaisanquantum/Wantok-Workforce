const MatchService = require('../services/match_service');
const UserModel = require('../../auth/models/user_model');
const AdminController = require('../../admin/controllers/admin_controller');
const redisClient = require('../../../db/redis_init');

class MatchController {
  static async getNearbyWorkers(req, res) {
    const { latitude, longitude, trade_category, search, radius } = req.query;

    // Support both old 'trade_category' and new generic 'search' parameter
    const queryText = (search || trade_category || '').toLowerCase().trim();

    const lat = (latitude && latitude !== 'undefined') ? parseFloat(latitude) : null;
    const lon = (longitude && longitude !== 'undefined') ? parseFloat(longitude) : null;
    const hasCoordinates = lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon);

    try {
      if (!hasCoordinates) {
        console.log(`ℹ️ [MatchController] Missing coordinates. Falling back to global text search for: "${queryText || 'Any'}"`);
        const workers = await MatchService.textSearchWorkers(queryText);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { queryText, search_type: 'global_text' },
          workers
        });
      }

      if (lon > 180 || lon < -180 || lat > 90 || lat < -90) {
        console.warn(`⚠️ [MatchController] Coordinates out of bounds: [${lat}, ${lon}]. Using text search fallback.`);
        const workers = await MatchService.textSearchWorkers(queryText);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { queryText, search_type: 'fallback_text_invalid_coords' },
          workers
        });
      }

      let searchRadius;
      try {
        searchRadius = radius ? parseFloat(radius) : await AdminController.getInternalSetting('match_radius', 50);
        searchRadius = parseFloat(searchRadius) || 50;
      } catch (e) {
        searchRadius = 50;
      }

      console.log(`🔍 [MatchController] Attempting spatial search for '${queryText || 'Any'}' near [${lat}, ${lon}] within ${searchRadius}km`);

      if (redisClient) {
        const jobPayload = { lat, lon, queryText, radius: searchRadius, timestamp: new Date().toISOString() };
        redisClient.publish('job_alerts', JSON.stringify(jobPayload));
      }

      try {
        const workers = await MatchService.findNearbyWorkers(lat, lon, queryText, null, searchRadius);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { lat, lon, queryText, radius: searchRadius, search_type: 'spatial' },
          workers
        });
      } catch (spatialError) {
        console.error('❌ [MatchController] Spatial Database Error. Fallback to text search:', spatialError.message);
        const workers = await MatchService.textSearchWorkers(queryText);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { queryText, search_type: 'fallback_text_on_spatial_error' },
          workers
        });
      }

    } catch (error) {
      console.error('❌ [MatchController] Global Error:', error);
      return res.status(500).json({ error: 'Internal server error during search processing' });
    }
  }

  static async getCategories(req, res) {
    try {
      const cacheKey = 'wantok_categories';
      if (redisClient) {
        try {
          const cached = await redisClient.get(cacheKey);
          if (cached) return res.status(200).json(JSON.parse(cached));
        } catch (err) {}
      }

      const pool = UserModel.getPool();
      const { rows } = await pool.query('SELECT * FROM categories ORDER BY label ASC');
      if (redisClient && rows.length > 0) {
        try {
          await redisClient.set(cacheKey, JSON.stringify(rows), 'EX', 604800);
        } catch (err) {}
      }
      return res.status(200).json(rows);
    } catch (error) {
      console.error('❌ getCategories Error:', error);
      return res.status(500).json({ error: 'Failed to retrieve categories' });
    }
  }
}

module.exports = MatchController;
