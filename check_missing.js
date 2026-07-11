const AdminController = require('./backend/src/admin/controllers/admin_controller');
const fs = require('fs');
const routesContent = fs.readFileSync('./backend/src/admin/routes/admin_routes.js', 'utf8');

const matches = routesContent.match(/AdminController\.[a-zA-Z0-9]+/g);
const uniqueMethods = [...new Set(matches.map(m => m.split('.')[1]))];

console.log('Methods referenced in routes:');
uniqueMethods.forEach(method => {
  const exists = typeof AdminController[method] === 'function';
  console.log(`[${exists ? 'OK' : 'MISSING'}] ${method}`);
});
