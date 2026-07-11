const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

const getPoolConfig = () => {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wantok';
  console.log('🔍 [DB] Initializing pool from DATABASE_URL');

  let config = parse(dbUrl);

  const hostStr = String(config.host);
  const isInternal =
    hostStr.startsWith('172.') ||
    hostStr.startsWith('192.168.') ||
    hostStr === 'localhost' ||
    hostStr === '127.0.0.1' ||
    hostStr === 'host.docker.internal' ||
    hostStr.includes('postgresql-database-') ||
    !hostStr.includes('.');

  if (isInternal) {
    console.log(`🔌 [DB] Internal/Local network detected (${config.host}). Disabling SSL for clean handshake.`);
    delete config.ssl;
  } else {
    config.ssl = { rejectUnauthorized: false };
  }

  config.connectionTimeoutMillis = 10000;
  config.idleTimeoutMillis = 30000;
  config.max = 20;
  config.statement_timeout = 30000;

  return config;
};

// Initialize pool immediately on module load
const pool = new Pool(getPoolConfig());
pool.on('error', (err) => console.error('❌ [DB] Unexpected error on idle client', err));

class UserModel {
  static getPool() { return pool; }

  static async checkConnection() {
    if (!pool) return false;
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT NOW()');
        return true;
      } finally {
        client.release();
      }
    } catch (e) {
      console.error('❌ [DB] checkConnection Error:', e.message);
      return false;
    }
  }

  static async create(userData) {
    const { name, phone, email, passwordHash, role } = userData;
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      const userQuery = `
        INSERT INTO users (name, phone_number, email, password_hash, role, active_persona)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, phone_number, role, active_persona, is_available
      `;
      const { rows } = await client.query(userQuery, [name, phone, email.toLowerCase().trim(), passwordHash, role, role]);
      const user = rows[0];
      await client.query('INSERT INTO user_roles (user_id, role_name) VALUES ($1, $2)', [user.id, role]);
      await client.query('COMMIT');
      return user;
    } catch (e) {
      if (client) await client.query('ROLLBACK');
      throw e;
    } finally {
      if (client) client.release();
    }
  }

  static async findByIdentifier(identifier) {
    const cleanId = String(identifier).toLowerCase().trim();
    const query = `
      SELECT u.*,
             ARRAY(
               SELECT DISTINCT role_name FROM (
                 SELECT role::TEXT as role_name FROM users WHERE id = u.id
                 UNION
                 SELECT role_name::TEXT FROM user_roles WHERE user_id = u.id
               ) sub
               WHERE role_name IS NOT NULL AND role_name::TEXT NOT IN ('null', 'undefined', '')
             ) as roles
      FROM users u
      WHERE u.email = $1 OR u.phone_number = $1
    `;
    const { rows } = await pool.query(query, [cleanId]);
    return rows[0];
  }

  static async updateAvailability(userId, isAvailable) {
    const query = `UPDATE users SET is_available = $2 WHERE id = $1 RETURNING id, is_available, CASE WHEN location_coords IS NOT NULL THEN ST_X(location_coords::geometry) ELSE NULL END as longitude, CASE WHEN location_coords IS NOT NULL THEN ST_Y(location_coords::geometry) ELSE NULL END as latitude`;
    const { rows } = await pool.query(query, [userId, isAvailable]);
    return rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT u.*,
             ARRAY(
               SELECT DISTINCT role_name FROM (
                 SELECT role::TEXT as role_name FROM users WHERE id = u.id
                 UNION
                 SELECT role_name::TEXT FROM user_roles WHERE user_id = u.id
               ) sub
               WHERE role_name IS NOT NULL AND role_name::TEXT NOT IN ('null', 'undefined', '')
             ) as roles
      FROM users u
      WHERE u.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async updateActivePersona(userId, persona) {
    const query = 'UPDATE users SET active_persona = $2 WHERE id = $1 RETURNING active_persona';
    const { rows } = await pool.query(query, [userId, persona]);
    return rows[0];
  }

  static async addRole(userId, role) {
    const query = 'INSERT INTO user_roles (user_id, role_name) VALUES ($1, $2) ON CONFLICT DO NOTHING';
    await pool.query(query, [userId, role]);
  }

  static async updateTradeProfile(userId, { primary_skill, location_name }) {
    const query = 'UPDATE users SET primary_skill = $1, location_name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, primary_skill, location_name';
    const { rows } = await pool.query(query, [primary_skill, location_name, userId]);
    return rows[0];
  }
}

module.exports = UserModel;
