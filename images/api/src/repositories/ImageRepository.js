const BaseRepository = require('./BaseRepository');

class ImageRepository extends BaseRepository {
  constructor() {
    super('images');
  }

  async findByStack(stackId, options = {}) {
    const { tagIds = [] } = options;

    let query = this.db(this.tableName)
      .join('users', 'images.created_by', 'users.id')
      .where('images.stack_id', stackId);

    if (tagIds.length > 0) {
      query = query
        .join('image_tags', 'images.id', 'image_tags.image_id')
        .whereIn('image_tags.tag_id', tagIds)
        .groupBy('images.id', 'users.id', 'users.username', 'users.first_name', 'users.last_name');
    }

    const images = await query
      .select(
        'images.*',
        'users.username',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('images.created_at', 'desc');

    // Get tags for each image
    for (let image of images) {
      image.tags = await this.db('tags')
        .join('image_tags', 'tags.id', 'image_tags.tag_id')
        .where('image_tags.image_id', image.id)
        .select('tags.*');
    }

    return images;
  }

  async createImage(projectId, stackId, name, filePath, mimeType, fileSize, userId) {
    const [result] = await this.db(this.tableName)
      .insert({
        project_id: projectId,
        stack_id: stackId,
        name,
        file_path: filePath,
        mime_type: mimeType,
        file_size: fileSize,
        created_by: userId
      })
      .returning('*');
    return result;
  }

  async getTagsForImage(imageId) {
    return await this.db('tags')
      .join('image_tags', 'tags.id', 'image_tags.tag_id')
      .where('image_tags.image_id', imageId)
      .select('tags.*');
  }

  async addTagToImage(imageId, tagId) {
    const [result] = await this.db('image_tags')
      .insert({
        image_id: imageId,
        tag_id: tagId
      })
      .returning('*');
    return result;
  }

  async removeTagFromImage(imageId, tagId) {
    return await this.db('image_tags')
      .where({ image_id: imageId, tag_id: tagId })
      .del();
  }

  async hasTag(imageId, tagId) {
    const result = await this.db('image_tags')
      .where({ image_id: imageId, tag_id: tagId })
      .first();
    return !!result;
  }
}

module.exports = ImageRepository;
