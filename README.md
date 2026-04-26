# ⚽ Football Tracker with Neon Database Integration

A sophisticated web application that tracks football matches, fixtures, and results from major tournaments and leagues worldwide, featuring real-time data, team management, and persistent storage with Neon PostgreSQL database.

## 🌟 Features

### Core Functionality
- **Real Football API Integration** - Live match data from multiple football data providers
- **Multi-Tournament Support** - Premier League, Champions League, World Cup, and more
- **Smart View Switching** - Fixtures, Results, and Live Matches
- **Favorite Teams Management** - Track your favorite teams across all tournaments
- **Live Score Updates** - Real-time score updates and match status
- **Tournament Filtering** - Focus on specific competitions and leagues

### Technical Features
- **Dual Storage System** - localStorage for local development, Neon DB for production
- **Serverless Architecture** - Netlify Functions for backend operations
- **Memory Management** - Optimized for performance and resource usage
- **Debug Dashboard** - Real-time API and database monitoring
- **Responsive Design** - Works on desktop and mobile devices
- **Auto-Refresh System** - Automatic updates for live matches

### Data Persistence
- **Favorite Teams** - Persistent team preferences across sessions
- **User Favorites** - Match and tournament favorites with metadata
- **User Preferences** - Automatic saving of all user configurations
- **Cross-Session Sync** - Data persists across browser sessions and devices

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                       │
├─────────────────────────────────────────────────────────────┤
│  • app-web-fixed.js (Smart storage detection)              │
│  • Local Development: localStorage                          │
│  • Production: Neon Database via Netlify Functions         │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Netlify Functions (Serverless)              │
├─────────────────────────────────────────────────────────────┤
│  • football-search.js (Football API integration)           │
│  • teams.js (Team management)                              │
│  • favorites.js (User favorites management)                │
│  • db-health.js (Database monitoring)                      │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
├─────────────────────────────────────────────────────────────┤
│  • Football APIs (Match data)                              │
│  • Neon PostgreSQL (Data persistence)                      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Netlify Account** - For hosting and functions
- **Neon Database** - For production data storage
- **Football API Key** - From any supported provider (see API providers below)

### Local Development
1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Football
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Install dependencies**
   ```bash
   cd netlify/functions
   npm install
   ```

4. **Run locally**
   ```bash
   # Install Netlify CLI if needed
   npm install -g netlify-cli
   
   # Start development server
   netlify dev
   ```

5. **Open in browser**
   ```
   http://localhost:8888
   ```

### Production Deployment
1. **Connect to Netlify** - Link your repository to Netlify
2. **Set Environment Variables** - Add your API keys and database URL
3. **Deploy** - Netlify will automatically build and deploy

## 📁 Project Structure

```
Football/
├── 📄 index.html               # Main HTML file
├── 📄 app-web-fixed.js         # Main application
├── 📄 config-web.js            # Configuration (browser-safe)
├── 📄 styles.css               # Styling
├── 📁 assets/                  # Static assets
│   ├── 🖼️ background.jpg       # Background image
│   └── 🖼️ icon.svg             # App icon
├── 📁 database/                # Database schema and utilities
│   ├── 📄 schema.sql           # PostgreSQL schema
│   ├── 📄 connection.js        # Database connection utility
│   └── 📄 migrate.js           # Database migration utility
├── 📁 netlify/functions/       # Serverless functions
│   ├── 📄 package.json         # Function dependencies
│   ├── 📄 football-search.js   # Football API integration
│   ├── 📄 teams.js             # Team management API
│   ├── 📄 favorites.js         # User favorites API
│   └── 📄 db-health.js         # Database health check
├── 📁 data/                    # Football data files
│   ├── 📄 tournaments.json     # Tournament information
│   └── 📄 *.json               # Match and fixture data
├── 📁 scripts/                 # Utility scripts
│   └── 📄 utils.js             # Development utilities
├── 📄 .env.example             # Environment template
├── 📄 .env                     # Local environment (gitignored)
├── 📄 netlify.toml             # Netlify configuration
└── 📄 README.md                # This file
```

## 🔧 Configuration

### Environment Variables

#### Required for Football API:
```bash
FOOTBALL_PROVIDER=primary
FOOTBALL_API_KEY=your_football_api_key
```

