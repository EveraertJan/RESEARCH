const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../helpers/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkRequiredFields } = require('../middleware/validation');
const { successResponse, createdResponse } = require('../utils/responseFormatter');
const ProjectService = require('../services/ProjectService');

const projectService = new ProjectService();

// Get all projects for authenticated user
router.get('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const projects = await projectService.getProjectsForUser(req.user.id);
    successResponse(res, { projects });
  })
);

// Create new project
router.post('/',
  authenticateToken,
  checkRequiredFields(['name']),
  asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.body, req.user.id);
    createdResponse(res, { project }, 'Project created successfully');
  })
);

// Get project by ID
router.get('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const project = await projectService.getProjectById(req.params.id, req.user.id);
    successResponse(res, { project });
  })
);

// Update project
router.put('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(req.params.id, req.user.id, req.body);
    successResponse(res, { project }, 200, 'Project updated successfully');
  })
);

// Delete project
router.delete('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await projectService.deleteProject(req.params.id, req.user.id);
    successResponse(res, null, 200, result.message);
  })
);

// Get collaborators for a project
router.get('/:id/collaborators',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const collaborators = await projectService.getCollaborators(req.params.id, req.user.id);
    successResponse(res, { collaborators });
  })
);

// Add collaborator
router.post('/:id/collaborators',
  authenticateToken,
  checkRequiredFields(['email']),
  asyncHandler(async (req, res) => {
    const result = await projectService.addCollaborator(
      req.params.id,
      req.user.id,
      req.body.email
    );
    createdResponse(res, result, result.message);
  })
);

// Remove collaborator
router.delete('/:id/collaborators/:userId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await projectService.removeCollaborator(
      req.params.id,
      req.user.id,
      req.params.userId
    );
    successResponse(res, null, 200, result.message);
  })
);

module.exports = router;
