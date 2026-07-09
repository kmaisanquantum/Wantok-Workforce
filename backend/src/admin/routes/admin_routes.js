const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin_controller');
const { authMiddleware, roleCheckMiddleware } = require('../../auth/middlewares/auth');

const adminAuth = [authMiddleware, roleCheckMiddleware(["admin"])];

// PART A: Sovereign Financial Ledger
router.get('/ledger-stats', ...adminAuth, AdminController.getSystemLedgerStats);

// PART B: Automated Milestone Arbitrator
router.get('/disputed-jobs', ...adminAuth, AdminController.getDisputedJobs);
router.post('/release-payout/:bookingId', ...adminAuth, AdminController.releasePayout);
router.post('/refund-escrow/:bookingId', ...adminAuth, AdminController.refundEscrow);

// Standard Dashboard Metrics
router.get('/dashboard-metrics', ...adminAuth, AdminController.getDashboardMetrics);
router.get('/stats', ...adminAuth, AdminController.getStats);
router.get('/system-logs', ...adminAuth, AdminController.getSystemLogs);

// Management Routes
router.get('/users', ...adminAuth, AdminController.getAllUsers);
router.post('/users/force-sync', ...adminAuth, AdminController.forceSyncUsers);
router.post('/users', ...adminAuth, AdminController.createUser);
router.put('/users/:userId', ...adminAuth, AdminController.updateUser);
router.delete('/users/:userId', ...adminAuth, AdminController.deleteUser);

router.get('/pending-providers', ...adminAuth, AdminController.getPendingProviders);
router.get('/pending-vouching', ...adminAuth, AdminController.getPendingVouching);
router.post('/vouch/:vouchId/approve', ...adminAuth, AdminController.approveVouch);
router.post('/providers/:providerId/approve', ...adminAuth, AdminController.approveProvider);

// Standardized Flagging Route (Matches Frontend)
router.patch('/flag-user/:userId', ...adminAuth, AdminController.flagUser);
// Legacy/Alternative Route Support
router.post('/users/:userId/flag', ...adminAuth, AdminController.flagUser);

router.get('/queue', ...adminAuth, AdminController.getQueue);
router.get('/queue/:matchId', ...adminAuth, AdminController.getMatchDetails);
router.post('/queue/:matchId/reassign', ...adminAuth, AdminController.reassignMatch);
router.post('/queue/override', ...adminAuth, AdminController.overrideQueue);

// New Match Moderation Route
router.post('/queue/review', ...adminAuth, AdminController.reviewMatch);

router.get('/settings', ...adminAuth, AdminController.getSettings);
router.post('/settings', ...adminAuth, AdminController.updateSettings);
router.post('/match-config', ...adminAuth, AdminController.updateMatchConfig);

module.exports = router;
