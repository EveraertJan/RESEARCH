const express = require('express');
const router = express.Router();

const { checkBodyFields } = require("./../helpers/bodyHelpers");
const { decodeToken } = require("./../helpers/authHelpers");
const { authenticateToken } = require("./../helpers/authMiddleware");
const config = require('./../db/knexfile').development;
const pg = require('knex')(config)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, first_name, last_name, username, password } = req.body;
    
    if (!checkBodyFields(req.body, ['email', 'first_name', 'last_name', 'username', 'password'])) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await pg('users')
      .where('email', email)
      .orWhere('username', username)
      .first();
    
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email or username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const [user] = await pg('users')
      .insert({
        email,
        first_name,
        last_name,
        username,
        password_hash
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'username']);

    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!checkBodyFields(req.body, ['email', 'password'])) {
      return res.status(400).json({ message: 'Missing email/username or password' });
    }

    // Find user by email or username
    const user = await pg('users')
      .where('email', email)
      .orWhere('username', email)
      .first();
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        username: user.username 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await pg('users')
      .where('id', req.user.id)
      .first()
      .select('id', 'email', 'first_name', 'last_name', 'username', 'created_at', 'updated_at');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, username, email } = req.body;
    const updateData = {};

    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (username) {
      // Check if username is already taken by another user
      const existingUser = await pg('users')
        .where('username', username)
        .whereNot('id', req.user.id)
        .first();
      
      if (existingUser) {
        return res.status(409).json({ message: 'Username already taken' });
      }
      updateData.username = username;
    }
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await pg('users')
        .where('email', email)
        .whereNot('id', req.user.id)
        .first();
      
      if (existingUser) {
        return res.status(409).json({ message: 'Email already taken' });
      }
      updateData.email = email;
    }

    updateData.updated_at = new Date();

    const [updatedUser] = await pg('users')
      .where('id', req.user.id)
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'username', 'updated_at']);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!checkBodyFields(req.body, ['current_password', 'new_password'])) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Get current user with password
    const user = await pg('users')
      .where('id', req.user.id)
      .first();

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await pg('users')
      .where('id', req.user.id)
      .update({
        password_hash,
        updated_at: new Date()
      });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// use the routes folder per route

module.exports = router;

