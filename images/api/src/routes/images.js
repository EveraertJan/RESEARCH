const express = require('express');
const router = express.Router();
const path = require('path');
const { authenticateToken } = require('../helpers/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseFormatter');
const ImageService = require('../services/ImageService');
const upload = require('../config/upload');

const imageService = new ImageService();

// Upload image to stack
router.post('/stack/:stackId',
  authenticateToken,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name } = req.body;

    const imageData = {
      name: name || req.file.originalname,
      filePath: req.file.filename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    };

    const image = await imageService.createImage(
      req.params.stackId,
      req.user.id,
      imageData
    );

    successResponse(res, { image }, 201);
  })
);

// Get images for a stack (with optional tag filtering)
router.get('/stack/:stackId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { tagIds } = req.query;

    const options = {
      tagIds: tagIds ? (Array.isArray(tagIds) ? tagIds : [tagIds]) : []
    };

    const images = await imageService.getImagesForStack(
      req.params.stackId,
      req.user.id,
      options
    );

    successResponse(res, { images });
  })
);

// Serve image file
// router.get('/file/:filename',
//   authenticateToken,
//   (req, res) => {
//     const filePath = path.join(__dirname, './../__uploads/images', req.params.filename);
//     res.sendFile(filePath);
//   }
// );

// Delete image
router.delete('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await imageService.deleteImage(req.params.id, req.user.id);
    successResponse(res, null, 200, result.message);
  })
);

// Add tag to image
router.post('/:imageId/tags/:tagId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await imageService.addTagToImage(
      req.params.imageId,
      req.params.tagId,
      req.user.id
    );
    successResponse(res, null, 200, result.message);
  })
);

// Remove tag from image
router.delete('/:imageId/tags/:tagId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await imageService.removeTagFromImage(
      req.params.imageId,
      req.params.tagId,
      req.user.id
    );
    successResponse(res, null, 200, result.message);
  })
);

module.exports = router;
