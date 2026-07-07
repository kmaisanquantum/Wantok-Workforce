const fs = require("fs");
const path = require("path");

async function initializeDatabase(pool) {
  const host = pool.options.host;
  const database = pool.options.database;

  console.log(`🔄 [DB Handshake] Attempting direct connection to ${host}/${database}...`);

  try {
    const client = await pool.connect();
    console.log(`🔗 [Success] Database reached successfully via: ${host}`);

    try {
      console.log("🔄 Running core schema synchronization...");
      const schemaPath = path.join(__dirname, "schema.sql");
      const schema = fs.readFileSync(schemaPath, "utf8");
      await client.query(schema);

      const runPatch = async (fileName, description) => {
        try {
          console.log(`🔄 Applying ${description} (${fileName})...`);
          const filePath = path.join(__dirname, fileName);
          if (fs.existsSync(filePath)) {
            const sql = fs.readFileSync(filePath, "utf8");
            await client.query(sql);
          }
        } catch (err) {
          console.error(`⚠️ Non-critical schema patch skipped (${fileName}):`, err.message);
        }
      };

      await runPatch("patch_role_column.sql", "role column patch");
      await runPatch("patch_categories.sql", "categories table patch");
      await runPatch("patch_bookings.sql", "bookings table patch");
      await runPatch("patch_matches.sql", "matches table patch");
      await runPatch("patch_audit_logs.sql", "audit logs table patch");
      await runPatch("patch_admin_master.sql", "admin master patch");
      await runPatch("patch_system_settings.sql", "system settings patch");
      await runPatch("patch_system_settings_v2.sql", "system settings v2 patch");
      await runPatch("seed_categories.sql", "categories seed");
      await runPatch("init_admin.sql", "admin user seed");
      await runPatch("seed_stats.sql", "system stats seed");
      await runPatch("patch_seed_paul.sql", "Paul seed");
      await runPatch("patch_backfill_roles.sql", "user roles backfill");
      await runPatch("patch_add_mixed_role.sql", "add mixed role to enum");
      await runPatch("patch_admin_ledger.sql", "admin ledger and dispute support");
      await runPatch("patch_provider_profiles.sql", "provider profiles for strict filtering");
      await runPatch("patch_provider_profile_fields.sql", "provider profile detailed fields");
      await runPatch("patch_vouching_and_ledger.sql", "vouching and ledger support");
      await runPatch("patch_booking_workflow.sql", "booking workflow financial counters");
      await runPatch("patch_messages.sql", "messages table patch");
      await runPatch("patch_message_attachments.sql", "message attachments patch");
      await runPatch("patch_match_review_logs.sql", "match review logs patch");

      console.log("✅ [Ready] Database initialization complete.");
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn("⚠️ [Non-Critical] Database connection failed during initialization.");
    console.error(`Target Host: ${host}`);
    console.error(`Target Database: ${database}`);
    console.error("Error Message:", err.message);
    console.error("Error Code:", err.code);
    console.log("🚀 Continuing server startup anyway. Database-dependent features will be unavailable until connection is restored.");
  }
}

module.exports = { initializeDatabase };
