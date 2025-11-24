const BaseRepository = require('./BaseRepository');

class TagRepository extends BaseRepository {
  constructor() {
    super('tags');
  }

  async findByProject(projectId) {
    return await this.findAll({ project_id: projectId });
  }

  async findByName(projectId, name) {
    return await this.findOne({ project_id: projectId, name });
  }

  async createTag(projectId, name, color1, color2, userId) {
    const [result] = await this.db(this.tableName)
      .insert({
        project_id: projectId,
        name,
        color1,
        color2,
        created_by: userId
      })
      .returning('*');
    return result;
  }

  async getTagsForInsight(insightId) {
    return await this.db('tags')
      .join('insight_tags', 'tags.id', 'insight_tags.tag_id')
      .where('insight_tags.insight_id', insightId)
      .select('tags.*');
  }

  async addTagToInsight(insightId, tagId) {
    const [result] = await this.db('insight_tags')
      .insert({
        insight_id: insightId,
        tag_id: tagId
      })
      .returning('*');
    return result;
  }

  async removeTagFromInsight(insightId, tagId) {
    return await this.db('insight_tags')
      .where({ insight_id: insightId, tag_id: tagId })
      .del();
  }

  async hasTag(insightId, tagId) {
    const result = await this.db('insight_tags')
      .where({ insight_id: insightId, tag_id: tagId })
      .first();
    return !!result;
  }
}

module.exports = TagRepository;
