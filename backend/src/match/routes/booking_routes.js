const express = require('express');
const router = express.Router();
const {
  createJob,
  getBookings,
  acceptJob,
  lockEscrow,
  markComplete,
  approveWork
} = require('../controllers/booking_controller');
const { authMiddleware } = require('../../auth/middlewares/auth');

router.post('/create', authMiddleware, createJob);
router.post('/:bookingId/accept', authMiddleware, acceptJob);
router.post('/:bookingId/escrow', authMiddleware, lockEscrow);
router.post('/:bookingId/complete', authMiddleware, markComplete);
router.post('/:bookingId/approve', authMiddleware, approveWork);
router.get('/list', authMiddleware, getBookings);

module.exports = router;
