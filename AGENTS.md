# AGENTS.md

## Build/Lint/Test Commands

### API (Node.js/Express)
- `npm start` - Start development server with nodemon and auto-migrate
- `npm run prod` - Start production server
- `npm run migrate` - Run database migrations
- `npm run test-watch` - Run tests in watch mode
- `npm run test-ci` - Run tests for CI (single run)
- Single test: `npx jest path/to/test.test.js`

### Frontend (React)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- Single test: `npx react-scripts test --testPathPattern=path/to/test.js`

## Code Style Guidelines

### General
- Follow Node.js/Express standards for API, React patterns for frontend
- Use ES6+ imports/exports consistently
- API: CommonJS require/module.exports, Frontend: ES6 import/export
- Error handling with try-catch blocks and proper HTTP status codes
- Input validation using Joi or similar libraries
- Use environment variables for configuration

### Project Structure
- API: src/, src/db/, src/helpers/, src/routes/
- Frontend: src/, public/
- Database migrations in src/db/migrations/

### Testing
- API: Jest with Supertest for integration tests
- Frontend: React Testing Library
- Test timeout: 20s for API tests