#### Alternative API Providers:
```bash
SPORTSDATA_API_KEY=your_sportsdata_key      # For secondary provider
APIFOOTBALL_KEY=your_apifootball_key        # For free tier provider
```

#### Required for Database (Production):
```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEON_DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

#### Optional:
```bash
NODE_ENV=production
ANALYTICS_ENABLED=true
AUTO_REFRESH_INTERVAL=300
CACHE_DURATION=30
```

### Supported Football API Providers

| Provider | Type | Cost | Daily Limit | Features |
|----------|------|------|-------------|----------|
| **API-Football** | Free/Paid | Free tier | 100 requests | Comprehensive coverage |
| **SportsData.io** | Paid | Subscription | 1000+ requests | Professional features |
| **Football-API.com** | Paid | Subscription | Varies | Live scores, stats |

### Application Settings

The app automatically detects the environment:

| Environment | Storage | Detection Method |
|------------|---------|------------------|
| **Local** | localStorage | `localhost` or `127.0.0.1` hostname |
| **Production** | Neon Database | Any other hostname |

## 🗄️ Database Schema

### Tables

#### `tournaments`
Stores tournament and competition information
```sql
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    location VARCHAR(255),
    type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `teams`
Stores team information
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    league VARCHAR(255),
    logo_url TEXT,
    founded_year INTEGER,
    stadium VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `fixtures`
Stores upcoming match fixtures
```sql
CREATE TABLE fixtures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id),
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(255),
    stage VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `results`
Stores completed match results
```sql
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id),
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(255),
    stage VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `user_favorites`
