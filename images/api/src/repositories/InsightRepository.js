const BaseRepository = require('./BaseRepository');

class InsightRepository extends BaseRepository {
  constructor() {
    super('insights');
  }

  async findByStack(stackId, options = {}) {
    const { tagIds = [], searchQuery = '' } = options;

    let query = this.db(this.tableName)
      .join('users', 'insights.created_by', 'users.id')
      .where('insights.stack_id', stackId);

    // Filter by tags if provided
    if (tagIds.length > 0) {
      query = query
        .join('insight_tags', 'insights.id', 'insight_tags.insight_id')
        .whereIn('insight_tags.tag_id', tagIds)
        .groupBy('insights.id', 'users.id', 'users.username', 'users.first_name', 'users.last_name');
    }

    // Search by keyword if provided
    if (searchQuery.trim()) {
      query = query.where('insights.content', 'ilike', `%${searchQuery}%`);
    }

    const insights = await query
      .select(
        'insights.*',
        'users.username',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('insights.created_at', 'asc');

    // Get tags and documents for each insight
    for (let insight of insights) {
      insight.tags = await this.db('tags')
        .join('insight_tags', 'tags.id', 'insight_tags.tag_id')
        .where('insight_tags.insight_id', insight.id)
        .select('tags.*');

      insight.documents = await this.db('documents')
        .join('insight_documents', 'documents.id', 'insight_documents.document_id')
        .where('insight_documents.insight_id', insight.id)
        .select('documents.*');
    }

    return insights;
  }

  async createInsight(stackId, content, userId) {
    const [result] = await this.db(this.tableName)
      .insert({
        stack_id: stackId,
        content,
        created_by: userId
      })
      .returning('*');
    return result;
  }

  async addDocumentToInsight(insightId, documentId) {
    const [result] = await this.db('insight_documents')
      .insert({
        insight_id: insightId,
        document_id: documentId
      })
      .returning('*');
    return result;
  }

  async removeDocumentFromInsight(insightId, documentId) {
    return await this.db('insight_documents')
      .where({ insight_id: insightId, document_id: documentId })
      .del();
  }

  async hasDocument(insightId, documentId) {
    const result = await this.db('insight_documents')
      .where({ insight_id: insightId, document_id: documentId })
      .first();
    return !!result;
  }

  async getDocumentsForInsight(insightId) {
    return await this.db('documents')
      .join('insight_documents', 'documents.id', 'insight_documents.document_id')
      .where('insight_documents.insight_id', insightId)
      .select('documents.*');
  }

  async searchInsights(stackId, searchQuery) {
    const insights = await this.db(this.tableName)
      .join('users', 'insights.created_by', 'users.id')
      .where('insights.stack_id', stackId)
      .where('insights.content', 'ilike', `%${searchQuery}%`)
      .select(
        'insights.*',
        'users.username',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('insights.created_at', 'asc');

    // Get tags and documents for each insight
    for (let insight of insights) {
      insight.tags = await this.db('tags')
        .join('insight_tags', 'tags.id', 'insight_tags.tag_id')
        .where('insight_tags.insight_id', insight.id)
        .select('tags.*');

      insight.documents = await this.db('documents')
        .join('insight_documents', 'documents.id', 'insight_documents.document_id')
        .where('insight_documents.insight_id', insight.id)
        .select('documents.*');
    }

    return insights;
  }
}

module.exports = InsightRepository;
