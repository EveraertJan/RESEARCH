const InsightRepository = require('../repositories/InsightRepository');
const ResearchStackRepository = require('../repositories/ResearchStackRepository');
const ProjectRepository = require('../repositories/ProjectRepository');
const DocumentRepository = require('../repositories/DocumentRepository');
const { AppError } = require('../middleware/errorHandler');

class InsightService {
  constructor() {
    this.insightRepository = new InsightRepository();
    this.stackRepository = new ResearchStackRepository();
    this.projectRepository = new ProjectRepository();
    this.documentRepository = new DocumentRepository();
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

  async updateInsight(insightId, userId, content) {
    if (!content || content.trim() === '') {
      throw new AppError('Insight content is required', 400);
    }

    const insight = await this.insightRepository.findById(insightId);
    if (!insight) {
      throw new AppError('Insight not found', 404);
    }

    const stack = await this.stackRepository.findById(insight.stack_id);
    const isOwner = await this.projectRepository.isOwner(stack.project_id, userId);
    const isCreator = insight.created_by === userId;

    if (!isOwner && !isCreator) {
      throw new AppError('You can only edit your own insights or be the project owner', 403);
    }

    const updated = await this.insightRepository.update(insightId, { content: content.trim() });
    return updated;
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

  async addDocumentToInsight(insightId, documentId, userId) {
    const insight = await this.insightRepository.findById(insightId);
    if (!insight) {
      throw new AppError('Insight not found', 404);
    }

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Check if user has access to the insight's stack/project
    const stack = await this.stackRepository.findById(insight.stack_id);
    const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this insight', 403);
    }

    // Get existing documents and remove them (only one document per insight allowed)
    const existingDocuments = await this.insightRepository.getDocumentsForInsight(insightId);
    for (const existingDoc of existingDocuments) {
      await this.insightRepository.removeDocumentFromInsight(insightId, existingDoc.id);
    }

    // Add the new document
    await this.insightRepository.addDocumentToInsight(insightId, documentId);
    return { message: 'Document linked to insight successfully' };
  }

  async removeDocumentFromInsight(insightId, documentId, userId) {
    const insight = await this.insightRepository.findById(insightId);
    if (!insight) {
      throw new AppError('Insight not found', 404);
    }

    // Check if user has access to the insight's stack/project
    const stack = await this.stackRepository.findById(insight.stack_id);
    const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this insight', 403);
    }

    await this.insightRepository.removeDocumentFromInsight(insightId, documentId);
    return { message: 'Document unlinked from insight successfully' };
  }

  async getDocumentsForInsight(insightId, userId) {
    const insight = await this.insightRepository.findById(insightId);
    if (!insight) {
      throw new AppError('Insight not found', 404);
    }

    // Check if user has access to the insight's stack/project
    const stack = await this.stackRepository.findById(insight.stack_id);
    const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this insight', 403);
    }

    const documents = await this.insightRepository.getDocumentsForInsight(insightId);
    return documents;
  }
}

module.exports = InsightService;