Stores user favorites (teams and tournaments)
```sql
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### Netlify Functions

#### `/.netlify/functions/football-search`
**GET** - Search football matches
- **Query Parameters:**
  - `tournament` - Tournament name (e.g., 'Premier League')
  - `type` - Data type ('fixtures', 'results', 'live')
  - `season` - Season year (default: 2025)
- **Returns:** Array of football matches

#### `/.netlify/functions/teams`
**GET** - Retrieve teams
**POST** - Add new team
**PUT** - Update team
**DELETE** - Remove team
- **Query Parameters (GET):**
  - `country` - Filter by country
  - `league` - Filter by league

#### `/.netlify/functions/favorites`
**GET** - Retrieve user favorites
**POST** - Add new favorite
**DELETE** - Remove favorite or clear all
- **Query Parameters:**
  - `userId` - User identifier (default: 'default')
  - `type` - Item type ('team', 'tournament')

#### `/.netlify/functions/db-health`
**GET** - Database health check and statistics

## 🎨 User Interface

### Main Sections

1. **Tournament Selection** - Choose competition/league to track
2. **View Toggle** - Switch between Fixtures, Results, and Live Matches
3. **Football Matches** - Live match data with scores and times
4. **Favorite Teams** - Manage your favorite teams across tournaments
5. **Debug Panel** - API requests, responses, and data processing

### Key Features

- **Real-time Updates** - Live scores and match status updates
- **Smart Prioritization** - Favorite team matches shown first
- **Visual Feedback** - Loading states, notifications, and status indicators
- **Responsive Design** - Optimized for desktop and mobile devices
- **Auto-Refresh** - Automatic updates for live matches

## 🔍 Debug and Monitoring

### Debug Panel Features

1. **API Request Tab** - View last Football API request details
2. **API Response Tab** - Inspect Football API response data
3. **Processed Data Tab** - See data processing step-by-step
4. **Console Logs Tab** - Real-time application messages

### Monitoring Capabilities

- **Database Health** - Connection status and performance metrics
- **Memory Usage** - JavaScript heap usage and cleanup statistics
- **API Performance** - Request/response times and success rates
- **Data Processing** - How data is filtered and prioritized

## 🛠️ Development

### Local Development Workflow

1. **Start Development Server**
   ```bash
   netlify dev
   ```

2. **Make Changes** - Edit files and see live updates

3. **Test Database Functions** - Use debug panel to test API calls

4. **Monitor Console** - Check browser console for debug messages

### Development Utilities

```bash
# Run utility scripts
node scripts/utils.js setup      # Setup development environment
node scripts/utils.js health     # Check project health
node scripts/utils.js db migrate # Run database migrations
node scripts/utils.js status     # Show project status
```

### Testing Different Environments

- **Local Storage Mode** - Access via `localhost:8888`
- **Database Mode** - Deploy to staging environment
- **API Testing** - Use debug panel to test Football API integration

## 🚨 Error Handling

### Graceful Degradation

1. **Database Unavailable** - Automatically falls back to localStorage
2. **Football API Failure** - Falls back to simulation data
3. **Network Issues** - Displays appropriate error messages
4. **Memory Constraints** - Automatic cleanup and optimization

### Error Recovery

- **Automatic Retries** - Failed API calls are retried with backoff
- **Fallback Data Sources** - Multiple data sources for resilience
- **User Notifications** - Clear feedback about system status
- **Debug Information** - Detailed error logging for troubleshooting

## 📊 Performance

### Optimization Features

- **Match Pool Management** - Efficient match filtering and prioritization
- **Image Lazy Loading** - Team logos load as they come into view
- **Memory Cleanup** - Automatic cleanup of unused DOM elements
- **Event Listener Management** - Proper cleanup to prevent memory leaks
- **Database Connection Pooling** - Efficient database connection management
- **Auto-Refresh Optimization** - Smart refresh intervals based on view type

### Performance Metrics

- **Initial Load Time** - Optimized for fast first render
- **Memory Usage** - Monitored and managed automatically
- **API Response Times** - Cached and optimized for speed
- **Database Query Performance** - Indexed queries for fast responses

## 🔒 Security

### Data Protection

- **Environment Variables** - Sensitive data stored securely
- **CORS Headers** - Proper cross-origin request handling
- **Input Validation** - All user inputs are validated and sanitized
- **SQL Injection Prevention** - Parameterized queries only

### API Security

- **Server-side Credentials** - API keys never exposed to browser
- **Rate Limiting** - Built-in request throttling
- **Error Message Sanitization** - No sensitive data in error messages

## 🏆 Supported Tournaments

### International Competitions
- FIFA Club World Cup 2025
- UEFA Euro U21 2025
- UEFA Champions League
- UEFA Europa League

### Major Leagues
- Premier League (England)
- La Liga (Spain)
- Bundesliga (Germany)
- Serie A (Italy)
- Ligue 1 (France)

### Features by Tournament
- **Live Scores** - Real-time score updates
- **Fixtures** - Upcoming match schedules
- **Results** - Historical match results
- **Standings** - League tables (where applicable)

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly** (local and database modes)
5. **Submit a pull request**

### Code Standards

- **ES6+ JavaScript** - Modern JavaScript features
- **Async/Await** - Consistent asynchronous code patterns
- **Error Handling** - Comprehensive try/catch blocks
- **Documentation** - Clear comments and documentation
- **Console Logging** - Structured logging with emojis for clarity

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Troubleshooting

1. **Check Debug Panel** - Use the built-in debug tools
2. **Verify Environment Variables** - Ensure all credentials are set
3. **Monitor Function Logs** - Check Netlify function logs
4. **Database Health** - Use the health check endpoint

### Common Issues

- **No API Data** - Check API key configuration and provider limits
- **Database Connection Errors** - Verify Neon database URL and permissions
- **Local Development Issues** - Ensure Netlify CLI is installed and running
- **Missing Live Scores** - Check if API provider supports live data

### Getting Help

- **Documentation** - Check all markdown files in the project
- **Debug Panel** - Use real-time debugging tools in the app
- **Function Logs** - Monitor serverless function execution
- **Console Output** - Check browser console for detailed messages

## 🔗 Links

### API Providers
- **API-Football** - https://api-football.com/
- **SportsData.io** - https://sportsdata.io/
- **RapidAPI Sports** - https://rapidapi.com/collection/sports-apis

### Services
- **Neon Database** - https://neon.tech/
- **Netlify Functions** - https://docs.netlify.com/functions/overview/
- **Netlify Deployment** - https://docs.netlify.com/site-deploys/overview/

### Documentation
- **Football Data APIs** - Various provider documentation
- **PostgreSQL** - https://www.postgresql.org/docs/
- **Modern JavaScript** - https://developer.mozilla.org/en-US/docs/Web/JavaScript

---

**Built with ⚽ for football enthusiasts worldwide**

*Features real football match data, persistent team tracking, and intelligent match management with modern web technologies and Neon PostgreSQL database.*
