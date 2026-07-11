const fs = require('fs');
let content = fs.readFileSync('backend/src/admin/controllers/admin_controller.js', 'utf8');

// Replace top level const pool = UserModel.getPool(); with nothing
content = content.replace(/^const pool = UserModel\.getPool\(\);\s*/m, '');

// Helper to replace pool.query or pool.connect with UserModel.getPool().query or UserModel.getPool().connect
// This ensures we always get the live instance
content = content.replace(/\bpool\.(query|connect)\b/g, 'UserModel.getPool().$1');

fs.writeFileSync('backend/src/admin/controllers/admin_controller.js', content);
