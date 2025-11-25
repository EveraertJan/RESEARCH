# Local Development Setup

## Quick Start

### Option 1: Docker Compose (Recommended)

Start all services with hot reload:

```bash
# Start everything
docker-compose -f docker-compose.dev.yml up

# Or start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop everything
docker-compose -f docker-compose.dev.yml down
```

Services will be available at:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3000
- **Static**: http://localhost:8080
- **Database**: localhost:5433

### Option 2: Individual Services

#### Frontend Only
```bash
cd images/frontend
npm install
npm start
# Runs on http://localhost:3001
```

#### API Only
```bash
cd images/api
npm install
npm run dev
# Runs on http://localhost:3000
```

## Environment Variables

Create `.env` file in project root:

```bash
# Database
POSTGRES_USER=research
POSTGRES_PASSWORD=dev_password
POSTGRES_DATABASE=research

# API
JWT_SECRET=dev_jwt_secret_change_in_production
TOKEN_ENCRYPTION=dev_encryption_key_change_in_production

# SMTP (optional for development)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

## Hot Reload

### Frontend
- Changes to `/src` files auto-reload
- Changes to `/public` files require manual refresh
- Changes to `package.json` require rebuild

### API
- Changes to any `.js` file auto-reload (using nodemon)
- Changes to environment variables require restart

### Static
- Changes to HTML/CSS reflected immediately (volume mounted)

## Development Features

### Frontend (Dockerfile.dev)
- ✅ Hot module replacement (HMR)
- ✅ Source maps for debugging
- ✅ React DevTools compatible
- ✅ Detailed error messages
- ✅ Fast refresh on save

### API
- ✅ Nodemon auto-restart
- ✅ Detailed error logging
- ✅ Database migrations on start
- ✅ CORS enabled for localhost

## Common Tasks

### Reset Database
```bash
# Stop and remove database
docker-compose -f docker-compose.dev.yml down -v

# Start fresh
docker-compose -f docker-compose.dev.yml up db-dev -d

# Run migrations
docker exec api-dev npm run migrate
```

### Install New Package

**Frontend:**
```bash
# Method 1: Inside container
docker exec frontend-dev npm install package-name

# Method 2: Locally (faster)
cd images/frontend
npm install package-name
docker-compose -f docker-compose.dev.yml restart frontend-dev
```

**API:**
```bash
# Method 1: Inside container
docker exec api-dev npm install package-name

# Method 2: Locally
cd images/api
npm install package-name
docker-compose -f docker-compose.dev.yml restart api-dev
```

### Database Access

**Direct Connection:**
```bash
docker exec -it db-dev psql -U research -d research
```

**Using GUI Client:**
- Host: `localhost`
- Port: `5433`
- Database: `research`
- Username: `research`
- Password: (from .env)

### View Container Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f frontend-dev
docker-compose -f docker-compose.dev.yml logs -f api-dev

# Last 50 lines
docker logs frontend-dev --tail 50
```

### Rebuild After Changes

```bash
# Rebuild specific service
docker-compose -f docker-compose.dev.yml up -d --build frontend-dev

# Rebuild all
docker-compose -f docker-compose.dev.yml up -d --build

# Force recreate
docker-compose -f docker-compose.dev.yml up -d --force-recreate
```

## Debugging

### Frontend Debugging

**Chrome DevTools:**
1. Open http://localhost:3001
2. Open Chrome DevTools (F12)
3. Source maps enabled automatically

**VS Code Debugging:**
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Chrome Debug",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3001",
      "webRoot": "${workspaceFolder}/images/frontend/src"
    }
  ]
}
```

### API Debugging

**VS Code Debugging:**
Add to `.vscode/launch.json`:
```json
{
  "name": "Docker: Attach to Node",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/images/api",
  "remoteRoot": "/usr/app",
  "protocol": "inspector"
}
```

Then modify `docker-compose.dev.yml`:
```yaml
api-dev:
  command: node --inspect=0.0.0.0:9229 server.js
  ports:
    - "3000:3000"
    - "9229:9229"  # Debug port
```

## Performance Tips

### Mac/Windows (Docker Desktop)
```yaml
# Use :delegated or :cached for volumes
volumes:
  - ./images/frontend/src:/app/src:delegated
```

### Linux
```yaml
# No special flags needed
volumes:
  - ./images/frontend/src:/app/src
```

### Speed Up npm install
```bash
# Use npm ci instead of npm install
RUN npm ci

# Or cache node_modules
COPY package*.json ./
RUN npm install
COPY . .
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>

# Or change port in docker-compose.dev.yml
ports:
  - "3002:3001"  # Use 3002 instead
```

### Hot Reload Not Working

**Frontend:**
```bash
# Set polling environment variables
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
```

**API:**
```bash
# Check nodemon is installed
docker exec api-dev npm list nodemon

# Restart with legacy watch
docker exec api-dev npm run dev -- --legacy-watch
```

### Permission Issues (Linux)
```bash
# Run as current user
docker-compose -f docker-compose.dev.yml run --user $(id -u):$(id -g) frontend-dev npm install
```

### Database Connection Issues
```bash
# Check database is healthy
docker ps | grep db-dev

# Check logs
docker logs db-dev

# Test connection
docker exec api-dev psql -h db-dev -U research -d research -c "SELECT 1"
```

### Clean Start
```bash
# Remove everything and start fresh
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

## Testing

### Frontend Tests
```bash
# Run tests
docker exec frontend-dev npm test

# Run tests with coverage
docker exec frontend-dev npm test -- --coverage

# Run specific test
docker exec frontend-dev npm test -- MyComponent.test.js
```

### API Tests
```bash
# Run all tests
docker exec api-dev npm test

# Run with watch
docker exec api-dev npm test -- --watch
```

## Production Build Test

Test production build locally:

```bash
# Build production images
docker build -t test-frontend -f images/frontend/Dockerfile images/frontend
docker build -t test-static -f images/static/Dockerfile images/static

# Run production images
docker run -p 8081:80 test-frontend
docker run -p 8082:80 test-static

# Test
open http://localhost:8081
open http://localhost:8082
```

## CI/CD Integration

Test GitHub Actions locally:

```bash
# Install act (https://github.com/nektos/act)
brew install act  # Mac
choco install act-cli  # Windows

# Run workflow locally
act -j build-and-push --secret-file .secrets
```

## Resources

- React Docs: https://react.dev
- Node.js Docs: https://nodejs.org
- Docker Compose Docs: https://docs.docker.com/compose
- PostgreSQL Docs: https://www.postgresql.org/docs
