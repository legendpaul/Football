# Football Tracker - Live Data Deployment Guide 🚀

## Quick Start

```bash
# 1. Setup the project
node launcher.js setup

# 2. Start the live data version
node launcher.js live

# 3. Open http://localhost:8000/index-live.html
```

## 📋 Deployment Options

### Option 1: Netlify (Recommended for Live Data)

#### Prerequisites
- Netlify account
- Neon PostgreSQL database (optional)
- GitHub repository

#### Step 1: Environment Setup
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Copy environment variables
cp .env.example .env
# Edit .env with your values
```

#### Step 2: Configure Environment Variables
Update `.env` with:
```env
# Required for live data
LIVE_DATA_ENABLED=true
AUTO_REFRESH_ENABLED=true
LIVE_REFRESH_INTERVAL=30000

# Optional: Database integration
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require

# Optional: Custom CORS proxy
CUSTOM_CORS_PROXY=https://your-proxy.com/

# Optional: API keys for enhanced data
FOOTBALL_DATA_API_KEY=your_api_key_here
```

#### Step 3: Deploy to Netlify
```bash
# Initialize Netlify site
netlify init

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
# Site settings > Environment variables
```

#### Step 4: Configure Netlify Functions (Optional)
If using database integration:
```bash
# Functions are in netlify/functions/
# They'll be automatically deployed with your site
```

### Option 2: Static Hosting (GitHub Pages, Vercel, etc.)

#### For GitHub Pages:
```bash
# 1. Push to GitHub repository
git add .
git commit -m "Add live data integration"
git push origin main

# 2. Enable GitHub Pages in repository settings
# Source: Deploy from a branch
# Branch: main / root

# 3. Access at: https://username.github.io/repository-name/index-live.html
```

#### For Vercel:
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Follow prompts to configure
```

### Option 3: Self-Hosted (VPS/Dedicated Server)

#### Using Node.js
```bash
# 1. Clone repository on server
git clone https://github.com/yourusername/football-tracker.git
cd football-tracker

# 2. Install dependencies
npm install
pip install -r requirements.txt

# 3. Start with PM2
npm install -g pm2
pm2 start launcher.js --name football-tracker -- live

# 4. Configure reverse proxy (nginx/apache)
```

#### Using Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm install
RUN pip install -r requirements.txt

EXPOSE 8000

CMD ["node", "launcher.js", "live"]
```

```bash
# Build and run
docker build -t football-tracker .
docker run -p 8000:8000 football-tracker
```

## ⚙️ Configuration for Production

### 1. Performance Optimization

#### Enable Compression
```javascript
// In your server configuration
app.use(compression());
```

#### Configure Caching
```nginx
# nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(json)$ {
    expires 30s;
    add_header Cache-Control "public, max-age=30";
}
```

### 2. Live Data Configuration

#### Adjust Refresh Intervals
```javascript
// In live-data-config.js
const LIVE_DATA_CONFIG = {
  refresh: {
    interval: 30000,        // 30 seconds for production
    retryAttempts: 3,
    timeout: 10000
  }
};
```

#### Configure CORS Proxies
```javascript
// Add your own CORS proxy for reliability
corsProxies: [
  'https://your-cors-proxy.herokuapp.com/',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url='
]
```

### 3. Monitoring and Logging

#### Setup Error Tracking
```javascript
// Add to your deployment
// Sentry.io integration
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

#### Monitor Data Sources
```bash
# Run continuous monitoring
node scripts/monitor-sources.js continuous 5

# Generate daily reports
node scripts/monitor-sources.js report
```

## 🔧 Production Checklist

### Pre-Deployment
- [ ] Run tests: `node launcher.js test`
- [ ] Check dependencies: `node launcher.js status`
- [ ] Verify environment variables
- [ ] Test live data functionality locally
- [ ] Optimize images and assets
- [ ] Configure SSL/HTTPS

### Post-Deployment
- [ ] Verify live data auto-refresh works
- [ ] Test CORS proxy functionality
- [ ] Check mobile responsiveness
- [ ] Monitor error rates
- [ ] Setup uptime monitoring
- [ ] Configure backup strategy

## 🛡️ Security Considerations

### 1. Environment Variables
Never commit sensitive data to version control:
```bash
# .gitignore
.env
.env.local
.env.production
```

### 2. CORS Proxy Security
- Use reputable CORS proxies
- Consider setting up your own proxy
- Monitor proxy usage for rate limits

### 3. Database Security
```sql
-- Create read-only user for frontend
CREATE USER football_readonly WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO football_readonly;
```

## 📊 Monitoring and Analytics

### 1. Data Source Health
```bash
# Setup automated monitoring
crontab -e

# Add line for hourly health checks
0 * * * * cd /path/to/football-tracker && node scripts/monitor-sources.js run
```

### 2. Performance Monitoring
```javascript
// Add performance tracking
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log('Performance:', entry.name, entry.duration);
  });
});
observer.observe({entryTypes: ['measure']});
```

### 3. User Analytics
```html
<!-- Google Analytics (optional) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## 🚨 Troubleshooting

### Common Issues

#### 1. CORS Errors
```
Access to fetch at 'https://www.uefa.com/...' from origin 'https://yoursite.com' 
has been blocked by CORS policy
```

**Solution:**
- Ensure CORS proxies are working
- Check proxy rate limits
- Add backup proxies

#### 2. Data Not Updating
```
Data seems stale or not refreshing
```

**Solution:**
```bash
# Check scraper health
node scripts/test-live-data.js scraper

# Monitor data sources
node scripts/monitor-sources.js run

# Check browser console for errors
```

#### 3. Slow Performance
```
Page loads slowly or feels sluggish
```

**Solution:**
- Reduce refresh interval
- Optimize images
- Enable compression
- Use CDN for assets

#### 4. Database Connection Issues
```
Failed to connect to database
```

**Solution:**
```bash
# Test database connection
node scripts/utils.js db health

# Check environment variables
echo $DATABASE_URL

# Verify SSL settings
```

### Debug Mode
Enable debug mode for detailed logging:
```javascript
// In live-data-config.js
development: {
  verboseLogging: true,
  showSourceInfo: true,
  simulateSlowNetwork: false
}
```

## 📈 Scaling for High Traffic

### 1. CDN Configuration
```javascript
// Use CDN for static assets
const CDN_URL = 'https://cdn.jsdelivr.net/gh/yourusername/football-tracker@main/';
```

### 2. Load Balancing
```nginx
# nginx load balancer
upstream football_backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    location / {
        proxy_pass http://football_backend;
    }
}
```

### 3. Caching Strategy
```javascript
// Implement intelligent caching
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

## 🔄 Maintenance

### Regular Tasks
```bash
# Weekly: Update data sources
node scripts/monitor-sources.js run

# Daily: Check logs
tail -f football_scraper.log

# Monthly: Update dependencies
npm update
pip install -r requirements.txt --upgrade
```

### Backup Strategy
```bash
# Backup configuration
cp .env .env.backup.$(date +%Y%m%d)

# Backup database (if using)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## 🎯 Performance Targets

### Response Times
- Initial page load: < 2 seconds
- Data refresh: < 5 seconds
- User interactions: < 100ms

### Availability
- Uptime target: 99.9%
- Data freshness: < 60 seconds
- Error rate: < 1%

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers

---

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run the test suite: `node launcher.js test`
3. Review logs: `tail -f football_scraper.log`
4. Open an issue with detailed error information

**Happy deploying! ⚽🚀**
