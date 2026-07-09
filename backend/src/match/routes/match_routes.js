const express = require('express');
const router = express.Router();
const MatchController = require('../controllers/match_controller');
const { authMiddleware } = require('../../auth/middlewares/auth');

/**
 * Match Engine API Endpoints
 */

// GET /api/match/nearby -> Retrieve sorted list of nearby providers based on coords and trade
router.get('/nearby', authMiddleware, MatchController.getNearbyWorkers);

// GET /api/match/categories -> Retrieve trades categories
router.get('/categories', authMiddleware, MatchController.getCategories);

module.exports = router;
