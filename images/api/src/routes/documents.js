const express = require('express');
const router = express.Router();
const path = require('path');
const { authenticateToken } = require('../helpers/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseFormatter');
const DocumentService = require('../services/DocumentService');
const documentUpload = require('../config/documentUpload');

const documentService = new DocumentService();

// Upload document to stack (or standalone)
router.post('/stack/:stackId',
  authenticateToken,
  documentUpload.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, description } = req.body;

    const documentData = {
      name: name || req.file.originalname,
      description: description || '',
      filePath: req.file.filename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    };

    const document = await documentService.createDocument(
      req.params.stackId,
      req.user.id,
      documentData
    );

    successResponse(res, { document }, 201);
  })
);

// Upload standalone document (not attached to a stack)
router.post('/upload',
  authenticateToken,
  documentUpload.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, description } = req.body;

    const documentData = {
      name: name || req.file.originalname,
      description: description || '',
      filePath: req.file.filename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    };

    const document = await documentService.createDocument(
      null, // No stackId
      req.user.id,
      documentData
    );

    successResponse(res, { document }, 201);
  })
);

// Get documents for a stack (with optional tag filtering)
router.get('/stack/:stackId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { tagIds } = req.query;

    const options = {
      tagIds: tagIds ? (Array.isArray(tagIds) ? tagIds : [tagIds]) : []
    };

    const documents = await documentService.getDocumentsForStack(
      req.params.stackId,
      req.user.id,
      options
    );

    successResponse(res, { documents });
  })
);

// Get documents for a project (with optional tag filtering)
router.get('/project/:projectId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { tagIds } = req.query;

    const options = {
      tagIds: tagIds ? (Array.isArray(tagIds) ? tagIds : [tagIds]) : []
    };

    const documents = await documentService.getDocumentsForProject(
      req.params.projectId,
      req.user.id,
      options
    );

    successResponse(res, { documents });
  })
);

// Get all documents (user's documents and accessible ones)
router.get('/all',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { tagIds } = req.query;

    const options = {
      tagIds: tagIds ? (Array.isArray(tagIds) ? tagIds : [tagIds]) : []
    };

    const documents = await documentService.getAllDocuments(
      req.user.id,
      options
    );

    successResponse(res, { documents });
  })
);

// Get single document by ID
router.get('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const document = await documentService.getDocumentById(
      req.params.id,
      req.user.id
    );

    successResponse(res, { document });
  })
);

// Update document
router.put('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const result = await documentService.updateDocument(req.params.id, req.user.id, { name, description });
    successResponse(res, { document: result });
  })
);

// Delete document
router.delete('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await documentService.deleteDocument(req.params.id, req.user.id);
    successResponse(res, null, 200, result.message);
  })
);

// Add reference to project/stack
router.post('/:documentId/references',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { projectId, stackId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const result = await documentService.addReferenceToProject(
      req.params.documentId,
      projectId,
      stackId || null,
      req.user.id
    );

    successResponse(res, null, 201, result.message);
  })
);

// Remove reference from project/stack
router.delete('/:documentId/references',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { projectId, stackId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const result = await documentService.removeReferenceFromProject(
      req.params.documentId,
      projectId,
      stackId || null,
      req.user.id
    );

    successResponse(res, null, 200, result.message);
  })
);

// Get all references for a document
router.get('/:documentId/references',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const references = await documentService.getReferences(
      req.params.documentId,
      req.user.id
    );

    successResponse(res, { references });
  })
);

// Add tag to document
router.post('/:documentId/tags/:tagId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await documentService.addTagToDocument(
      req.params.documentId,
      req.params.tagId,
      req.user.id
    );
    successResponse(res, null, 200, result.message);
  })
);

// Remove tag from document
router.delete('/:documentId/tags/:tagId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await documentService.removeTagFromDocument(
      req.params.documentId,
      req.params.tagId,
      req.user.id
    );
    successResponse(res, null, 200, result.message);
  })
);

module.exports = router;
