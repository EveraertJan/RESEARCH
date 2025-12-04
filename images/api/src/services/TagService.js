const TagRepository = require('../repositories/TagRepository');
const ProjectRepository = require('../repositories/ProjectRepository');
const { AppError } = require('../middleware/errorHandler');

class TagService {
  constructor() {
    this.tagRepository = new TagRepository();
    this.projectRepository = new ProjectRepository();
  }

  async createTag(projectId, userId, tagData) {
    const { name, color1, color2 } = tagData;

    if (!name || name.trim() === '') {
      throw new AppError('Tag name is required', 400);
    }

    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    // Check if tag already exists
    const existing = await this.tagRepository.findByName(projectId, name);
    if (existing) {
      throw new AppError('A tag with this name already exists in this project', 409);
    }

    const tag = await this.tagRepository.createTag(
      projectId,
      name.trim(),
      color1 || '#007AFF',
      color2 || null,
      userId
    );

    return tag;
  }

  async getTagsForProject(projectId, userId) {
    const hasAccess = await this.projectRepository.hasAccess(projectId, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    const tags = await this.tagRepository.findByProject(projectId);
    return tags;
  }

  async updateTag(tagId, userId, updates) {
    const tag = await this.tagRepository.findById(tagId);
    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(tag.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    const updateData = {};
    if (updates.name !== undefined && updates.name.trim()) {
      // Check if new name already exists in project
      const existing = await this.tagRepository.findByName(tag.project_id, updates.name.trim());
      if (existing && existing.id !== tagId) {
        throw new AppError('A tag with this name already exists in this project', 409);
      }
      updateData.name = updates.name.trim();
    }
    if (updates.color1 !== undefined) {
      updateData.color1 = updates.color1;
    }
    if (updates.color2 !== undefined) {
      updateData.color2 = updates.color2;
    }

    const updated = await this.tagRepository.update(tagId, updateData);
    return updated;
  }

  async deleteTag(tagId, userId) {
    const tag = await this.tagRepository.findById(tagId);
    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    const isOwner = await this.projectRepository.isOwner(tag.project_id, userId);
    if (!isOwner) {
      throw new AppError('Only the project owner can delete tags', 403);
    }

    await this.tagRepository.delete(tagId);
    return { message: 'Tag deleted successfully' };
  }

  async addTagToInsight(insightId, tagId, userId) {
    const tag = await this.tagRepository.findById(tagId);
    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(tag.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    // Check if tag is already assigned
    const hasTag = await this.tagRepository.hasTag(insightId, tagId);
    if (hasTag) {
      throw new AppError('Tag is already assigned to this insight', 409);
    }

    await this.tagRepository.addTagToInsight(insightId, tagId);
    return { message: 'Tag added to insight successfully' };
  }

  async removeTagFromInsight(insightId, tagId, userId) {
    const tag = await this.tagRepository.findById(tagId);
    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    const hasAccess = await this.projectRepository.hasAccess(tag.project_id, userId);
    if (!hasAccess) {
      throw new AppError('You do not have access to this project', 403);
    }

    await this.tagRepository.removeTagFromInsight(insightId, tagId);
    return { message: 'Tag removed from insight successfully' };
  }
}

module.exports = TagService;
