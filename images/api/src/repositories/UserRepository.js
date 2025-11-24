const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async findByUsername(username) {
    return await this.findOne({ username });
  }

  async findByEmailOrUsername(identifier) {
    return await this.db(this.tableName)
      .where('email', identifier)
      .orWhere('username', identifier)
      .first();
  }

  async checkEmailExists(email, excludeId = null) {
    const query = this.db(this.tableName).where('email', email);
    if (excludeId) {
      query.whereNot('id', excludeId);
    }
    return await query.first();
  }

  async checkUsernameExists(username, excludeId = null) {
    const query = this.db(this.tableName).where('username', username);
    if (excludeId) {
      query.whereNot('id', excludeId);
    }
    return await query.first();
  }

  async createUser(userData) {
    const [user] = await this.db(this.tableName)
      .insert(userData)
      .returning(['id', 'email', 'first_name', 'last_name', 'username', 'created_at']);
    return user;
  }

  async updatePassword(userId, passwordHash) {
    return await this.db(this.tableName)
      .where('id', userId)
      .update({
        password_hash: passwordHash,
        updated_at: new Date()
      });
  }
}

module.exports = UserRepository;
