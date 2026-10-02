const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  markAsRead
} = require('../controllers/conversationController');

router.use(authenticateToken);

router.get('/', getConversations);
router.post('/', getOrCreateConversation);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/read', markAsRead);

module.exports = router;