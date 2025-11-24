# TASTBAAR Static Site

Clean, minimal static website using are.na-inspired design principles.

## Tech Stack

- HTML5
- CSS3 (single consolidated stylesheet)
- Nginx (Alpine Linux)
- Docker

## Local Development

Simply open `src/index.html` in your browser, or serve with any static server:

```bash
# Using Python
cd src
python -m http.server 8080

# Using Node.js
npx serve src

# Using PHP
php -S localhost:8080 -t src
```

## Build & Deploy

### Docker Build (Local)

```bash
docker build -t tastbaar/research-static:latest .
docker run -p 8080:80 tastbaar/research-static:latest
```

Visit: http://localhost:8080

### GitHub Actions (Automated)

The site automatically builds and deploys on push to `main`:

1. **GitHub Actions** builds the Docker image
2. Pushes to Docker Hub: `tastbaar/research-static:latest`
3. **Watchtower** on the server auto-updates the container

### Manual Deployment

```bash
# On the server
cd /path/to/project
docker-compose -f docker-compose.deploy.yml pull static
docker-compose -f docker-compose.deploy.yml up -d static
```

## Project Structure

```
src/
├── index.html          # Main HTML file
├── main.css            # Consolidated stylesheet (~300 lines)
├── public/             # Static assets
│   ├── custom/         # Project images
│   └── *.svg          # Icons
└── locales/
    └── en.json         # Translations (if needed)
```

## Design System

### Colors
- Primary: `#000` (Black)
- Secondary: `#fff` (White)
- Accent: `#C2FE0B` (Neon Green)
- Hover: `#f5f5f5` (Light Gray)

### Typography
- Base: Lato (14px)
- Headings: Noto Sans (32px - 96px)
- Small: 12px

### Components
- `.button` - Primary buttons
- `.grid` - Grid layouts with black borders
- `.section` - Content sections
- `.hero` - Hero sections with background images
- `.accordion-item` - Industry cards

## Nginx Configuration

Custom nginx config includes:
- Gzip compression
- Cache headers for assets (1 year)
- Security headers
- Health check endpoint (`/health`)
- HTML5 routing support

## Environment Variables

Set in `docker-compose.deploy.yml`:
- `DOMAIN` - Your domain name
- `ACME_EMAIL` - Email for Let's Encrypt SSL

## SSL/HTTPS

Automatic SSL via Traefik + Let's Encrypt:
- HTTP → HTTPS redirect (after initial setup)
- Auto-renewal of certificates
- Served on `${DOMAIN}`

## Monitoring

Health check available at: `http://localhost/health`

Docker health status:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```
