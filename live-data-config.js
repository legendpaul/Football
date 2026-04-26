/**
 * Live Football Data Configuration
 * Centralized configuration for data sources, scraping settings, and UI options
 */

const LIVE_DATA_CONFIG = {
  // Auto-refresh settings
  refresh: {
    interval: 30000,        // 30 seconds
    silentRefresh: true,    // Update data without UI feedback
    retryAttempts: 3,       // Number of retry attempts
    retryDelay: 5000,       // Delay between retries (ms)
    timeout: 10000          // Request timeout (ms)
  },

  // Cache settings
  cache: {
    duration: 30000,        // 30 seconds cache
    maxSize: 100,           // Maximum cache entries
    cleanupInterval: 300000 // 5 minutes cleanup interval
  },

  // Data sources configuration
  sources: {
    // CORS proxies (tried in order)
    corsProxies: [
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://thingproxy.freeboard.io/fetch/'
    ],

    // UEFA U21 Championship sources
    uefaU21: {
      primary: [
        'https://www.uefa.com/under21/fixtures-results/',
        'https://editorial.uefa.com/v2/fixtures?competitionId=3'
      ],
      secondary: [
        'https://www.flashscore.com/football/europe/euro-u21/',
        'https://www.espn.com/soccer/uefa-u21/fixtures',
        'https://www.soccer24.com/europe/euro-u21/'
      ],
      backup: [
        'https://www.besoccer.com/competition/scores/uefa-u21-championship/2025',
        'https://www.goal.com/en/fixtures/uefa-u21-european-championship'
      ]
    },

    // FIFA Club World Cup sources
    fifaClubWorldCup: {
      primary: [
        'https://www.fifa.com/en/tournaments/mens/club-world-cup/usa-2025/scores-and-fixtures',
        'https://www.fifa.com/api/calendar-events'
      ],
      secondary: [
        'https://www.flashscore.com/football/world/fifa-club-world-cup/',
        'https://www.espn.com/soccer/club-world-cup/fixtures',
        'https://www.soccer24.com/world/fifa-club-world-cup/'
      ],
      backup: [
        'https://www.goal.com/en/fixtures/fifa-club-world-cup',
        'https://www.marca.com/en/football/international-football/fifa-club-world-cup.html'
      ]
    }
  },

  // Tournament information
  tournaments: {
    'UEFA Euro U21': {
      id: 'uefa_u21',
      name: 'UEFA European Under-21 Championship 2025',
      shortName: 'UEFA U21 Euro 2025',
      location: 'Slovakia',
      startDate: '2025-06-11',
      endDate: '2025-06-28',
      timezone: 'CET',
      enabled: true,
      hasGroups: true,
      hasKnockout: true,
      maxTeams: 16,
      groups: ['A', 'B', 'C', 'D'],
      logo: 'assets/uefa-u21-logo.png'
    },
    'FIFA Club World Cup': {
      id: 'fifa_cwc',
      name: 'FIFA Club World Cup 2025',
      shortName: 'FIFA CWC 2025',
      location: 'United States',
      startDate: '2025-06-14',
      endDate: '2025-07-13',
      timezone: 'EDT/CDT/PDT',
      enabled: true,
      hasGroups: true,
      hasKnockout: true,
      maxTeams: 32,
      groups: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      logo: 'assets/fifa-cwc-logo.png'
    }
  },

  // Data parsing patterns
  parsing: {
    // Team name patterns
    teamPatterns: [
      /([A-Za-z\s\u00C0-\u017F]+)\s+vs?\s+([A-Za-z\s\u00C0-\u017F]+)/i,
      /([A-Za-z\s\u00C0-\u017F]+)\s+-\s+([A-Za-z\s\u00C0-\u017F]+)/i,
      /([A-Za-z\s\u00C0-\u017F]+)\s+v\s+([A-Za-z\s\u00C0-\u017F]+)/i,
      /([A-Za-z\s\u00C0-\u017F]+)\s+–\s+([A-Za-z\s\u00C0-\u017F]+)/i
    ],

    // Score patterns
    scorePatterns: [
      /(\d+)\s*[-:–]\s*(\d+)/g,
      /(\d+)\s*–\s*(\d+)/g,
      /(\d+)\s+(\d+)/g
    ],

    // Time patterns
    timePatterns: [
      /(\d{1,2}):(\d{2})/g,
      /(\d{1,2})\.(\d{2})/g,
      /(\d{4}-\d{2}-\d{2})/g,
      /(\d{2}\/\d{2}\/\d{4})/g
    ],

    // CSS selectors for common elements
    selectors: {
      matches: [
        '.match-item',
        '.fixture-item',
        '.event-item',
        '[data-match-id]',
        '.game-item'
      ],
      teams: [
        '.team-name',
        '.club-name',
        '.participant',
        '.competitor'
      ],
      scores: [
        '.score',
        '.result',
        '.final-score',
        '.match-score'
      ],
      times: [
        '.match-time',
        '.kick-off',
        '.start-time',
        '.datetime'
      ],
      status: [
        '.match-status',
        '.game-status',
        '.event-status'
      ]
    }
  },

  // UI configuration
  ui: {
    // Animation settings
    animations: {
      enabled: true,
      livePulseDuration: 2000,
      shimmerDuration: 3000,
      fadeTransition: 300
    },

    // Live indicators
    liveIndicators: {
      showDot: true,
      showBadge: true,
      showBanner: true,
      pulseAnimation: true,
      autoHide: false
    },

    // Data display options
    display: {
      showFavoriteStars: true,
      showTimezones: true,
      showMatchStatus: true,
      showLastUpdated: true,
      maxMatchesPerView: 50,
      defaultView: 'fixtures'
    },

    // Debug panel settings
    debug: {
      enabled: true,
      showRequests: true,
      showResponses: true,
      showProcessedData: true,
      showConsoleLogs: true,
      maxLogEntries: 100
    }
  },

  // Error handling
  errorHandling: {
    showUserFriendlyMessages: true,
    fallbackToMockData: true,
    logAllErrors: true,
    retryFailedRequests: true,
    gracefulDegradation: true
  },

  // Performance settings
  performance: {
    enableCaching: true,
    debounceRequests: true,
    lazyLoadImages: true,
    minimizeReflows: true,
    useRequestAnimationFrame: true
  },

  // Storage configuration
  storage: {
    favoriteTeamsKey: 'footballFavoriteTeams',
    cachePrefix: 'football_cache_',
    maxStorageSize: 5242880, // 5MB
    compressionEnabled: false
  },

  // API endpoints (for production)
  api: {
    baseUrl: '/.netlify/functions',
    endpoints: {
      favorites: '/favorites',
      analytics: '/analytics',
      health: '/db-health'
    }
  },

  // Development settings
  development: {
    mockDataEnabled: true,
    verboseLogging: true,
    showSourceInfo: true,
    simulateSlowNetwork: false,
    bypassCors: false
  }
};

