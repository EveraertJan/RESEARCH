const { getDatabase } = require('../config/database');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = getDatabase();
  }

  async findAll(conditions = {}) {
    return await this.db(this.tableName).where(conditions);
  }

  async findById(id) {
    // UUIDs are strings, so we can use them directly
    return await this.db(this.tableName).where({ id }).first();
  }

  async findOne(conditions) {
    return await this.db(this.tableName).where(conditions).first();
  }

  async create(data) {
    const [result] = await this.db(this.tableName).insert(data).returning('*');
    return result;
  }

  async update(id, data) {
    const [result] = await this.db(this.tableName)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return result;
  }

  async delete(id) {
    return await this.db(this.tableName).where({ id }).del();
  }

  async exists(conditions) {
    const result = await this.db(this.tableName).where(conditions).first();
    return !!result;
  }

  // Helper method to validate UUID format
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = BaseRepository;
