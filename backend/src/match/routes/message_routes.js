const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/message_controller');
const auth = require('../../auth/middlewares/auth');

// POST /api/messages : Send a new message
router.post('/', auth, MessageController.sendMessage);

// GET /api/messages : Fetch chat history
router.get('/', auth, MessageController.getChatHistory);

// GET /api/messages/inbox : Fetch active conversations
router.get('/inbox', auth, MessageController.getInbox);

module.exports = router;
