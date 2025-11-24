const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../helpers/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkRequiredFields } = require('../middleware/validation');
const { successResponse, createdResponse } = require('../utils/responseFormatter');
const UserService = require('../services/UserService');

const userService = new UserService();

router.post('/register',
  checkRequiredFields(['email', 'first_name', 'last_name', 'username', 'password']),
  asyncHandler(async (req, res) => {
    const user = await userService.register(req.body);
    createdResponse(res, { user }, 'User created successfully');
  })
);

router.post('/login',
  checkRequiredFields(['email', 'password']),
  asyncHandler(async (req, res) => {
    const result = await userService.login(req.body);
    successResponse(res, result, 200, 'Login successful');
  })
);

router.get('/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.user.id);
    successResponse(res, user);
  })
);

router.put('/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await userService.updateProfile(req.user.id, req.body);
    successResponse(res, { user }, 200, 'Profile updated successfully');
  })
);

router.put('/password',
  authenticateToken,
  checkRequiredFields(['current_password', 'new_password']),
  asyncHandler(async (req, res) => {
    const result = await userService.changePassword(req.user.id, req.body);
    successResponse(res, null, 200, result.message);
  })
);

module.exports = router;
