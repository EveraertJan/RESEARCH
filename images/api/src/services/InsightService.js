const InsightRepository = require('../repositories/InsightRepository');
const ResearchStackRepository = require('../repositories/ResearchStackRepository');
const ProjectRepository = require('../repositories/ProjectRepository');
const { AppError } = require('../middleware/errorHandler');

class InsightService {
  constructor() {
    this.insightRepository = new InsightRepository();
    this.stackRepository = new ResearchStackRepository();
    this.projectRepository = new ProjectRepository();
  }

  async createInsight(stackId, userId, content) {
    if (!content || content.trim() === '') {
      throw new AppError('Insight content is required', 400);
    }

    const stack = await this.stackRepository.findById(stackId);
    if (!stack) {
      throw new AppError('Stack not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this stack', 403);
    }

    const insight = await this.insightRepository.createInsight(stackId, content, userId);
    return insight;
  }

  async getInsightsForStack(stackId, userId, options = {}) {
    const stack = await this.stackRepository.findById(stackId);
    if (!stack) {
      throw new AppError('Stack not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this stack', 403);
    }

    const insights = await this.insightRepository.findByStack(stackId, options);
    return insights;
  }

  async searchInsights(stackId, userId, searchQuery) {
    const stack = await this.stackRepository.findById(stackId);
    if (!stack) {
      throw new AppError('Stack not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this stack', 403);
    }

    const insights = await this.insightRepository.searchInsights(stackId, searchQuery);
    return insights;
  }

  async deleteInsight(insightId, userId) {
    const insight = await this.insightRepository.findById(insightId);
    if (!insight) {
      throw new AppError('Insight not found', 404);
    }

    const stack = await this.stackRepository.findById(insight.stack_id);
    const isOwner = await this.projectRepository.isOwner(stack.project_id, userId);
    const isCreator = insight.created_by === userId;

    if (!isOwner && !isCreator) {
      throw new AppError('You can only delete your own insights or be the project owner', 403);
    }

    await this.insightRepository.delete(insightId);
    return { message: 'Insight deleted successfully' };
  }
}

module.exports = InsightService;
