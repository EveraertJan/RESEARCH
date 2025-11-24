const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../helpers/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkRequiredFields } = require('../middleware/validation');
const { successResponse, createdResponse } = require('../utils/responseFormatter');
const TagService = require('../services/TagService');

const tagService = new TagService();

// Get all tags for a project
router.get('/project/:projectId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const tags = await tagService.getTagsForProject(req.params.projectId, req.user.id);
    successResponse(res, { tags });
  })
);

// Create new tag
router.post('/project/:projectId',
  authenticateToken,
  checkRequiredFields(['name']),
  asyncHandler(async (req, res) => {
    const tag = await tagService.createTag(req.params.projectId, req.user.id, req.body);
    createdResponse(res, { tag }, 'Tag created successfully');
  })
);

// Delete tag
router.delete('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await tagService.deleteTag(req.params.id, req.user.id);
    successResponse(res, null, 200, result.message);
  })
);

// Add tag to insight
router.post('/insight/:insightId/tag/:tagId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await tagService.addTagToInsight(
      req.params.insightId,
      req.params.tagId,
      req.user.id
    );
    successResponse(res, null, 200, result.message);
  })
);

// Remove tag from insight
router.delete('/insight/:insightId/tag/:tagId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await tagService.removeTagFromInsight(
      req.params.insightId,
      req.params.tagId,
      req.user.id
    );
    successResponse(res, null, 200, result.message);
  })
);

module.exports = router;
