const DocumentRepository = require('../repositories/DocumentRepository');
const ProjectRepository = require('../repositories/ProjectRepository');
const ResearchStackRepository = require('../repositories/ResearchStackRepository');
const { AppError } = require('../middleware/errorHandler');

class DocumentService {
  constructor() {
    this.documentRepository = new DocumentRepository();
    this.projectRepository = new ProjectRepository();
    this.stackRepository = new ResearchStackRepository();
  }

  async createDocument(stackId, userId, documentData) {
    const { name, description, filePath, mimeType, fileSize } = documentData;

    if (!name || name.trim() === '') {
      throw new AppError('Document name is required', 400);
    }

    if (!filePath) {
      throw new AppError('File path is required', 400);
    }

    // If stackId is provided, verify access
    let projectId = null;
    if (stackId) {
      const stack = await this.stackRepository.findById(stackId);
      if (!stack) {
        throw new AppError('Research stack not found', 404);
      }

      const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
      if (!hasAccess) {
        throw new AppError('You do not have access to this project', 403);
      }

      projectId = stack.project_id;
    }

    const document = await this.documentRepository.createDocument(
      projectId,
      stackId,
      name.trim(),
      description ? description.trim() : null,
      filePath,
      mimeType,
      fileSize,
      userId
    );

    return document;
  }

  async getDocumentsForStack(stackId, userId, options = {}) {
    const stack = await this.stackRepository.findById(stackId);
    if (!stack) {
      throw new AppError('Research stack not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(stack.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    const documents = await this.documentRepository.findByStack(stackId, options);
    return documents;
  }

  async getDocumentsForProject(projectId, userId, options = {}) {
    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    const documents = await this.documentRepository.findByProject(projectId, options);
    return documents;
  }

  async getAllDocuments(userId, options = {}) {
    // Get all documents created by the user or accessible through their projects
    const documents = await this.documentRepository.findAll({ userId, ...options });
    return documents;
  }

  async getDocumentById(documentId, userId) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // If document is attached to a project, check access
    if (document.project_id) {
      const hasAccess = await this.projectRepository.hasAccess(document.project_id, userId);
      if (!hasAccess && document.created_by !== userId) {
        throw new AppError('You do not have access to this document', 403);
      }
    } else if (document.created_by !== userId) {
      // If not attached to a project, only creator can access
      throw new AppError('You do not have access to this document', 403);
    }

    return document;
  }

  async updateDocument(documentId, userId, updates) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Check if user is the creator or has access to the project
    if (document.project_id) {
      const hasAccess = await this.projectRepository.hasAccess(document.project_id, userId);
      if (!hasAccess && document.created_by !== userId) {
        throw new AppError('You do not have access to this document', 403);
      }
    } else if (document.created_by !== userId) {
      throw new AppError('Only the document creator can update this document', 403);
    }

    const updateData = {};
    if (updates.name !== undefined && updates.name.trim()) {
      updateData.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description ? updates.description.trim() : null;
    }

    const updated = await this.documentRepository.update(documentId, updateData);
    return updated;
  }

  async deleteDocument(documentId, userId) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Check if user is the creator or has access to the project
    if (document.project_id) {
      const hasAccess = await this.projectRepository.hasAccess(document.project_id, userId);
      if (!hasAccess && document.created_by !== userId) {
        throw new AppError('You do not have access to this document', 403);
      }
    } else if (document.created_by !== userId) {
      throw new AppError('Only the document creator can delete this document', 403);
    }

    await this.documentRepository.delete(documentId);
    return { message: 'Document deleted successfully' };
  }

  async addReferenceToProject(documentId, projectId, stackId, userId) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new AppError('Document not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    // If stackId is provided, verify it belongs to the project
    if (stackId) {
      const stack = await this.stackRepository.findById(stackId);
      if (!stack || stack.project_id !== projectId) {
        throw new AppError('Stack not found in this project', 404);
      }
    }

    try {
      await this.documentRepository.addReference(documentId, projectId, stackId, userId);
      return { message: 'Document reference added successfully' };
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new AppError('This document is already referenced in this project/stack', 409);
      }
      throw error;
    }
  }

  async removeReferenceFromProject(documentId, projectId, stackId, userId) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new AppError('Document not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    await this.documentRepository.removeReference(documentId, projectId, stackId);
    return { message: 'Document reference removed successfully' };
  }

  async getReferences(documentId, userId) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Check access
    if (document.project_id) {
      const hasAccess = await this.projectRepository.hasAccess(document.project_id, userId);
      if (!hasAccess && document.created_by !== userId) {
        throw new AppError('You do not have access to this document', 403);
      }
    } else if (document.created_by !== userId) {
      throw new AppError('You do not have access to this document', 403);
    }

    const references = await this.documentRepository.getReferences(documentId);
    return references;
  }

  async addTagToDocument(documentId, tagId, userId) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Check access
    if (document.project_id) {
      const hasAccess = await this.projectRepository.hasAccess(document.project_id, userId);
      if (!hasAccess) {
        throw new AppError('You do not have access to this project', 403);
      }
    } else if (document.created_by !== userId) {
      throw new AppError('You do not have access to this document', 403);
    }

    const hasTag = await this.documentRepository.hasTag(documentId, tagId);
    if (hasTag) {
      throw new AppError('Tag is already assigned to this document', 409);
    }

    await this.documentRepository.addTagToDocument(documentId, tagId);
    return { message: 'Tag added to document successfully' };
  }

  async removeTagFromDocument(documentId, tagId, userId) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Check access
    if (document.project_id) {
      const hasAccess = await this.projectRepository.hasAccess(document.project_id, userId);
      if (!hasAccess) {
        throw new AppError('You do not have access to this project', 403);
      }
    } else if (document.created_by !== userId) {
      throw new AppError('You do not have access to this document', 403);
    }

    await this.documentRepository.removeTagFromDocument(documentId, tagId);
    return { message: 'Tag removed from document successfully' };
  }
}

module.exports = DocumentService;
