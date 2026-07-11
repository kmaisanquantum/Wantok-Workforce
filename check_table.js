const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wantok' });
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", (err, res) => {
  if (err) console.error('❌ Error:', err.message);
  else {
    console.log('✅ Tables:');
    res.rows.forEach(row => console.log(' - ' + row.table_name));
  }
  pool.end();
});
