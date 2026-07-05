const MatchService = require('../services/match_service');
const UserModel = require('../../auth/models/user_model');
const AdminController = require('../../admin/controllers/admin_controller');
const redisClient = require('../../../db/redis_init');

const categorySynonyms = {
  // Legal Sector
  'law': 'Legal',
  'lawyer': 'Legal',
  'solicitor': 'Legal',
  'barrister': 'Legal',
  'attorney': 'Legal',
  'prosecutor': 'Legal',
  'defense': 'Legal',

  // Trade Services & Construction
  'sparky': 'Electrician',
  'electric': 'Electrician',
  'power': 'Electrician',
  'wireman': 'Electrician',
  'plumb': 'Plumber',
  'pipe': 'Plumber',
  'leak': 'Plumber',
  'carpenter': 'Carpenter',
  'chippy': 'Carpenter',
  'builder': 'Carpenter',
  'wood': 'Carpenter',
  'mechanic': 'Mechanic',
  'car repair': 'Mechanic',
  'auto': 'Mechanic',
  'fix car': 'Mechanic',
  'painter': 'Painter',
  'paint': 'Painter',

  // Information Technology & Digital
  'dev': 'IT Support',
  'developer': 'IT Support',
  'programmer': 'IT Support',
  'coder': 'IT Support',
  'software': 'IT Support',
  'network': 'IT Support',
  'computer': 'IT Support',
  'tech': 'IT Support',
  'cyber': 'IT Support',
  'website': 'IT Support',

  // Medical, Health & Care
  'doctor': 'Medical',
  'dr': 'Medical',
  'nurse': 'Medical',
  'clinic': 'Medical',
  'triage': 'Medical',
  'health': 'Medical',
  'medic': 'Medical',
  'physio': 'Medical',

  // Domestic & Security Services
  'clean': 'Cleaner',
  'cleaning': 'Cleaner',
  'housekeep': 'Cleaner',
  'housekeeper': 'Cleaner',
  'guard': 'Security',
  'security': 'Security',
  'watchman': 'Security',
  'driver': 'Driver',
  'taxi': 'Driver',
  'chauffeur': 'Driver',
  'truck': 'Driver',

  // Office & Business Admin
  'admin': 'Administration',
  'clerk': 'Administration',
  'secretary': 'Administration',
  'typing': 'Administration',
  'accountant': 'Finance',
  'bookkeeper': 'Finance',
  'finance': 'Finance',
  'tax': 'Finance'
};

const normalizeSearchTrade = (query) => {
  if (!query) return { original: null, mapped: null };
  const lowerQuery = query.toLowerCase().trim();

  // Check direct matches first (case insensitive for category names too)
  for (const [synonym, category] of Object.entries(categorySynonyms)) {
    if (lowerQuery === synonym || lowerQuery === category.toLowerCase()) {
      return { original: lowerQuery, mapped: category };
    }
  }

  // Check substring matches (if the synonym key is inside the user's query)
  // We sort keys by length descending to match longest possible synonym first (e.g. 'lawyer' before 'law')
  const sortedSynonyms = Object.keys(categorySynonyms).sort((a, b) => b.length - a.length);
  for (const synonym of sortedSynonyms) {
    if (lowerQuery.includes(synonym)) {
      return { original: lowerQuery, mapped: categorySynonyms[synonym] };
    }
  }

  return { original: lowerQuery, mapped: null };
};


class MatchController {
  static async getNearbyWorkers(req, res) {
    const { latitude, longitude, trade_category, radius } = req.query;
    const { original: queryText, mapped: categoryTag } = normalizeSearchTrade(trade_category);

    const lat = (latitude && latitude !== 'undefined') ? parseFloat(latitude) : null;
    const lon = (longitude && longitude !== 'undefined') ? parseFloat(longitude) : null;
    const hasCoordinates = lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon);

    try {
      if (!hasCoordinates) {
        console.log(`ℹ️ [MatchController] Missing coordinates. Falling back to global text search for: "${trade_category || 'Any'}" (Mapped: ${categoryTag})`);
        const workers = await MatchService.textSearchWorkers(queryText, categoryTag);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { trade_category, queryText, categoryTag, search_type: 'global_text' },
          workers
        });
      }

      if (lon > 180 || lon < -180 || lat > 90 || lat < -90) {
        console.warn(`⚠️ [MatchController] Coordinates out of bounds: [${lat}, ${lon}]. Using text search fallback.`);
        const workers = await MatchService.textSearchWorkers(queryText, categoryTag);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { trade_category, queryText, categoryTag, search_type: 'fallback_text_invalid_coords' },
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

      console.log(`🔍 [MatchController] Attempting spatial search for '${trade_category || 'Any'}' near [${lat}, ${lon}] within ${searchRadius}km (Mapped: ${categoryTag})`);

      if (redisClient) {
        const jobPayload = { lat, lon, trade_category, queryText, categoryTag, radius: searchRadius, timestamp: new Date().toISOString() };
        redisClient.publish('job_alerts', JSON.stringify(jobPayload));
      }

      try {
        const workers = await MatchService.findNearbyWorkers(lat, lon, queryText, categoryTag, searchRadius);
        return res.status(200).json({
          results_count: workers.length,
          search_params: { lat, lon, trade_category, queryText, categoryTag, radius: searchRadius, search_type: 'spatial' },
          workers
        });
      } catch (spatialError) {
        console.error('❌ [MatchController] Spatial Database Error. Fallback to text search:', spatialError.message);
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
