const BaseRepository = require('./BaseRepository');

class DocumentRepository extends BaseRepository {
  constructor() {
    super('documents');
  }

  async findByStack(stackId, options = {}) {
    const { tagIds = [] } = options;

    let query = this.db(this.tableName)
      .join('users', 'documents.created_by', 'users.id')
      .where('documents.stack_id', stackId);

    if (tagIds.length > 0) {
      query = query
        .join('document_tags', 'documents.id', 'document_tags.document_id')
        .whereIn('document_tags.tag_id', tagIds)
        .groupBy('documents.id', 'users.id', 'users.username', 'users.first_name', 'users.last_name');
    }

    const documents = await query
      .select(
        'documents.*',
        'users.username',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('documents.created_at', 'desc');

    // Get tags for each document
    for (let document of documents) {
      document.tags = await this.db('tags')
        .join('document_tags', 'tags.id', 'document_tags.tag_id')
        .where('document_tags.document_id', document.id)
        .select('tags.*');
    }

    return documents;
  }

  async findByProject(projectId, options = {}) {
    const { tagIds = [] } = options;

    // Get documents directly uploaded to this project
    let directQuery = this.db(this.tableName)
      .join('users', 'documents.created_by', 'users.id')
      .where('documents.project_id', projectId);

    if (tagIds.length > 0) {
      directQuery = directQuery
        .join('document_tags', 'documents.id', 'document_tags.document_id')
        .whereIn('document_tags.tag_id', tagIds)
        .groupBy('documents.id', 'users.id', 'users.username', 'users.first_name', 'users.last_name');
    }

    const directDocuments = await directQuery
      .select(
        'documents.*',
        'users.username',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('documents.created_at', 'desc');

    // Get documents referenced in this project
    let referencedQuery = this.db('document_references')
      .join('documents', 'document_references.document_id', 'documents.id')
      .join('users', 'documents.created_by', 'users.id')
      .where('document_references.project_id', projectId);

    if (tagIds.length > 0) {
      referencedQuery = referencedQuery
        .join('document_tags', 'documents.id', 'document_tags.document_id')
        .whereIn('document_tags.tag_id', tagIds)
        .groupBy('documents.id', 'users.id', 'users.username', 'users.first_name', 'users.last_name', 'document_references.id');
    }

    const referencedDocuments = await referencedQuery
      .select(
        'documents.*',
        'users.username',
        'users.first_name',
        'users.last_name',
        this.db.raw('true as is_referenced')
      )
      .orderBy('document_references.created_at', 'desc');

    // Combine and deduplicate
    const documentMap = new Map();
    [...directDocuments, ...referencedDocuments].forEach(doc => {
      if (!documentMap.has(doc.id)) {
        documentMap.set(doc.id, doc);
      }
    });

    const documents = Array.from(documentMap.values());

    // Get tags for each document
    for (let document of documents) {
      document.tags = await this.db('tags')
        .join('document_tags', 'tags.id', 'document_tags.tag_id')
        .where('document_tags.document_id', document.id)
        .select('tags.*');
    }

    return documents;
  }

  async findAll(options = {}) {
    const { userId, tagIds = [] } = options;

    let query = this.db(this.tableName)
      .join('users', 'documents.created_by', 'users.id');

    if (userId) {
      query = query.where('documents.created_by', userId);
    }

    if (tagIds.length > 0) {
      query = query
        .join('document_tags', 'documents.id', 'document_tags.document_id')
        .whereIn('document_tags.tag_id', tagIds)
        .groupBy('documents.id', 'users.id', 'users.username', 'users.first_name', 'users.last_name');
    }

    const documents = await query
      .select(
        'documents.*',
        'users.username',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('documents.created_at', 'desc');

    // Get tags for each document
    for (let document of documents) {
      document.tags = await this.db('tags')
        .join('document_tags', 'tags.id', 'document_tags.tag_id')
        .where('document_tags.document_id', document.id)
        .select('tags.*');
    }

    return documents;
  }

  async createDocument(projectId, stackId, name, description, filePath, mimeType, fileSize, userId) {
    const [result] = await this.db(this.tableName)
      .insert({
        project_id: projectId,
        stack_id: stackId,
        name,
        description,
        file_path: filePath,
        mime_type: mimeType,
        file_size: fileSize,
        created_by: userId
      })
      .returning('*');
    return result;
  }

  async addReference(documentId, projectId, stackId, userId) {
    const [result] = await this.db('document_references')
      .insert({
        document_id: documentId,
        project_id: projectId,
        stack_id: stackId,
        added_by: userId
      })
      .returning('*');
    return result;
  }

  async removeReference(documentId, projectId, stackId = null) {
    const query = this.db('document_references')
      .where({ document_id: documentId, project_id: projectId });

    if (stackId) {
      query.where({ stack_id: stackId });
    }

    return await query.del();
  }

  async getReferences(documentId) {
    return await this.db('document_references')
      .join('projects', 'document_references.project_id', 'projects.id')
      .leftJoin('research_stacks', 'document_references.stack_id', 'research_stacks.id')
      .where('document_references.document_id', documentId)
      .select(
        'document_references.*',
        'projects.name as project_name',
        'research_stacks.topic as stack_topic'
      );
  }

  async getTagsForDocument(documentId) {
    return await this.db('tags')
      .join('document_tags', 'tags.id', 'document_tags.tag_id')
      .where('document_tags.document_id', documentId)
      .select('tags.*');
  }

  async addTagToDocument(documentId, tagId) {
    const [result] = await this.db('document_tags')
      .insert({
        document_id: documentId,
        tag_id: tagId
      })
      .returning('*');
    return result;
  }

  async removeTagFromDocument(documentId, tagId) {
    return await this.db('document_tags')
      .where({ document_id: documentId, tag_id: tagId })
      .del();
  }

  async hasTag(documentId, tagId) {
    const result = await this.db('document_tags')
      .where({ document_id: documentId, tag_id: tagId })
      .first();
    return !!result;
  }

  async getInsightsForDocument(documentId) {
    return await this.db('insights')
      .join('insight_documents', 'insights.id', 'insight_documents.insight_id')
      .join('users', 'insights.created_by', 'users.id')
      .where('insight_documents.document_id', documentId)
      .select(
        'insights.*',
        'users.username',
        'users.first_name',
        'users.last_name'
      );
  }
}

module.exports = DocumentRepository;
