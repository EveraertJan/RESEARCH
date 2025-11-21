const express = require('express');
const router = express.Router();
const { checkBodyFields } = require("./../helpers/bodyHelpers");
const { authenticateToken } = require("./../helpers/authMiddleware");
const config = require('./../db/knexfile').development;
const pg = require('knex')(config);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, './../__uploads/documents');
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
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept documents and images
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, PNG, JPG, and JPEG files are allowed.'));
    }
  }
});

// Get all technology items for a project
router.get('/projects/:projectId/technologies', authenticateToken, async (req, res) => {
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

    const items = await pg('technology_items')
      .leftJoin('users', 'technology_items.user_id', 'users.id')
      .where('technology_items.project_id', projectId)
      .select(
        'technology_items.*',
        'users.first_name',
        'users.last_name',
        'users.username'
      )
      .orderBy('technology_items.created_at', 'desc');

    res.json(items);
  } catch (error) {
    console.error('Get technology items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single technology item
router.get('/technologies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await pg('technology_items')
      .leftJoin('users', 'technology_items.user_id', 'users.id')
      .where('technology_items.id', id)
      .select(
        'technology_items.*',
        'users.first_name',
        'users.last_name',
        'users.username'
      )
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Technology item not found' });
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
    console.error('Get technology item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new technology item
router.post('/projects/:projectId/technologies', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, url, amount_per_unit, unit, is_vital, is_rented } = req.body;

    if (!checkBodyFields(req.body, ['name'])) {
      return res.status(400).json({ message: 'Technology name is required' });
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

    // Process uploaded document
    let documentPath = null;
    if (req.file) {
      documentPath = `/uploads/documents/${req.file.filename}`;
    }

    const [item] = await pg('technology_items')
      .insert({
        project_id: projectId,
        user_id: req.user.id,
        name,
        description: description || '',
        url: url || null,
        document_path: documentPath,
        amount_per_unit: amount_per_unit || null,
        unit: unit || null,
        is_vital: is_vital === 'true' || is_vital === true,
        is_rented: is_rented === 'true' || is_rented === true
      })
      .returning('*');

    res.status(201).json(item);
  } catch (error) {
    console.error('Create technology item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a technology item
router.put('/technologies/:id', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, url, amount_per_unit, unit, is_vital, is_rented } = req.body;

    // Get item to check access
    const item = await pg('technology_items')
      .where('id', id)
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Technology item not found' });
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

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (url !== undefined) updateData.url = url;
    if (amount_per_unit !== undefined) updateData.amount_per_unit = amount_per_unit;
    if (unit !== undefined) updateData.unit = unit;
    if (is_vital !== undefined) updateData.is_vital = is_vital === 'true' || is_vital === true;
    if (is_rented !== undefined) updateData.is_rented = is_rented === 'true' || is_rented === true;
    if (req.file) {
      // Process new document
      let documentPath = `/uploads/documents/${req.file.filename}`;
      try {
        // Here you could add document processing if needed
        updateData.document_path = documentPath;
      } catch (error) {
        console.error('Error processing document:', error);
      }
    }

    const [updatedItem] = await pg('technology_items')
      .where('id', id)
      .update(updateData)
      .returning('*');

    res.json(updatedItem);
  } catch (error) {
    console.error('Update technology item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a technology item
router.delete('/technologies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get item to check access
    const item = await pg('technology_items')
      .where('id', id)
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Technology item not found' });
    }

    // Check if user is owner of item or project owner
    const project = await pg('projects')
      .where('id', item.project_id)
      .andWhere(function() {
        this.where('owner_id', req.user.id)
          .orWhere('technology_items.user_id', req.user.id);
      })
      .join('technology_items', 'projects.id', 'technology_items.project_id')
      .first();

    if (!project && item.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Access denied' });
    }

    // Delete document file if exists
    if (item.document_path) {
      const filePath = path.join(__dirname, '../..', item.document_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pg('technology_items').where('id', id).del();

    res.json({ message: 'Technology item deleted successfully' });
  } catch (error) {
    console.error('Delete technology item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle vital status
router.patch('/technologies/:id/vital', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get item to check access
    const item = await pg('technology_items')
      .where('id', id)
      .first();

    if (!item) {
      return res.status(404).json({ message: 'Technology item not found' });
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

    const [updatedItem] = await pg('technology_items')
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