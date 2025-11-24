const BaseRepository = require('./BaseRepository');

class ProjectRepository extends BaseRepository {
  constructor() {
    super('projects');
  }

  async findByOwner(ownerId) {
    return await this.findAll({ owner_id: ownerId });
  }

  async findByCollaborator(userId) {
    return await this.db('project_collaborators')
      .join('projects', 'project_collaborators.project_id', 'projects.id')
      .where('project_collaborators.user_id', userId)
      .select('projects.*');
  }

  async findAllForUser(userId) {
    // Get projects where user is owner OR collaborator
    const ownedProjects = await this.findByOwner(userId);
    const collaboratedProjects = await this.findByCollaborator(userId);

    // Combine and deduplicate
    const projectMap = new Map();
    [...ownedProjects, ...collaboratedProjects].forEach(project => {
      projectMap.set(project.id, project);
    });

    return Array.from(projectMap.values());
  }

  async getCollaborators(projectId) {
    return await this.db('project_collaborators')
      .join('users', 'project_collaborators.user_id', 'users.id')
      .where('project_collaborators.project_id', projectId)
      .select(
        'users.id',
        'users.email',
        'users.username',
        'users.first_name',
        'users.last_name',
        'project_collaborators.role',
        'project_collaborators.invited_by',
        'project_collaborators.created_at'
      );
  }

  async addCollaborator(projectId, userId, invitedBy, role = 'collaborator') {
    const [result] = await this.db('project_collaborators')
      .insert({
        project_id: projectId,
        user_id: userId,
        invited_by: invitedBy,
        role
      })
      .returning('*');
    return result;
  }

  async removeCollaborator(projectId, userId) {
    return await this.db('project_collaborators')
      .where({ project_id: projectId, user_id: userId })
      .del();
  }

  async isCollaborator(projectId, userId) {
    const result = await this.db('project_collaborators')
      .where({ project_id: projectId, user_id: userId })
      .first();
    return !!result;
  }

  async isOwner(projectId, userId) {
    const project = await this.findById(projectId);
    return project && project.owner_id === userId;
  }

  async hasAccess(projectId, userId) {
    return await this.isOwner(projectId, userId) || await this.isCollaborator(projectId, userId);
  }
}

module.exports = ProjectRepository;
