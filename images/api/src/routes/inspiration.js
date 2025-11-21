const express = require('express');
const router = express.Router();
const { checkBodyFields } = require("./../helpers/bodyHelpers");
const { authenticateToken } = require("./../helpers/authMiddleware");
const config = require('./../db/knexfile').development;
const pg = require('knex')(config);
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Image processing functions
const processImage = async (filePath, filename) => {
  try {
    const fullFilePath = path.join(__dirname, '../..', filePath);
    
    // Create 800px wide version
    const widePath = fullFilePath.replace(/(\.[^.]+)$/, '_800w$1');
    await sharp(fullFilePath)
      .resize(800, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toFile(widePath);
    
    // Create 200px wide version
    const thumbPath = fullFilePath.replace(/(\.[^.]+)$/, '_200w$1');
    await sharp(fullFilePath)
      .resize(200, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toFile(thumbPath);
    
    return {
      original: filePath.replace('/src/__', '/'),
      wide: widePath.replace(path.join(__dirname, '../..'), '').replace('/src/__', '/'),
      thumb: thumbPath.replace(path.join(__dirname, '../..'), '').replace('/src/__', '/')
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, './../__uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept image types
    const allowedTypes = ['.png', '.gif', '.webp', '.jpeg', '.jpg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, GIF, WebP, JPEG, and JPG files are allowed.'));
    }
  }
});

