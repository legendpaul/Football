// Football API Configuration - Browser Compatible Version (SECURE)
// Browser version - NO API keys exposed!
// Real API keys are stored securely server-side only

const footballConfig = {
  football: {
    // Browser config - NO SENSITIVE DATA
    primary: {
      apiKey: 'SECURE_SERVER_SIDE_ONLY',
      baseUrl: 'https://api.football-api.com/v3',
      rateLimitPerMinute: 100
    },
    
    secondary: {
      apiKey: 'SECURE_SERVER_SIDE_ONLY',
      baseUrl: 'https://api.sportsdata.io/v3/soccer',
      rateLimitPerMinute: 1000
    },
    
    free: {
      apiKey: 'SECURE_SERVER_SIDE_ONLY',
      baseUrl: 'https://v3.football.api-sports.io',
      rateLimitPerDay: 100
    },
    
    currentProvider: 'primary',
    
    defaultSettings: {
      timezone: 'UTC',
      maxResultsPerPage: 50,
      cacheTimeMinutes: 30,
      enableLiveScores: true,
      updateInterval: 60,
      preferredLanguage: 'en'
    },
    
    // Public tournament information (safe to expose)
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
  
  // Public app settings (safe to expose)
  app: {
    name: 'Football Tracker',
    version: '2.0.0',
    environment: 'browser',
    
    // Feature flags (public)
    features: {
      liveScores: true,
      playerStats: false,
      matchPredictions: false,
      pushNotifications: false,
      socialSharing: true
    },
    
    // UI Configuration (public)
    ui: {
      theme: 'dark',
      defaultView: 'fixtures',
      autoRefresh: true,
      refreshIntervalSeconds: 300,
      showFlags: true,
      showLogos: true,
      timeFormat: '24h'
    }
  }
};

// Helper functions (safe for browser)
footballConfig.getCurrentFootballConfig = function() {
  return this.football[this.football.currentProvider];
};

// Browser version always returns false - real check happens server-side
footballConfig.isFootballConfigured = function() {
  // Real API keys are checked server-side in netlify functions
  return false; // Browser never knows if API is configured
};

footballConfig.getTournamentConfig = function(tournamentName) {
  return this.football.defaultTournaments.find(t => 
    t.name.toLowerCase().includes(tournamentName.toLowerCase())
  );
};

// Browser-specific helpers
footballConfig.getUITheme = function() {
  return this.app.ui.theme;
};

footballConfig.getDefaultView = function() {
  return this.app.ui.defaultView;
};

footballConfig.shouldAutoRefresh = function() {
  return this.app.ui.autoRefresh;
};

footballConfig.getRefreshInterval = function() {
  return this.app.ui.refreshIntervalSeconds * 1000; // Convert to milliseconds
};

// Make config available globally for browser
if (typeof window !== 'undefined') {
  window.footballConfig = footballConfig;
  console.log('⚽ Football config loaded for browser (secure mode - no API keys exposed)');
  console.log('🔒 Real API keys stored securely server-side only');
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = footballConfig;
}
