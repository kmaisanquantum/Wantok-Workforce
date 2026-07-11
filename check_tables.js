const UserModel = require('./backend/src/auth/models/user_model');
async function run() {
  try {
    const { rows } = await UserModel.getPool().query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', rows.map(r => r.table_name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
