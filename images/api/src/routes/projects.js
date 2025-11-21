const express = require('express');
const router = express.Router();
const { checkBodyFields } = require("./../helpers/bodyHelpers");
const { decodeToken } = require("./../helpers/authHelpers");
const { authenticateToken } = require("./../helpers/authMiddleware");
const config = require('./../db/knexfile').development;
const pg = require('knex')(config);

// Get all projects for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await pg('projects')
      .where('owner_id', req.user.id)
      .orWhereIn('id', function() {
        this.select('project_id').from('project_collaborators').where('user_id', req.user.id);
      })
      .orderBy('created_at', 'desc');

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a specific project with its sections
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;

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

    // Get project sections with user attribution
    const sections = await pg('project_sections')
      .leftJoin('users', 'project_sections.last_updated_by', 'users.id')
      .where('project_sections.project_id', projectId)
      .select(
        'project_sections.*',
        'users.first_name as updated_by_first_name',
        'users.last_name as updated_by_last_name',
        'users.username as updated_by_username'
      )
      .orderBy('project_sections.section_type');

    res.json({
      ...project,
      sections
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, client, deadline } = req.body;
    
    if (!checkBodyFields(req.body, ['name'])) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const [project] = await pg('projects')
      .insert({
        name,
        client,
        deadline: deadline || null,
        owner_id: req.user.id
      })
      .returning('*');

    // Create default sections for the project
    const defaultSections = ['research', 'inspiration', 'sketches', 'technologies'];
    await pg('project_sections').insert(
      defaultSections.map(sectionType => ({
        project_id: project.id,
        section_type: sectionType,
        title: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
        content: ''
      }))
    );

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, client, deadline } = req.body;

    // Check if user is the owner
    const project = await pg('projects')
      .where('id', projectId)
      .andWhere('owner_id', req.user.id)
      .first();

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    const [updatedProject] = await pg('projects')
      .where('id', projectId)
      .update({
        name: name || project.name,
        client: client !== undefined ? client : project.client,
        deadline: deadline !== undefined ? deadline : project.deadline,
        updated_at: new Date()
      })
      .returning('*');

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if user is the owner
    const project = await pg('projects')
      .where('id', projectId)
      .andWhere('owner_id', req.user.id)
      .first();

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    await pg('projects').where('id', projectId).del();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update project section
router.put('/:id/sections/:sectionType', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const sectionType = req.params.sectionType;
    const { content, title } = req.body;

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

    const [updatedSection] = await pg('project_sections')
      .where('project_id', projectId)
      .andWhere('section_type', sectionType)
      .update({
        content: content !== undefined ? content : pg.raw('content'),
        title: title !== undefined ? title : pg.raw('title'),
        last_updated_by: req.user.id,
        updated_at: new Date()
      })
      .returning('*');

    if (!updatedSection) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json(updatedSection);
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get project collaborators
router.get('/:id/collaborators', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;

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

    // Get project owner details
    const owner = await pg('users')
      .where('id', project.owner_id)
      .select(
        'id as user_id',
        'username',
        'first_name',
        'last_name',
        'email'
      )
      .first();

    // Get collaborators with user details and invitation info
    const collaborators = await pg('project_collaborators')
      .leftJoin('users', 'project_collaborators.user_id', 'users.id')
      .leftJoin('users as inviters', 'project_collaborators.invited_by', 'inviters.id')
      .where('project_collaborators.project_id', projectId)
      .select(
        'project_collaborators.id',
        'project_collaborators.role',
        'project_collaborators.created_at',
        'project_collaborators.invited_by',
        'users.id as user_id',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.email',
        'inviters.first_name as invited_by_first_name',
        'inviters.last_name as invited_by_last_name',
        'inviters.username as invited_by_username'
      );

    // Combine owner and collaborators, with owner first
    const allMembers = owner ? [
      {
        ...owner,
        role: 'owner',
        created_at: project.created_at,
        invited_by: null,
        invited_by_first_name: null,
        invited_by_last_name: null,
        invited_by_username: null
      },
      ...collaborators
    ] : collaborators;

    res.json(allMembers);
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add collaborator to project
router.post('/:id/collaborators', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { email, role = 'collaborator' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user is the project owner
    const project = await pg('projects')
      .where('id', projectId)
      .andWhere('owner_id', req.user.id)
      .first();

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Find user to add as collaborator by email
    const userToAdd = await pg('users')
      .where('email', email)
      .first();

    if (!userToAdd) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Check if user is already a collaborator
    const existingCollaborator = await pg('project_collaborators')
      .where('project_id', projectId)
      .andWhere('user_id', userToAdd.id)
      .first();

    if (existingCollaborator) {
      return res.status(409).json({ message: 'User is already a collaborator' });
    }

    // Add collaborator
    const [collaborator] = await pg('project_collaborators')
      .insert({
        project_id: projectId,
        user_id: userToAdd.id,
        role,
        invited_by: req.user.id
      })
      .returning('*');

    // Get user details for response
    const collaboratorWithUser = await pg('project_collaborators')
      .join('users', 'project_collaborators.user_id', 'users.id')
      .where('project_collaborators.id', collaborator.id)
      .select(
        'project_collaborators.id',
        'project_collaborators.role',
        'project_collaborators.created_at',
        'project_collaborators.invited_by',
        'users.id as user_id',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.email'
      )
      .first();

    res.status(201).json(collaboratorWithUser);
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove collaborator from project
router.delete('/:id/collaborators/:collaboratorId', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const collaboratorId = req.params.collaboratorId;

    // Get collaborator to check permissions
    const collaborator = await pg('project_collaborators')
      .where('id', collaboratorId)
      .andWhere('project_id', projectId)
      .first();

    if (!collaborator) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }

    // Check if user is project owner or the collaborator themselves
    const project = await pg('projects')
      .where('id', projectId)
      .andWhere(function() {
        this.where('owner_id', req.user.id)
          .orWhere('project_collaborators.user_id', req.user.id);
      })
      .join('project_collaborators', 'projects.id', 'project_collaborators.project_id')
      .first();

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    // Allow removal if user is project owner or removing themselves
    if (project.owner_id !== req.user.id && collaborator.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove collaborator
    const deleted = await pg('project_collaborators')
      .where('id', collaboratorId)
      .andWhere('project_id', projectId)
      .del();

    if (deleted === 0) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }

    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;