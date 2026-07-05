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
    let pgWhereClauses = ["u.active_persona = 'provider'", "u.is_available = true"];

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
              return `(u.name ILIKE $${pIndex} OR u.primary_skill ILIKE $${pIndex} OR u.location_name ILIKE $${pIndex} OR u.hourly_rate <= $${rIndex})`;
          }
          return `(u.name ILIKE $${pIndex} OR u.primary_skill ILIKE $${pIndex} OR u.location_name ILIKE $${pIndex})`;
        });
        pgWhereClauses.push(`(${tokenClauses.join(' AND ')})`);
      }
    }

    if (mappedCategory) {
      const cIndex = pgParams.length + 1;
      pgParams.push(`%${mappedCategory}%`);
      pgWhereClauses.push(`(u.primary_skill ILIKE $${cIndex} OR u.name ILIKE $${cIndex})`);
    }

    const sql = `
      SELECT
        u.id, u.name, u.phone_number, u.email, u.primary_skill, u.location_name, u.is_verified, u.hourly_rate, u.role, u.bio,
        u.primary_skill as category,
        CASE WHEN pp.skills_specialization IS NOT NULL THEN string_to_array(pp.skills_specialization, ',') ELSE ARRAY[]::TEXT[] END as skills,
        CASE WHEN u.location_coords IS NOT NULL THEN ST_X(u.location_coords::geometry) ELSE NULL END as longitude,
        CASE WHEN u.location_coords IS NOT NULL THEN ST_Y(u.location_coords::geometry) ELSE NULL END as latitude,
        NULL as distance_km
      FROM users u
      LEFT JOIN provider_profiles pp ON u.id = pp.user_id
      WHERE ${pgWhereClauses.join(' AND ')}
      ORDER BY u.is_verified DESC, u.name ASC;
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
    let pgWhereClauses = ["u.active_persona = 'provider'", "u.is_available = true"];
    const spatialClause = `(u.location_coords IS NOT NULL AND ST_DWithin(u.location_coords, ST_MakePoint($1, $2)::geography, $3 * 1000))`;

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
            return `(u.name ILIKE $${pIndex} OR u.primary_skill ILIKE $${pIndex} OR u.location_name ILIKE $${pIndex} OR u.hourly_rate <= $${rIndex})`;
        }
        return `(u.name ILIKE $${pIndex} OR u.primary_skill ILIKE $${pIndex} OR u.location_name ILIKE $${pIndex})`;
      });
    }

    if (mappedCategory) {
      const cIndex = pgParams.length + 1;
      pgParams.push(`%${mappedCategory}%`);
      textClauses.push(`(u.primary_skill ILIKE $${cIndex} OR u.name ILIKE $${cIndex})`);
    }

    if (textClauses.length > 0) {
       pgWhereClauses.push(`(${textClauses.join(' AND ')})`);
    } else if (lat !== null && lon !== null) {
       pgWhereClauses.push(spatialClause);
    }

    const sql = `
      SELECT
        u.id, u.name, u.phone_number, u.email, u.primary_skill, u.location_name, u.is_verified, u.hourly_rate, u.role, u.bio,
        u.primary_skill as category,
        CASE WHEN pp.skills_specialization IS NOT NULL THEN string_to_array(pp.skills_specialization, ',') ELSE ARRAY[]::TEXT[] END as skills,
        CASE WHEN u.location_coords IS NOT NULL THEN ST_X(u.location_coords::geometry) ELSE NULL END as longitude,
        CASE WHEN u.location_coords IS NOT NULL THEN ST_Y(u.location_coords::geometry) ELSE NULL END as latitude,
        CASE WHEN u.location_coords IS NOT NULL
             THEN ST_DistanceSphere(u.location_coords::geometry, ST_MakePoint($1, $2)) / 1000.0
             ELSE NULL END as distance_km
      FROM users u
      LEFT JOIN provider_profiles pp ON u.id = pp.user_id
      WHERE ${pgWhereClauses.join(' AND ')}
      ORDER BY
        (CASE WHEN u.location_coords IS NOT NULL AND ${spatialClause} THEN 0 ELSE 1 END),
        u.is_verified DESC,
        distance_km ASC NULLS LAST,
        u.name ASC;
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
