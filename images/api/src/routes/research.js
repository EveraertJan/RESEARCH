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
    const uploadDir = path.join(__dirname, '.././__uploads/documents');
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
    // Accept common document types
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed.'));
    }
  }
});

// Get all research findings for a project
router.get('/projects/:projectId/findings', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { search } = req.query;

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

    let query = pg('research_findings')
      .where('project_id', projectId)
      .join('users', 'research_findings.user_id', 'users.id')
      .select(
        'research_findings.*',
        'users.first_name',
        'users.last_name',
        'users.username'
      )
      .orderBy('research_findings.created_at', 'desc');

    // Add search functionality
    if (search) {
      query = query.where(function() {
        this.where('research_findings.title', 'ilike', `%${search}%`)
          .orWhere('research_findings.body', 'ilike', `%${search}%`);
      });
    }

    const findings = await query;
    res.json(findings);
  } catch (error) {
    console.error('Get findings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single research finding
router.get('/findings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const finding = await pg('research_findings')
      .where('research_findings.id', id)
      .join('users', 'research_findings.user_id', 'users.id')
      .select(
        'research_findings.*',
        'users.first_name',
        'users.last_name',
        'users.username'
      )
      .first();

    if (!finding) {
      return res.status(404).json({ message: 'Finding not found' });
    }

    // Check if user has access to the project
    const project = await pg('projects')
      .where('id', finding.project_id)
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

    res.json(finding);
  } catch (error) {
    console.error('Get finding error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new research finding
router.post('/projects/:projectId/findings', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, body, url, is_vital } = req.body;

    if (!checkBodyFields(req.body, ['title'])) {
      return res.status(400).json({ message: 'Title is required' });
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

    const [finding] = await pg('research_findings')
      .insert({
        project_id: projectId,
        user_id: req.user.id,
        title,
        body: body || '',
        url: url || null,
        document_path: req.file ? `/uploads/documents/${req.file.filename}` : null,
        is_vital: is_vital === 'true' || is_vital === true
      })
      .returning('*');

    res.status(201).json(finding);
  } catch (error) {
    console.error('Create finding error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a research finding
router.put('/findings/:id', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, url, is_vital } = req.body;

    // Get the finding to check access
    const finding = await pg('research_findings')
      .where('id', id)
      .first();

    if (!finding) {
      return res.status(404).json({ message: 'Finding not found' });
    }

    // Check if user has access to the project
    const project = await pg('projects')
      .where('id', finding.project_id)
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

    if (title !== undefined) updateData.title = title;
    if (body !== undefined) updateData.body = body;
    if (url !== undefined) updateData.url = url;
    if (is_vital !== undefined) updateData.is_vital = is_vital === 'true' || is_vital === true;
    if (req.file) updateData.document_path = `/__uploads/documents/${req.file.filename}`;

    const [updatedFinding] = await pg('research_findings')
      .where('id', id)
      .update(updateData)
      .returning('*');

    res.json(updatedFinding);
  } catch (error) {
    console.error('Update finding error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a research finding
router.delete('/findings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the finding to check access
    const finding = await pg('research_findings')
      .where('id', id)
      .first();

    if (!finding) {
      return res.status(404).json({ message: 'Finding not found' });
    }

    // Check if user is the owner of the finding or project owner
    const project = await pg('projects')
      .where('id', finding.project_id)
      .andWhere('owner_id', req.user.id)
      .first();
    console.log(project)
    console.log(finding)
    if (!project && finding.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Access denied' });
    }

    // Delete document file if exists
    if (finding.document_path) {
      const filePath = path.join(__dirname, '../../..', finding.document_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pg('research_findings').where('id', id).del();

    res.json({ message: 'Finding deleted successfully' });
  } catch (error) {
    console.error('Delete finding error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle vital status
router.patch('/findings/:id/vital', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the finding to check access
    const finding = await pg('research_findings')
      .where('id', id)
      .first();

    if (!finding) {
      return res.status(404).json({ message: 'Finding not found' });
    }

    // Check if user has access to the project
    const project = await pg('projects')
      .where('id', finding.project_id)
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

    const [updatedFinding] = await pg('research_findings')
      .where('id', id)
      .update({
        is_vital: !finding.is_vital,
        updated_at: new Date()
      })
      .returning('*');

    res.json(updatedFinding);
  } catch (error) {
    console.error('Toggle vital error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;