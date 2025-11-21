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
    const widePath = fullFilePath.replace(/(\.[^.]+)$/, '_1800w$1');
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
    const uploadDir = path.join(__dirname, './../__uploads/sketches');
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
    const allowedTypes = ['.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, and JPEG files are allowed.'));
    }
  }
});

// Get all sketches for a project
router.get('/projects/:projectId/sketches', authenticateToken, async (req, res) => {
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

    const items = await pg('sketches')
      .leftJoin('users', 'sketches.user_id', 'users.id')
      .where('sketches.project_id', projectId)
      .select(
        'sketches.*',
        'users.first_name',
        'users.last_name',
        'users.username'
      )
      .orderBy('sketches.created_at', 'desc');
    const itemsWithPaths = items.map(item => {
      const imagePaths = {};
      if (item.image_path) {
        const filename = path.basename(item.image_path);
        imagePaths.original = item.image_path;
        imagePaths.wide = item.image_path.replace(/(\.[^.]+)$/, '_1800w$1');
        imagePaths.thumb = item.image_path.replace(/(\.[^.]+)$/, '_200w$1');
      }
      return {
        ...item,
        imagePaths
      };
    });

    res.json(itemsWithPaths);
  } catch (error) {
    console.error('Get sketches error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single sketch
router.get('/sketches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await pg('sketches')
      .leftJoin('users', 'sketches.user_id', 'users.id')
      .where('sketches.id', id)
      .select(
        'sketches.*',
        'users.first_name',
        'users.last_name',
        'users.username'
      )
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Sketch not found' });
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
    console.error('Get sketch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new sketch
router.post('/projects/:projectId/sketches', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { is_vital } = req.body;

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

    // Process uploaded image
    let imagePath = `/uploads/sketches/${req.file.filename}`;
    let displayPath = null;
    let overlayPath = null;
    
    try {
      const processed = await processImage(`/src/__uploads/sketches/${req.file.filename}`, req.file.filename);
      imagePath = processed.original;
      widePath = processed.wide;
      thumbPath = processed.thumb;
    } catch (error) {
      console.error('Error processing sketch image:', error);
      // Continue with original image if processing fails
    }

    const [item] = await pg('sketches')
      .insert({
        project_id: projectId,
        user_id: req.user.id,
        image_path: imagePath,
        is_vital: is_vital === 'true' || is_vital === true
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
    console.error('Create sketch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a sketch
router.put('/sketches/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_vital } = req.body;

    // Get item to check access
    const item = await pg('sketches')
      .where('id', id)
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Sketch not found' });
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

    const updateData = {
      updated_at: new Date()
    };

    if (is_vital !== undefined) updateData.is_vital = is_vital === 'true' || is_vital === true;
    if (req.file) {
      // Process new image
      let imagePath = `/uploads/sketches/${req.file.filename}`;
      let displayPath = null;
      let overlayPath = null;
      
      try {
        const processed = await processImage(`/src/__uploads/sketches/${req.file.filename}`, req.file.filename);
        imagePath = processed.original;
        widePath = processed.wide;
        thumbPath = processed.thumb;
        updateData.image_path = imagePath;
      } catch (error) {
        console.error('Error processing sketch image:', error);
      }
    }

    const [updatedItem] = await pg('sketches')
      .where('id', id)
      .update(updateData)
      .returning('*');

    res.json({
      ...updatedItem,
      image_paths: {
        original: imagePath && updatedItem.image_path,
        wide: widePath,
        thumb: thumbPath
      }
    });
  } catch (error) {
    console.error('Update sketch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a sketch
router.delete('/sketches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get item to check access
    const item = await pg('sketches')
      .where('id', id)
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Sketch not found' });
    }

    // Check if user is owner of item or project owner
    const project = await pg('projects')
      .where('id', item.project_id)
      .andWhere('owner_id', req.user.id)
      .first();

    if (!project && item.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Access denied' });
    }

    // Delete image files if exist
    const pathsToDelete = [
      item.image_path,
      item.image_path?.replace(/(\.[^.]+)$/, '_200w$1'),
      item.image_path?.replace(/(\.[^.]+)$/, '_1800w$1')
    ].filter(Boolean);

    for (const filePath of pathsToDelete) {
      const fullPath = path.join(__dirname, '../..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await pg('sketches').where('id', id).del();

    res.json({ message: 'Sketch deleted successfully' });
  } catch (error) {
    console.error('Delete sketch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle vital status
router.patch('/sketches/:id/vital', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get item to check access
    const item = await pg('sketches')
      .where('id', id)
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Sketch not found' });
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

    if (!Project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    const [updatedItem] = await pg('sketches')
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