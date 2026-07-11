const UserModel = require('./backend/src/auth/models/user_model');
async function run() {
  try {
    const { rows: tables } = await UserModel.getPool().query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.map(t => t.table_name));
    for (const table of tables) {
      const tableName = table.table_name;
      const { rows: columns } = await UserModel.getPool().query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1", [tableName]);
      console.log(`Table: ${tableName}`, columns.map(c => `${c.column_name} (${c.data_type})`));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
