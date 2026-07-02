const UserModel = require('../../auth/models/user_model');
const redisClient = require('../../../db/redis_init');

class MatchService {
  /**
   * Find workers near a specific location using Redis Geospatial index with SQL fallback.
   * If coordinates are missing, performs a global text-based search.
   * @param {number|null} lat - Latitude
   * @param {number|null} lon - Longitude
   * @param {string} trade - Trade Category
   * @param {number} [radiusKm=15] - Search radius in kilometers
   */
  static async findNearbyWorkers(lat, lon, trade, radiusKm = 15) {
    const pool = UserModel.getPool();
    const hasLocation = lat !== null && lon !== null;

    // 1. Try Redis Geospatial Search first (only if location is available)
    if (redisClient && hasLocation) {
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
              CASE WHEN location_coords IS NOT NULL AND $1::FLOAT IS NOT NULL AND $2::FLOAT IS NOT NULL
                   THEN ST_DistanceSphere(location_coords::geometry, ST_MakePoint($1, $2)) / 1000.0
                   ELSE NULL END as distance_km
            FROM users
            WHERE id = ANY($3)
            AND ($4::TEXT IS NULL OR primary_skill ILIKE '%' || $4 || '%')
            ORDER BY distance_km ASC NULLS LAST;
          `;

          const { rows } = await pool.query(query, [lon, lat, ids, trade]);
          return rows;
        }
      } catch (redisErr) {
        console.warn('⚠️ Redis Geospatial Search Error, falling back to SQL:', redisErr.message);
      }
    }

    // 2. Fallback to PostGIS SQL scan
    console.log(`🔄 ${hasLocation ? 'Fallback' : 'Global'}: Executing ${hasLocation ? 'PostGIS spatial' : 'text-based'} scan...`);

    const fallbackQuery = `
      SELECT
        id, name, primary_skill, location_name, is_verified,
        CASE WHEN location_coords IS NOT NULL THEN ST_X(location_coords::geometry) ELSE NULL END as longitude,
        CASE WHEN location_coords IS NOT NULL THEN ST_Y(location_coords::geometry) ELSE NULL END as latitude,
        CASE WHEN location_coords IS NOT NULL AND $1::FLOAT IS NOT NULL AND $2::FLOAT IS NOT NULL
             THEN ST_DistanceSphere(location_coords::geometry, ST_MakePoint($1, $2)) / 1000.0
             ELSE NULL END as distance_km
      FROM users
      WHERE
        active_persona = 'provider'
        AND is_available = true
        AND ($3::TEXT IS NULL OR primary_skill ILIKE '%' || $3 || '%')
        AND (
          $4::FLOAT IS NULL OR
          (location_coords IS NOT NULL AND ST_DWithin(location_coords, ST_MakePoint($1, $2)::geography, $4 * 1000))
        )
      ORDER BY
        CASE WHEN $1::FLOAT IS NOT NULL AND $2::FLOAT IS NOT NULL THEN distance_km END ASC NULLS LAST,
        id DESC;
    `;

    try {
      // Use null for radius if location is missing to trigger the "global" logic in SQL
      const searchRadius = hasLocation ? radiusKm : null;
      const { rows } = await pool.query(fallbackQuery, [lon, lat, trade, searchRadius]);
      return rows;
    } catch (error) {
      console.error('❌ PostGIS Scan Error:', error.message);
      throw error;
    }
  }
}

module.exports = MatchService;