// Export configuration for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LIVE_DATA_CONFIG;
}

// Global configuration for browser usage
if (typeof window !== 'undefined') {
  window.LIVE_DATA_CONFIG = LIVE_DATA_CONFIG;
}

/**
 * Helper functions for configuration access
 */
const ConfigHelper = {
  // Get tournament configuration
  getTournament(key) {
    return LIVE_DATA_CONFIG.tournaments[key];
  },

  // Get all enabled tournaments
  getEnabledTournaments() {
    return Object.entries(LIVE_DATA_CONFIG.tournaments)
      .filter(([key, config]) => config.enabled)
      .reduce((acc, [key, config]) => {
        acc[key] = config;
        return acc;
      }, {});
  },

  // Get data sources for tournament
  getSources(tournamentId) {
    const sourceMap = {
      uefa_u21: 'uefaU21',
      fifa_cwc: 'fifaClubWorldCup'
    };
    
    const sourceKey = sourceMap[tournamentId];
    return sourceKey ? LIVE_DATA_CONFIG.sources[sourceKey] : null;
  },

  // Get refresh interval
  getRefreshInterval() {
    return LIVE_DATA_CONFIG.refresh.interval;
  },

  // Check if tournament is currently active
  isTournamentActive(tournamentKey) {
    const tournament = this.getTournament(tournamentKey);
    if (!tournament) return false;

    const now = new Date();
    const start = new Date(tournament.startDate);
    const end = new Date(tournament.endDate);
    
    return now >= start && now <= end;
  },

  // Get timezone offset for tournament
  getTimezoneOffset(tournamentKey) {
    const tournament = this.getTournament(tournamentKey);
    if (!tournament) return 0;

    // Simplified timezone mapping
    const timezoneMap = {
      'CET': 1,      // UTC+1
      'EDT': -4,     // UTC-4
      'CDT': -5,     // UTC-5
      'PDT': -7      // UTC-7
    };

    return timezoneMap[tournament.timezone] || 0;
  },

  // Validate configuration
  validateConfig() {
    const errors = [];

    // Check required fields
    if (!LIVE_DATA_CONFIG.refresh.interval) {
      errors.push('Refresh interval not configured');
    }

    if (!LIVE_DATA_CONFIG.sources.corsProxies.length) {
      errors.push('No CORS proxies configured');
    }

    // Check tournaments
    Object.entries(LIVE_DATA_CONFIG.tournaments).forEach(([key, tournament]) => {
      if (!tournament.startDate || !tournament.endDate) {
        errors.push(`Tournament ${key} missing date configuration`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Export helper for browser usage
if (typeof window !== 'undefined') {
  window.ConfigHelper = ConfigHelper;
}

// Export helper for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports.ConfigHelper = ConfigHelper;
}
