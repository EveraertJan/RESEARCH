const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../helpers/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseFormatter');
const InsightService = require('../services/InsightService');

const insightService = new InsightService();

// Get insights for a stack (with optional filtering and search)
router.get('/stack/:stackId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { tagIds, search } = req.query;

    const options = {
      tagIds: tagIds ? (Array.isArray(tagIds) ? tagIds : [tagIds]) : [],
      searchQuery: search || ''
    };

    const insights = await insightService.getInsightsForStack(
      req.params.stackId,
      req.user.id,
      options
    );
    successResponse(res, { insights });
  })
);

// Search insights
router.get('/stack/:stackId/search',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    const insights = await insightService.searchInsights(
      req.params.stackId,
      req.user.id,
      q || ''
    );
    successResponse(res, { insights });
  })
);

// Update insight
router.put('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { content } = req.body;
    const result = await insightService.updateInsight(req.params.id, req.user.id, content);
    successResponse(res, { insight: result });
  })
);

// Delete insight
router.delete('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await insightService.deleteInsight(req.params.id, req.user.id);
    successResponse(res, null, 200, result.message);
  })
);

// Link document to insight
router.post('/:insightId/documents/:documentId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await insightService.addDocumentToInsight(
      req.params.insightId,
      req.params.documentId,
      req.user.id
    );
    successResponse(res, null, 200, result.message);
  })
);

// Unlink document from insight
router.delete('/:insightId/documents/:documentId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await insightService.removeDocumentFromInsight(
      req.params.insightId,
      req.params.documentId,
      req.user.id
    );
    successResponse(res, null, 200, result.message);
  })
);

// Get documents for an insight
router.get('/:insightId/documents',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const documents = await insightService.getDocumentsForInsight(
      req.params.insightId,
      req.user.id
    );
    successResponse(res, { documents });
  })
);

module.exports = router;
