const BaseRepository = require('./BaseRepository');

class ResearchStackRepository extends BaseRepository {
  constructor() {
    super('research_stacks');
  }

  async findByProject(projectId) {
    return await this.findAll({ project_id: projectId });
  }

  async findByProjectAndTopic(projectId, topic) {
    return await this.findOne({ project_id: projectId, topic });
  }

  async getStackWithInsights(stackId) {
    const stack = await this.findById(stackId);
    if (!stack) return null;

    const insights = await this.db('insights')
      .join('users', 'insights.created_by', 'users.id')
      .where('insights.stack_id', stackId)
      .select(
        'insights.*',
        'users.username',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('insights.created_at', 'asc');

    return {
      ...stack,
      insights
    };
  }
}

module.exports = ResearchStackRepository;
