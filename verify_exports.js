const AdminController = require('./backend/src/admin/controllers/admin_controller');
const required = [
  'getDashboardMetrics', 'getStats', 'getSystemLogs', 'getAllUsers',
  'forceSyncUsers', 'createUser', 'updateUser', 'deleteUser',
  'getPendingProviders', 'approveProvider', 'flagUser', 'getQueue',
  'overrideQueue', 'getSettings', 'updateSettings', 'updateMatchConfig'
];

required.forEach(m => {
  if (typeof AdminController[m] !== 'function') {
    console.error(`MISSING: ${m}`);
    process.exit(1);
  }
});
console.log('All methods exported correctly.');
