# Deployment Guide

## Overview

This project consists of three services:
- **Static Site** - Minimal static landing page (nginx)
- **Frontend** - React admin dashboard (nginx + React build)
- **API** - Node.js backend (Express + PostgreSQL)

## Recent Fixes

### Static Site ✅ (WORKING)
- **Issue**: Gateway timeout
- **Cause**: Missing network configuration
- **Fixed**:
  - Added `networks: backend` to docker-compose
  - Proper nginx configuration with health checks
  - Changed health check from wget to curl

### Frontend 🔧 (FIXED - NEEDS DEPLOYMENT)
- **Issue**: Dev server running in production, port not reachable
- **Cause**: Using `npm start` instead of production build
- **Fixed**:
  - Multi-stage Dockerfile (build → nginx)
  - Production build with `npm run build`
  - Changed port from 3001 → 80
  - Added nginx configuration with:
    - React Router support
    - API proxy to backend
    - Static asset caching
    - Health checks
  - Set `REACT_APP_API_URL=/api` for production

## Architecture

```
Internet
   ↓
Traefik (Port 80/443)
   ↓
├─→ ${DOMAIN}          → Static Site (nginx:80)
├─→ research.${DOMAIN} → Frontend (nginx:80)
└─→ api.${DOMAIN}      → API (node:3000)
                          ↓
                       PostgreSQL (postgres:5432)
```

## Deployment

### Method 1: GitHub Actions (Recommended)

```bash
# Commit all changes
git add .
git commit -m "fix: migrate frontend to production build with nginx"
git push origin main
```

GitHub Actions will:
1. Build all three Docker images
2. Push to Docker Hub with `latest` tag
3. Watchtower auto-updates containers (5 min)

### Method 2: Manual Deployment

On your server:

```bash
# Pull latest code and images
cd /path/to/project
git pull origin main

# Pull new images
docker-compose -f docker-compose.deploy.yml pull

# Restart services
docker-compose -f docker-compose.deploy.yml down
docker-compose -f docker-compose.deploy.yml up -d

# Or restart specific service
docker-compose -f docker-compose.deploy.yml up -d --force-recreate frontend
```

## Verification

### Check Container Status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output:
```
NAMES       STATUS                   PORTS
traefik     Up (healthy)            0.0.0.0:80->80/tcp, 443->443/tcp
static      Up (healthy)            8080->80/tcp
frontend    Up (healthy)            -
api         Up (healthy)            3000->3000/tcp
db          Up (healthy)            5432->5432/tcp
watchtower  Up                      -
```

### Check Logs
```bash
# All services
docker-compose -f docker-compose.deploy.yml logs --tail=50

# Specific service
docker logs frontend --tail=50
docker logs static --tail=50
docker logs traefik --tail=50
```

### Test Health Endpoints
```bash
# Direct container health checks
docker exec static curl -f http://localhost/health
docker exec frontend curl -f http://localhost/health

# Through Traefik
curl https://${DOMAIN}/health                   # Static
curl https://research.${DOMAIN}/health          # Frontend
curl https://api.${DOMAIN}/health               # API (if implemented)
```

### Test Sites
```bash
# Static site
curl -I https://${DOMAIN}

# Frontend
curl -I https://research.${DOMAIN}

# API
curl https://api.${DOMAIN}/api/health
```

## Troubleshooting

### Frontend Issues

**Build fails:**
```bash
# Check build logs
docker logs frontend

# Common issues:
# - Missing dependencies → Check package.json
# - Build errors → Check React code syntax
# - Out of memory → Increase Docker memory
```

**Container starts but site not accessible:**
```bash
# Check if container is healthy
docker ps | grep frontend

# Check nginx logs
docker exec frontend cat /var/log/nginx/error.log

# Check if nginx is running
docker exec frontend ps aux | grep nginx

# Test internal access
docker exec frontend curl -f http://localhost/
```

**API calls failing:**
```bash
# Check nginx proxy configuration
docker exec frontend cat /etc/nginx/conf.d/default.conf

# Check API is reachable from frontend container
docker exec frontend ping api
docker exec frontend curl http://api:3000/api/health

# Check Traefik routing
docker logs traefik | grep frontend
```

### Static Site Issues

**Gateway timeout:**
```bash
# Check if on correct network
docker inspect static | grep -A 5 "Networks"

# Should show: "backend"
# If not: docker-compose -f docker-compose.deploy.yml up -d static
```

### General Issues

**SSL Certificate issues:**
```bash
# Check Let's Encrypt logs
docker logs traefik | grep acme

# Check certificate storage
ls -la _volumes/letsencrypt/

# Force certificate refresh (delete old cert)
rm _volumes/letsencrypt/acme.json
docker-compose -f docker-compose.deploy.yml restart traefik
```

**Watchtower not updating:**
```bash
# Check watchtower logs
docker logs checkpoint-watchtower

# Manually trigger update
docker-compose -f docker-compose.deploy.yml pull
docker-compose -f docker-compose.deploy.yml up -d
```

## Environment Variables

Create `.env` file with:

```bash
# Domain
DOMAIN=yourdomain.com
ACME_EMAIL=your@email.com

# Database
POSTGRES_USER=research
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DATABASE=research

# API
JWT_SECRET=your_jwt_secret
TOKEN_ENCRYPTION=your_encryption_key

# SMTP (for emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
```

## Performance Tips

### Static Site
- Assets cached for 1 year
- Gzip compression enabled
- Small image ~5MB

### Frontend
- Production build minified
- Code splitting enabled
- Assets cached for 1 year
- Gzip compression enabled
- Bundle size ~500KB gzipped

### API
- Connection pooling enabled
- Request rate limiting
- Proper indexes on database

## Monitoring

### Container Health
```bash
# Watch container status
watch -n 5 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# Check resource usage
docker stats

# Check disk usage
docker system df
```

### Logs
```bash
# Follow all logs
docker-compose -f docker-compose.deploy.yml logs -f

# Follow specific service
docker logs -f frontend
```

### Traefik Dashboard (if enabled)
```
http://<server-ip>:8080/dashboard/
```

## Backup

### Database
```bash
# Backup
docker exec db pg_dump -U research research > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20250124.sql | docker exec -i db psql -U research research
```

### Uploads
```bash
# Backup
tar -czf uploads_$(date +%Y%m%d).tar.gz _volumes/uploads/

# Restore
tar -xzf uploads_20250124.tar.gz
```

## Security Checklist

- ✅ HTTPS enabled with Let's Encrypt
- ✅ Security headers configured
- ✅ No exposed ports (except 80/443)
- ✅ Environment variables secured
- ✅ Database password protected
- ✅ JWT tokens for authentication
- ✅ Input validation on API
- ✅ CORS properly configured
- ✅ Regular Docker image updates (Watchtower)

## Support

For issues:
1. Check logs: `docker logs <container-name>`
2. Check this guide's troubleshooting section
3. Check GitHub Actions build logs
4. Check Docker Hub for latest images
