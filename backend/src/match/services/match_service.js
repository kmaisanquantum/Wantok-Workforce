const UserModel = require('../../auth/models/user_model');
const redisClient = require('../../../db/redis_init');

class MatchService {
  /**
   * Robust global text-based search for workers.
   * Filters by name, primary_skill, or location_name using tokenized matching.
   */
  static async textSearchWorkers(query, mappedCategory = null) {
    const pool = UserModel.getPool();
    console.log(`🔍 [MatchService] Performing global search for: "${query || 'Any'}"`);

    let pgParams = [];
    let pgWhereClauses = ["active_persona = 'provider'", "is_available = true"];

    // Handle "all" wildcards
    const isSearchAll = !query || query === '*all' || query === '*';

    if (!isSearchAll) {
      const tokens = query.trim().split(/\s+/).filter(t => t.length > 0);
      if (tokens.length > 0) {
        const tokenClauses = tokens.map((token) => {
          const pIndex = pgParams.length + 1;
          pgParams.push(`%${token}%`);

          if (/^[0-9]+(\.[0-9]+)?$/.test(token)) {
              const rIndex = pgParams.length + 1;
              pgParams.push(parseFloat(token));
              return `(name ILIKE $${pIndex} OR primary_skill ILIKE $${pIndex} OR location_name ILIKE $${pIndex} OR hourly_rate <= $${rIndex})`;
          }
          return `(name ILIKE $${pIndex} OR primary_skill ILIKE $${pIndex} OR location_name ILIKE $${pIndex})`;
        });
        pgWhereClauses.push(`(${tokenClauses.join(' AND ')})`);
      }
    }

    if (mappedCategory) {
      const cIndex = pgParams.length + 1;
      pgParams.push(`%${mappedCategory}%`);
      pgWhereClauses.push(`(primary_skill ILIKE $${cIndex} OR name ILIKE $${cIndex})`);
    }

    const sql = `
      SELECT
        id, name, primary_skill, location_name, is_verified, hourly_rate,
        CASE WHEN location_coords IS NOT NULL THEN ST_X(location_coords::geometry) ELSE NULL END as longitude,
        CASE WHEN location_coords IS NOT NULL THEN ST_Y(location_coords::geometry) ELSE NULL END as latitude,
        NULL as distance_km
      FROM users
      WHERE ${pgWhereClauses.join(' AND ')}
      ORDER BY is_verified DESC, name ASC;
    `;

    try {
      const { rows } = await pool.query(sql, pgParams);
      return rows;
    } catch (error) {
      console.error('❌ Text Search Error:', error.message);
      throw error;
    }
  }

  /**
   * Find workers near a location with SQL fallback.
   */
  static async findNearbyWorkers(lat, lon, query, mappedCategory = null, radiusKm = 50) {
    const pool = UserModel.getPool();

    let pgParams = [lon, lat, radiusKm];
    let pgWhereClauses = ["active_persona = 'provider'", "is_available = true"];
    const spatialClause = `(location_coords IS NOT NULL AND ST_DWithin(location_coords, ST_MakePoint($1, $2)::geography, $3 * 1000))`;

    // Handle "all" wildcards
    const isSearchAll = !query || query === '*all' || query === '*';

    let textClauses = [];
    if (!isSearchAll) {
      const tokens = query.trim().split(/\s+/).filter(t => t.length > 0);
      textClauses = tokens.map((token) => {
        const pIndex = pgParams.length + 1;
        pgParams.push(`%${token}%`);
        if (/^[0-9]+(\.[0-9]+)?$/.test(token)) {
            const rIndex = pgParams.length + 1;
            pgParams.push(parseFloat(token));
            return `(name ILIKE $${pIndex} OR primary_skill ILIKE $${pIndex} OR location_name ILIKE $${pIndex} OR hourly_rate <= $${rIndex})`;
        }
        return `(name ILIKE $${pIndex} OR primary_skill ILIKE $${pIndex} OR location_name ILIKE $${pIndex})`;
      });
    }

    if (mappedCategory) {
      const cIndex = pgParams.length + 1;
      pgParams.push(`%${mappedCategory}%`);
      textClauses.push(`(primary_skill ILIKE $${cIndex} OR name ILIKE $${cIndex})`);
    }

    if (textClauses.length > 0) {
       pgWhereClauses.push(`(${textClauses.join(' AND ')})`);
    } else {
       pgWhereClauses.push(spatialClause);
    }

    const sql = `
      SELECT
        id, name, primary_skill, location_name, is_verified, hourly_rate,
        CASE WHEN location_coords IS NOT NULL THEN ST_X(location_coords::geometry) ELSE NULL END as longitude,
        CASE WHEN location_coords IS NOT NULL THEN ST_Y(location_coords::geometry) ELSE NULL END as latitude,
        CASE WHEN location_coords IS NOT NULL
             THEN ST_DistanceSphere(location_coords::geometry, ST_MakePoint($1, $2)) / 1000.0
             ELSE NULL END as distance_km
      FROM users
      WHERE ${pgWhereClauses.join(' AND ')}
      ORDER BY
        (CASE WHEN location_coords IS NOT NULL AND ${spatialClause} THEN 0 ELSE 1 END),
        is_verified DESC,
        distance_km ASC NULLS LAST,
        name ASC;
    `;

    try {
      const { rows } = await pool.query(sql, pgParams);
      return rows;
    } catch (error) {
      console.error('❌ findNearbyWorkers Error:', error.message);
      return this.textSearchWorkers(query, mappedCategory);
    }
  }
}

module.exports = MatchService;
