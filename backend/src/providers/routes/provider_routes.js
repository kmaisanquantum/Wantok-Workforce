const express = require('express');
const router = express.Router();
const ProviderController = require('../controllers/provider_controller');
const { authMiddleware } = require('../../auth/middlewares/auth');

router.post('/vouch', authMiddleware, ProviderController.submitVouch);
router.get('/verification-status', authMiddleware, ProviderController.getVerificationStatus);
router.get('/ledger', authMiddleware, ProviderController.getLedger);
router.put('/profile', authMiddleware, ProviderController.updateProfile);

module.exports = router;
