const MatchService = require('../services/match_service');
const UserModel = require('../../auth/models/user_model');
const AdminController = require('../../admin/controllers/admin_controller');
const redisClient = require('../../../db/redis_init');
const SYNONYM_DICTIONARY = {
  'Legal': ['lawyer', 'lawyers', 'solicitor', 'barrister', 'advocate', 'attorney'],
  'Medical': ['doctor', 'nurse', 'hcs', 'clinic', 'physio', 'health', 'triage'],
  'Electric': ['electrician', 'sparky', 'wiring', 'power', 'fuse', 'electrical'],
  'Plumbing': ['plumber', 'pipe', 'leak', 'drain', 'water', 'toilet'],
  'Carpentry': ['carpenter', 'builder', 'wood', 'roof', 'furniture', 'cabinet'],
  'Finance': ['accountant', 'tax', 'bookkeeper', 'loans', 'kingsmen', 'banking']
};

const normalizeSearchTrade = (query) => {
  if (!query) return { original: null, mapped: null };
  const lowerQuery = query.toLowerCase().trim();
  for (const [category, synonyms] of Object.entries(SYNONYM_DICTIONARY)) {
    if (synonyms.some(s => lowerQuery.includes(s)) || category.toLowerCase() === lowerQuery) {
      return { original: lowerQuery, mapped: category };
    }
  }
  return { original: lowerQuery, mapped: null };
};


class MatchController {
  static async getNearbyWorkers(req, res) {
    const { latitude, longitude, trade_category, radius } = req.query;
    const { original: queryText, mapped: categoryTag } = normalizeSearchTrade(trade_category);

    // Handle "undefined" strings from frontend and parse coordinates
    const lat = (latitude && latitude !== 'undefined') ? parseFloat(latitude) : null;
    const lon = (longitude && longitude !== 'undefined') ? parseFloat(longitude) : null;
    const hasCoordinates = lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon);

    try {
      // 1. If coordinates are missing or invalid, go straight to text search fallback
      if (!hasCoordinates) {
        console.log(`ℹ️ [MatchController] Missing coordinates. Falling back to global text search for: "${trade_category || 'Any'}"`);
        const workers = await MatchService.textSearchWorkers(queryText, categoryTag);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { trade_category, queryText, categoryTag, search_type: 'global_text' },
          workers
        });
      }

      // 2. Validate coordinate ranges for spatial query
      if (lon > 180 || lon < -180 || lat > 90 || lat < -90) {
        console.warn(`⚠️ [MatchController] Coordinates out of bounds: [${lat}, ${lon}]. Using text search fallback.`);
        const workers = await MatchService.textSearchWorkers(queryText, categoryTag);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { trade_category, queryText, categoryTag, search_type: 'fallback_text_invalid_coords' },
          workers
        });
      }

      // Load radius from database settings if not provided
      let searchRadius;
      try {
        searchRadius = radius ? parseFloat(radius) : await AdminController.getInternalSetting('match_radius', 50);
        searchRadius = parseFloat(searchRadius) || 50;
      } catch (e) {
        searchRadius = 50;
      }

      console.log(`🔍 [MatchController] Attempting spatial search for '${trade_category || 'Any'}' near [${lat}, ${lon}] within ${searchRadius}km`);

      // Publish Job Alert (only for valid spatial searches)
      if (redisClient) {
        const jobPayload = { lat, lon, trade_category, queryText, categoryTag, radius: searchRadius, timestamp: new Date().toISOString() };
        redisClient.publish('job_alerts', JSON.stringify(jobPayload));
      }

      // 3. Inner try-catch for spatial query protection
      try {
        const workers = await MatchService.findNearbyWorkers(lat, lon, queryText, categoryTag, searchRadius);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { lat, lon, trade_category, queryText, categoryTag, radius: searchRadius, search_type: 'spatial' },
          workers
        });
      } catch (spatialError) {
        console.error('❌ [MatchController] Spatial Database Error. Intercepting and falling back to text search:', spatialError.message);

        // Final fallback to text search if spatial query fails (e.g., PostGIS math error)
        const workers = await MatchService.textSearchWorkers(queryText, categoryTag);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { trade_category, queryText, categoryTag, search_type: 'fallback_text_on_spatial_error' },
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
          if (cached) {
            return res.status(200).json(JSON.parse(cached));
          }
        } catch (err) {
          console.warn('⚠️ Redis Cache Read Error:', err.message);
        }
      }

      const pool = UserModel.getPool();
      const { rows } = await pool.query('SELECT * FROM categories ORDER BY label ASC');

      if (redisClient && rows.length > 0) {
        try {
          await redisClient.set(cacheKey, JSON.stringify(rows), 'EX', 604800);
        } catch (err) {
          console.warn('⚠️ Redis Cache Write Error:', err.message);
        }
      }

      return res.status(200).json(rows);
    } catch (error) {
      console.error('❌ getCategories Error:', error);
      return res.status(500).json({ error: 'Failed to retrieve categories' });
    }
  }
}

module.exports = MatchController;
