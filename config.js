// Football API Configuration
// Get your credentials from various football data providers

const config = {
  football: {
    // Primary Football API provider (football-api.com or similar)
    primary: {
      apiKey: process.env.FOOTBALL_API_KEY || 'YOUR_FOOTBALL_API_KEY',
      baseUrl: 'https://api.football-api.com/v3',
      rateLimitPerMinute: 100
    },
    
    // Secondary API provider (sportsdata.io or similar)
    secondary: {
      apiKey: process.env.SPORTSDATA_API_KEY || 'YOUR_SPORTSDATA_API_KEY',
      baseUrl: 'https://api.sportsdata.io/v3/soccer',
      rateLimitPerMinute: 1000
    },
    
    // Free tier API (api-football.com)
    free: {
      apiKey: process.env.APIFOOTBALL_KEY || 'YOUR_APIFOOTBALL_KEY',
      baseUrl: 'https://v3.football.api-sports.io',
      rateLimitPerDay: 100
    },
    
    // Current provider - change as needed
    currentProvider: process.env.FOOTBALL_PROVIDER || 'primary',
    
    // Default settings
    defaultSettings: {
      timezone: 'UTC',
      maxResultsPerPage: 50,
      cacheTimeMinutes: 30, // Cache API results for 30 minutes
      enableLiveScores: true,
      updateInterval: 60, // Update live scores every 60 seconds
      preferredLanguage: 'en'
    },
    
    // Tournaments to track by default
    defaultTournaments: [
      { name: 'FIFA Club World Cup', year: 2025, priority: 'high' },
      { name: 'UEFA Euro U21', year: 2025, priority: 'high' },
      { name: 'Premier League', year: 2025, priority: 'medium' },
      { name: 'UEFA Champions League', year: 2025, priority: 'high' },
      { name: 'La Liga', year: 2025, priority: 'medium' },
      { name: 'Bundesliga', year: 2025, priority: 'medium' },
      { name: 'Serie A', year: 2025, priority: 'low' },
      { name: 'Ligue 1', year: 2025, priority: 'low' }
    ]
  },
  
  // Database configuration
  database: {
    connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production',
    maxConnections: 20,
    idleTimeoutMs: 30000,
    connectionTimeoutMs: 2000
  },
  
  // Application settings
  app: {
    name: 'Football Tracker',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    
    // Feature flags
    features: {
      liveScores: true,
      playerStats: false, // Enable when player data is implemented
      matchPredictions: false, // Future feature
      pushNotifications: false, // Future feature
      socialSharing: true
    },
    
    // UI Configuration
    ui: {
      theme: 'dark', // 'light' or 'dark'
      defaultView: 'fixtures', // 'fixtures', 'results', 'tournaments'
      autoRefresh: true,
      refreshIntervalSeconds: 300, // 5 minutes
      showFlags: true,
      showLogos: true,
      timeFormat: '24h' // '12h' or '24h'
    }
  }
};

// Helper to get current football API config
config.getCurrentFootballConfig = function() {
  return this.football[this.football.currentProvider];
};

// Check if football API is configured
config.isFootballConfigured = function() {
  const current = this.getCurrentFootballConfig();
  return current.apiKey !== 'YOUR_FOOTBALL_API_KEY' && 
         current.apiKey !== 'YOUR_SPORTSDATA_API_KEY' &&
         current.apiKey !== 'YOUR_APIFOOTBALL_KEY';
};

// Check if database is configured
config.isDatabaseConfigured = function() {
  return this.database.connectionString && 
         this.database.connectionString !== 'YOUR_DATABASE_URL';
};

// Get API headers for current provider
config.getApiHeaders = function() {
  const current = this.getCurrentFootballConfig();
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': `${this.app.name}/${this.app.version}`
  };
  
  // Different APIs use different header formats
  switch (this.football.currentProvider) {
    case 'primary':
      headers['X-API-KEY'] = current.apiKey;
      break;
    case 'secondary':
      headers['Ocp-Apim-Subscription-Key'] = current.apiKey;
      break;
    case 'free':
      headers['X-RapidAPI-Key'] = current.apiKey;
      headers['X-RapidAPI-Host'] = 'v3.football.api-sports.io';
      break;
    default:
      headers['Authorization'] = `Bearer ${current.apiKey}`;
  }
  
  return headers;
};

// Get tournament configuration
config.getTournamentConfig = function(tournamentName) {
  return this.football.defaultTournaments.find(t => 
    t.name.toLowerCase().includes(tournamentName.toLowerCase())
  );
};

// Validation helper
config.validate = function() {
  const errors = [];
  
  if (!this.isFootballConfigured()) {
    errors.push('Football API credentials not configured');
  }
  
  if (!this.isDatabaseConfigured()) {
    errors.push('Database connection not configured');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = config;
