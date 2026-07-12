const express = require('express');
const router = express.Router();
const {
  createJob,
  getBookings,
  acceptJob,
  lockEscrow,
  markComplete,
  approveWork,
  getProposals,
  claimJob
} = require('../controllers/booking_controller');
const { authMiddleware, roleCheckMiddleware } = require('../../auth/middlewares/auth');

router.post('/create', authMiddleware, roleCheckMiddleware(['customer']), createJob);
router.get('/proposals', authMiddleware, roleCheckMiddleware(['provider']), getProposals);
router.post('/:bookingId/claim', authMiddleware, roleCheckMiddleware(['provider']), claimJob);
router.post('/:bookingId/accept', authMiddleware, roleCheckMiddleware(['provider']), acceptJob);
router.post('/:bookingId/escrow', authMiddleware, roleCheckMiddleware(['customer']), lockEscrow);
router.post('/:bookingId/complete', authMiddleware, roleCheckMiddleware(['provider']), markComplete);
router.post('/:bookingId/approve', authMiddleware, roleCheckMiddleware(['customer']), approveWork);
router.get('/list', authMiddleware, getBookings);

module.exports = router;
