const ProjectRepository = require('../repositories/ProjectRepository');
const UserRepository = require('../repositories/UserRepository');
const { AppError } = require('../middleware/errorHandler');

class ProjectService {
  constructor() {
    this.projectRepository = new ProjectRepository();
    this.userRepository = new UserRepository();
  }

  async createProject(projectData, ownerId) {
    const { name, client, deadline } = projectData;

    if (!name) {
      throw new AppError('Project name is required', 400);
    }

    const project = await this.projectRepository.create({
      name,
      client,
      deadline,
      owner_id: ownerId
    });

    return project;
  }

  async getProjectsForUser(userId) {
    const projects = await this.projectRepository.findAllForUser(userId);
    return projects;
  }

  async getProjectById(projectId, userId) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    const collaborators = await this.projectRepository.getCollaborators(projectId);

    return {
      ...project,
      collaborators
    };
  }

  async updateProject(projectId, userId, updateData) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const isOwner = await this.projectRepository.isOwner(projectId, userId);
    if (!isOwner) {
      throw new AppError('Only the project owner can update project details', 403);
    }

    const { name, client, deadline } = updateData;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name;
    if (client !== undefined) fieldsToUpdate.client = client;
    if (deadline !== undefined) fieldsToUpdate.deadline = deadline;

    const updatedProject = await this.projectRepository.update(projectId, fieldsToUpdate);
    return updatedProject;
  }

  async deleteProject(projectId, userId) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const isOwner = await this.projectRepository.isOwner(projectId, userId);
    if (!isOwner) {
      throw new AppError('Only the project owner can delete the project', 403);
    }

    await this.projectRepository.delete(projectId);
    return { message: 'Project deleted successfully' };
  }

  async addCollaborator(projectId, userId, collaboratorEmail) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const isOwner = await this.projectRepository.isOwner(projectId, userId);
    if (!isOwner) {
      throw new AppError('Only the project owner can add collaborators', 403);
    }

    const collaborator = await this.userRepository.findByEmail(collaboratorEmail);
    if (!collaborator) {
      throw new AppError('User with this email not found', 404);
    }

    if (collaborator.id === userId) {
      throw new AppError('You cannot add yourself as a collaborator', 400);
    }

    const isAlreadyCollaborator = await this.projectRepository.isCollaborator(projectId, collaborator.id);
    if (isAlreadyCollaborator) {
      throw new AppError('User is already a collaborator on this project', 409);
    }

    await this.projectRepository.addCollaborator(projectId, collaborator.id, userId);

    return {
      message: 'Collaborator added successfully',
      collaborator: {
        id: collaborator.id,
        email: collaborator.email,
        username: collaborator.username,
        first_name: collaborator.first_name,
        last_name: collaborator.last_name
      }
    };
  }

  async removeCollaborator(projectId, userId, collaboratorId) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const isOwner = await this.projectRepository.isOwner(projectId, userId);
    const isSelf = userId === collaboratorId;

    if (!isOwner && !isSelf) {
      throw new AppError('You can only remove yourself or be the project owner', 403);
    }

    if (isOwner && isSelf) {
      throw new AppError('Project owner cannot remove themselves', 400);
    }

    const isCollaborator = await this.projectRepository.isCollaborator(projectId, collaboratorId);
    if (!isCollaborator) {
      throw new AppError('User is not a collaborator on this project', 404);
    }

    await this.projectRepository.removeCollaborator(projectId, collaboratorId);

    return { message: 'Collaborator removed successfully' };
  }

  async getCollaborators(projectId, userId) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    const collaborators = await this.projectRepository.getCollaborators(projectId);
    return collaborators;
  }
}

module.exports = ProjectService;
