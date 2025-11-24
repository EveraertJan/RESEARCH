const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../helpers/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, createdResponse } = require('../utils/responseFormatter');
const ResearchStackService = require('../services/ResearchStackService');

const stackService = new ResearchStackService();

// Get all stacks for a project
router.get('/project/:projectId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const stacks = await stackService.getStacksForProject(req.params.projectId, req.user.id);
    successResponse(res, { stacks });
  })
);

// Get stack with insights
router.get('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const stack = await stackService.getStackWithInsights(req.params.id, req.user.id);
    successResponse(res, { stack });
  })
);

module.exports = router;