// Get all inspiration items for a project
router.get('/projects/:projectId/inspiration', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user has access to this project
    const project = await pg('projects')
      .where('id', projectId)
      .andWhere(function() {
        this.where('owner_id', req.user.id)
          .orWhereIn('id', function() {
            this.select('project_id').from('project_collaborators').where('user_id', req.user.id);
          });
      })
      .first();

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    const items = await pg('inspiration_items')
      .leftJoin('users', 'inspiration_items.user_id', 'users.id')
      .leftJoin('research_findings', 'inspiration_items.linked_finding_id', 'research_findings.id')
      .where('inspiration_items.project_id', projectId)
      .select(
        'inspiration_items.*',
        'users.first_name',
        'users.last_name',
        'users.username',
        'research_findings.title as linked_finding_title'
      )
      .orderBy('inspiration_items.created_at', 'desc');

    // Add image paths to each item
    const itemsWithPaths = items.map(item => {
      const imagePaths = {};
      if (item.image_path) {
        const filename = path.basename(item.image_path);
        imagePaths.original = item.image_path;
        imagePaths.wide = item.image_path.replace(/(\.[^.]+)$/, '_800w$1');
        imagePaths.thumb = item.image_path.replace(/(\.[^.]+)$/, '_200w$1');
      }
      return {
        ...item,
        imagePaths
      };
    });

    res.json(itemsWithPaths);
  } catch (error) {
    console.error('Get inspiration items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single inspiration item
router.get('/inspiration/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await pg('inspiration_items')
      .leftJoin('users', 'inspiration_items.user_id', 'users.id')
      .leftJoin('research_findings', 'inspiration_items.linked_finding_id', 'research_findings.id')
      .where('inspiration_items.id', id)
      .select(
        'inspiration_items.*',
        'users.first_name',
        'users.last_name',
        'users.username',
        'research_findings.title as linked_finding_title'
      )
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Inspiration item not found' });
    }

    // Check if user has access to project
    const project = await pg('projects')
      .where('id', item.project_id)
      .andWhere(function() {
        this.where('owner_id', req.user.id)
          .orWhereIn('id', function() {
            this.select('project_id').from('project_collaborators').where('user_id', req.user.id);
          });
      })
      .first();

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get inspiration item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new inspiration item
router.post('/projects/:projectId/inspiration', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { is_vital, linked_finding_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Check if user has access to this project
    const project = await pg('projects')
      .where('id', projectId)
      .andWhere(function() {
        this.where('owner_id', req.user.id)
          .orWhereIn('id', function() {
            this.select('project_id').from('project_collaborators').where('user_id', req.user.id);
          });
      })
      .first();

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Validate linked finding if provided
    if (linked_finding_id) {
      try {
        const finding = await pg('research_findings')
          .where('id', linked_finding_id)
          .andWhere('project_id', projectId)
          .first();

        if (!finding) {
          return res.status(400).json({ message: 'Invalid research finding' });
        }
      } catch (error) {
        console.error('Error validating research finding:', error);
        return res.status(500).json({ message: 'Error validating research finding' });
      }
    }

    // Process uploaded image
    let imagePath = `/uploads/images/${req.file.filename}`;
    let widePath = null;
    let thumbPath = null;
    
    try {
      const processed = await processImage(`/src/__uploads/images/${req.file.filename}`, req.file.filename);
      imagePath = processed.original;
      widePath = processed.wide;
      thumbPath = processed.thumb;
    } catch (error) {
      console.error('Error processing image:', error);
      // Continue with original image if processing fails
    }

    const [item] = await pg('inspiration_items')
      .insert({
        project_id: projectId,
        user_id: req.user.id,
        image_path: imagePath,
        is_vital: is_vital === 'true' || is_vital === true,
        linked_finding_id: linked_finding_id || null
      })
      .returning('*');

    res.status(201).json({
      ...item,
      image_paths: {
        original: imagePath,
        wide: widePath,
        thumb: thumbPath
      }
    });
  } catch (error) {
    console.error('Create inspiration item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update an inspiration item
router.put('/inspiration/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_vital, linked_finding_id } = req.body;

    // Get item to check access
    const item = await pg('inspiration_items')
      .where('id', id)
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Inspiration item not found' });
    }

    // Check if user has access to project
    const project = await pg('projects')
      .where('id', item.project_id)
      .andWhere(function() {
        this.where('owner_id', req.user.id)
          .orWhereIn('id', function() {
            this.select('project_id').from('project_collaborators').where('user_id', req.user.id);
          });
      })
      .first();

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Validate linked finding if provided
    if (linked_finding_id) {
      const finding = await pg('research_findings')
        .where('id', linked_finding_id)
        .andWhere('project_id', item.project_id)
        .first();

      if (!finding) {
        return res.status(400).json({ message: 'Invalid research finding' });
      }
    }

    const updateData = {
      updated_at: new Date()
    };

    if (is_vital !== undefined) updateData.is_vital = is_vital === 'true' || is_vital === true;
    if (linked_finding_id !== undefined) updateData.linked_finding_id = linked_finding_id || null;
    if (req.file) {
      updateData.image_path = `/uploads/images/${req.file.filename}`;
      await processImage(`/src/__uploads/images/${req.file.filename}`, req.file.filename);
    }

    const [updatedItem] = await pg('inspiration_items')
      .where('id', id)
      .update(updateData)
      .returning('*');

    res.json(updatedItem);
  } catch (error) {
    console.error('Update inspiration item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete an inspiration item
router.delete('/inspiration/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get item to check access
    const item = await pg('inspiration_items')
      .where('id', id)
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Inspiration item not found' });
    }

    // Check if user is owner of item or project owner
    const project = await pg('projects')
      .where('id', item.project_id)
      .andWhere('owner_id', req.user.id)
      .first();

    if (!project && item.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Access denied' });
    }

    // Delete image file if exists
    if (item.image_path) {
      const filePath = path.join(__dirname, '../../..', item.image_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pg('inspiration_items').where('id', id).del();

    res.json({ message: 'Inspiration item deleted successfully' });
  } catch (error) {
    console.error('Delete inspiration item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle vital status
router.patch('/inspiration/:id/vital', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get item to check access
    const item = await pg('inspiration_items')
      .where('id', id)
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Inspiration item not found' });
    }

    // Check if user has access to project
    const project = await pg('projects')
      .where('id', item.project_id)
      .andWhere(function() {
        this.where('owner_id', req.user.id)
          .orWhereIn('id', function() {
            this.select('project_id').from('project_collaborators').where('user_id', req.user.id);
          });
      })
      .first();

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    const [updatedItem] = await pg('inspiration_items')
      .where('id', id)
      .update({
        is_vital: !item.is_vital,
        updated_at: new Date()
      })
      .returning('*');

    res.json(updatedItem);
  } catch (error) {
    console.error('Toggle vital error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;