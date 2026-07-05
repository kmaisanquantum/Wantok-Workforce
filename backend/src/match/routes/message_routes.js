const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/message_controller');
const { authMiddleware } = require('../../auth/middlewares/auth');

// Explicitly bind methods to avoid context issues or provide wrapper functions
router.post('/', authMiddleware, (req, res) => MessageController.sendMessage(req, res));
router.get('/', authMiddleware, (req, res) => MessageController.getChatHistory(req, res));
router.get('/inbox', authMiddleware, (req, res) => MessageController.getInbox(req, res));

module.exports = router;
