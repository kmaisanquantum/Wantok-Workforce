const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customer_controller');
const { authMiddleware } = require('../../auth/middlewares/auth');

router.use(authMiddleware);

router.put('/profile', CustomerController.updateFullProfile);
router.get('/locations', CustomerController.getSavedLocations);
router.post('/locations', CustomerController.addSavedLocation);
router.delete('/locations/:locationId', CustomerController.deleteSavedLocation);

module.exports = router;
