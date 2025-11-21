const jwt = require('jsonwebtoken');

const decodeToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if(authHeader) {
    try {
      // Remove "Bearer " prefix if present
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded
      next()
    } catch (err) {
      console.error('Token verification error:', err.message);
      res.status(401).send({ message: 'Invalid token' });
    }
  } else {
    res.status(400).send({ message: 'No token provided' });
  }
};

module.exports = { decodeToken};