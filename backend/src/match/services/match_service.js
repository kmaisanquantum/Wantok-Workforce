const UserModel = require('../../auth/models/user_model');
const redisClient = require('../../../db/redis_init');

class MatchService {
  /**
   * Robust global text-based search for workers.
   * Filters by name or primary_skill.
   * @param {string} query - The search query (trade or name)
   */
  static async textSearchWorkers(query) {
    const pool = UserModel.getPool();
    console.log(`🔍 [MatchService] Performing global text search for: "${query || 'Any'}"`);

    const sql = `
      SELECT
        id, name, primary_skill, location_name, is_verified,
        CASE WHEN location_coords IS NOT NULL THEN ST_X(location_coords::geometry) ELSE NULL END as longitude,
        CASE WHEN location_coords IS NOT NULL THEN ST_Y(location_coords::geometry) ELSE NULL END as latitude,
        NULL as distance_km
      FROM users
      WHERE
        active_persona = 'provider'
        AND is_available = true
        AND (
          $1::TEXT IS NULL OR
          primary_skill ILIKE '%' || $1 || '%' OR
          name ILIKE '%' || $1 || '%'
        )
      ORDER BY is_verified DESC, name ASC;
    `;

    try {
      const { rows } = await pool.query(sql, [query]);
      return rows;
    } catch (error) {
      console.error('❌ Text Search Error:', error.message);
      throw error;
    }
  }

  /**
   * Find workers near a specific location using Redis Geospatial index with SQL fallback.
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} trade - Trade Category
   * @param {number} [radiusKm=15] - Search radius in kilometers
   */
  static async findNearbyWorkers(lat, lon, trade, radiusKm = 15) {
    const pool = UserModel.getPool();

    // 1. Try Redis Geospatial Search first
    if (redisClient) {
      try {
        console.log(`📡 Redis: Searching active providers within ${radiusKm}km of [${lat}, ${lon}]`);

        const nearbyIds = await redisClient.georadius('active_providers', lon, lat, radiusKm, 'km', 'WITHDIST');

        if (nearbyIds && nearbyIds.length > 0) {
          console.log(`✅ Redis: Found ${nearbyIds.length} nearby providers in cache`);

          const ids = nearbyIds.map(item => item[0]);

          const query = `
            SELECT
              id, name, primary_skill, location_name, is_verified,
              CASE WHEN location_coords IS NOT NULL THEN ST_X(location_coords::geometry) ELSE NULL END as longitude,
              CASE WHEN location_coords IS NOT NULL THEN ST_Y(location_coords::geometry) ELSE NULL END as latitude,
              CASE WHEN location_coords IS NOT NULL
                   THEN ST_DistanceSphere(location_coords::geometry, ST_MakePoint($1, $2)) / 1000.0
                   ELSE NULL END as distance_km
            FROM users
            WHERE id = ANY($3)
            AND ($4::TEXT IS NULL OR primary_skill ILIKE '%' || $4 || '%')
            ORDER BY distance_km ASC;
          `;

          const { rows } = await pool.query(query, [lon, lat, ids, trade]);
          return rows;
        }
      } catch (redisErr) {
        console.warn('⚠️ Redis Geospatial Search Error, falling back to SQL:', redisErr.message);
      }
    }

    // 2. Fallback to PostGIS SQL scan
    console.log('🔄 Fallback: Executing PostGIS spatial scan...');

    const fallbackQuery = `
      SELECT
        id, name, primary_skill, location_name, is_verified,
        CASE WHEN location_coords IS NOT NULL THEN ST_X(location_coords::geometry) ELSE NULL END as longitude,
        CASE WHEN location_coords IS NOT NULL THEN ST_Y(location_coords::geometry) ELSE NULL END as latitude,
        CASE WHEN location_coords IS NOT NULL
             THEN ST_DistanceSphere(location_coords::geometry, ST_MakePoint($1, $2)) / 1000.0
             ELSE NULL END as distance_km
      FROM users
      WHERE
        active_persona = 'provider'
        AND is_available = true
        AND ($3::TEXT IS NULL OR primary_skill ILIKE '%' || $3 || '%')
        AND (location_coords IS NOT NULL AND ST_DWithin(location_coords, ST_MakePoint($1, $2)::geography, $4 * 1000))
      ORDER BY distance_km ASC;
    `;

    try {
      const { rows } = await pool.query(fallbackQuery, [lon, lat, trade, radiusKm]);
      return rows;
    } catch (error) {
      console.error('❌ PostGIS Scan Error:', error.message);
      throw error;
    }
  }
}

module.exports = MatchService;
