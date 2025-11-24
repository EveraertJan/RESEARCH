const ResearchStackRepository = require('../repositories/ResearchStackRepository');
const ProjectRepository = require('../repositories/ProjectRepository');
const { AppError } = require('../middleware/errorHandler');

class ResearchStackService {
  constructor() {
    this.stackRepository = new ResearchStackRepository();
    this.projectRepository = new ProjectRepository();
  }

  async createStack(projectId, userId, topic) {
    if (!topic || topic.trim() === '') {
      throw new AppError('Stack topic is required', 400);
    }

    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    // Check if stack with this topic already exists
    const existing = await this.stackRepository.findByProjectAndTopic(projectId, topic);
    if (existing) {
      throw new AppError('A stack with this topic already exists', 409);
    }

    const stack = await this.stackRepository.create({
      project_id: projectId,
      topic,
      created_by: userId
    });

    return stack;
  }

  async getStacksForProject(projectId, userId) {
    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    const stacks = await this.stackRepository.findByProject(projectId);
    return stacks;
  }

  async getStackWithInsights(stackId, userId) {
    const stack = await this.stackRepository.findById(stackId);

    if (!stack) {
      throw new AppError('Stack not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this stack', 403);
    }

    const stackWithInsights = await this.stackRepository.getStackWithInsights(stackId);
    return stackWithInsights;
  }
}

module.exports = ResearchStackService;
