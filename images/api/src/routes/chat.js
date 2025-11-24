const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../helpers/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkRequiredFields } = require('../middleware/validation');
const { successResponse, createdResponse } = require('../utils/responseFormatter');
const ChatService = require('../services/ChatService');

const chatService = new ChatService();

// Get messages for a project (optionally filtered by stack)
router.get('/project/:projectId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { stackId } = req.query;
    const messages = await chatService.getMessages(
      req.params.projectId,
      stackId || null,
      req.user.id
    );
    successResponse(res, { messages });
  })
);

// Send message (handles both regular messages and slash commands)
router.post('/project/:projectId',
  authenticateToken,
  checkRequiredFields(['message']),
  asyncHandler(async (req, res) => {
    const { stackId, message } = req.body;
    const result = await chatService.sendMessage(
      req.params.projectId,
      stackId || null,
      req.user.id,
      message
    );
    createdResponse(res, result, 'Message sent successfully');
  })
);

module.exports = router;
