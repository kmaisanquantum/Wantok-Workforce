const UserModel = require('./backend/src/auth/models/user_model');
async function check() {
  try {
    const { rows } = await UserModel.getPool().query("SELECT id, name, role FROM users LIMIT 20");
    console.log('Users:', JSON.stringify(rows, null, 2));

    const roles = await UserModel.getPool().query("SELECT * FROM user_roles LIMIT 20");
    console.log('Roles:', JSON.stringify(roles.rows, null, 2));

    const tables = await UserModel.getPool().query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.rows.map(r => r.table_name));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
check();
