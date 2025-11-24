const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const { AppError } = require('../middleware/errorHandler');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
    this.saltRounds = 10;
    this.jwtSecret = process.env.JWT_SECRET;

    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable must be defined');
    }
  }

  async register(userData) {
    const { email, first_name, last_name, username, password } = userData;

    const existingUser = await this.userRepository.findByEmailOrUsername(email);
    const existingUsername = await this.userRepository.findByUsername(username);

    if (existingUser || existingUsername) {
      throw new AppError('User with this email or username already exists', 409);
    }

    const password_hash = await bcrypt.hash(password, this.saltRounds);

    const user = await this.userRepository.createUser({
      email,
      first_name,
      last_name,
      username,
      password_hash
    });

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username
    };
  }

  async login(credentials) {
    const { email, password } = credentials;

    const user = await this.userRepository.findByEmailOrUsername(email);

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username
      }
    };
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  async updateProfile(userId, updateData) {
    const { first_name, last_name, username, email } = updateData;
    const fieldsToUpdate = {};

    if (first_name) fieldsToUpdate.first_name = first_name;
    if (last_name) fieldsToUpdate.last_name = last_name;

    if (username) {
      const existingUser = await this.userRepository.checkUsernameExists(username, userId);
      if (existingUser) {
        throw new AppError('Username already taken', 409);
      }
      fieldsToUpdate.username = username;
    }

    if (email) {
      const existingUser = await this.userRepository.checkEmailExists(email, userId);
      if (existingUser) {
        throw new AppError('Email already taken', 409);
      }
      fieldsToUpdate.email = email;
    }

    const updatedUser = await this.userRepository.update(userId, fieldsToUpdate);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      username: updatedUser.username,
      updated_at: updatedUser.updated_at
    };
  }

  async changePassword(userId, passwordData) {
    const { current_password, new_password } = passwordData;

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    const password_hash = await bcrypt.hash(new_password, this.saltRounds);
    await this.userRepository.updatePassword(userId, password_hash);

    return { message: 'Password updated successfully' };
  }
}

module.exports = UserService;
