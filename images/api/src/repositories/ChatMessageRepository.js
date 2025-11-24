const BaseRepository = require('./BaseRepository');

class ChatMessageRepository extends BaseRepository {
  constructor() {
    super('chat_messages');
  }

  async findByProject(projectId, stackId = null) {
    const query = this.db(this.tableName)
      .leftJoin('users', 'chat_messages.user_id', 'users.id')
      .where('chat_messages.project_id', projectId);

    if (stackId) {
      query.where('chat_messages.stack_id', stackId);
    }

    return await query
      .select(
        'chat_messages.*',
        'users.username',
        'users.first_name',
        'users.last_name'
      )
      .orderBy('chat_messages.created_at', 'asc');
  }

  async createMessage(projectId, stackId, userId, message, messageType = 'user') {
    const [result] = await this.db(this.tableName)
      .insert({
        project_id: projectId,
        stack_id: stackId,
        user_id: userId,
        message,
        message_type: messageType
      })
      .returning('*');
    return result;
  }

  async createSystemMessage(projectId, stackId, message) {
    return await this.createMessage(projectId, stackId, null, message, 'system');
  }
}

module.exports = ChatMessageRepository;
