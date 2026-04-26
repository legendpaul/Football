// Football Tracker - Enhanced Web Version with Neon DB Integration
// Uses localStorage for local development and Neon DB for production deployment

console.log('📦 Loading app-web-fixed.js...');

class FootballApp {
  constructor() {
    this.currentTournament = 'UEFA Euro U21';
    this.currentView = 'fixtures'; // 'fixtures', 'results', 'live', 'tournament'
    this.footballMatches = [];
    this.footballMatchesPool = [];
    this.displayedMatchIds = new Set();
    this.favoriteTeams = [];
    this.userFavorites = [];
    this.lastFetchTime = null;
    this.isLoading = false;
    this.maxDisplayItems = 20;
    this.maxPoolItems = 100;
    this.autoRefreshEnabled = true;
    
    // Storage configuration - Enhanced local detection
    this.isLocal = this.detectLocalEnvironment();
    this.apiBaseUrl = this.isLocal ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions';
    this.useDatabase = !this.isLocal; // Use database for production, localStorage for local
    
    // Force database mode override for testing (remove this in production)
    // this.useDatabase = true; // Uncomment to force database mode for testing
    
    // Memory management properties
    this.renderQueue = new Set();
    this.imageCache = new Map();
    this.maxImageCache = 50;
    this.eventListeners = new Map();
    this.intersectionObserver = null;
    this.memoryCleanupInterval = null;
    this.autoRefreshInterval = null;
    
    // Debug information tracking
    this.debugInfo = {
      lastRequest: null,
      lastResponse: null,
      processingSteps: [],
      consoleMessages: []
    };
    
    this.init();
  }

  // Enhanced local environment detection
  detectLocalEnvironment() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    const href = window.location.href;
    
    // Check for local development indicators
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    const isFileProtocol = protocol === 'file:';
    const isLocalPort = port && (port === '3000' || port === '8080' || port === '8888' || port === '5000');
    const isLocalDomain = hostname.endsWith('.local') || hostname.includes('192.168.') || hostname.includes('10.0.');
    
    // Check for Netlify indicators (production)
    const isNetlify = hostname.includes('.netlify.app') || hostname.includes('.netlify.com');
    const isCustomDomain = !isLocalHost && !isFileProtocol && !isLocalPort && !isLocalDomain && hostname.includes('.');
    
    // Consider it local if any local indicators are true AND no production indicators
    const isLocal = (isLocalHost || isFileProtocol || isLocalPort || isLocalDomain) && !isNetlify;
    
    console.log('🔍 Environment Detection:', {
      hostname,
      protocol,
      port,
      href,
      isLocalHost,
      isFileProtocol,
      isLocalPort,
      isLocalDomain,
      isNetlify,
      isCustomDomain,
      finalDecision: isLocal ? 'LOCAL' : 'PRODUCTION'
    });
    
    return isLocal;
  }

  async init() {
    try {
      this.updateClock();
      
      // Initialize storage (database or localStorage)
      await this.initializeStorage();
      
      // Load data from storage
      await this.loadFavoriteTeams();
      await this.loadUserFavorites();
      
      this.setupEventListeners();
      this.updateResultsInfo();
      
      // Setup memory management
      setTimeout(() => {
        this.setupMemoryManagement();
      }, 1000);
      
      // Show notification about storage and API status
      setTimeout(() => {
        const environment = this.isLocal ? 'Local Development' : 'Production';
        const storage = this.useDatabase ? 'Neon Database' : 'localStorage';
        const apiMode = this.isLocal ? 'simulation (unless Netlify Dev running)' : 'real Football API';
        
        this.showNotification(`🌐 ${environment} mode - ${storage} + ${apiMode}`);
        
        // Test connections
        this.testAPIConnection();
        if (this.useDatabase) {
          this.testDatabaseConnection();
        } else {
          console.log('💾 Using localStorage - no database test needed');
        }
      }, 2000);
      
      // Update clock every 5 seconds
      this.addManagedInterval(() => this.updateClock(), 5000);
      
      // Setup auto-refresh for live scores
      this.setupAutoRefresh();
      
      console.log('⚽ Football Tracker (Neon DB version) initialized!');
      console.log(`🌐 Environment: ${this.isLocal ? 'Local Development' : 'Production'}`);
      console.log(`🗄️ Storage: ${this.useDatabase ? 'Neon Database' : 'localStorage'}`);
      console.log(`🔗 API Base URL: ${this.apiBaseUrl}`);
      console.log(`🧪 API Mode: ${this.isLocal ? 'Simulation (start "netlify dev" for functions)' : 'Production Football API'}`);
      
      if (this.isLocal) {
        console.log('📝 Local Development Tips:');
        console.log('   - Run "netlify dev" to enable serverless functions');
        console.log('   - Data is stored in browser localStorage');
        console.log('   - Simulation data is used when functions are unavailable');
      }
      
      // Log current status for debugging
      this.logCurrentStatus();
      
    } catch (error) {
      console.error('❌ Error initializing Football Tracker:', error);
      throw error;
    }
  }

  // ===============================
  // DEBUGGING AND STATUS METHODS
  // ===============================
  
  logCurrentStatus() {
    const status = {
      environment: this.isLocal ? 'Local Development' : 'Production',
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      useDatabase: this.useDatabase,
      apiBaseUrl: this.apiBaseUrl,
      storageMode: this.useDatabase ? 'Neon Database' : 'localStorage',
      currentTournament: this.currentTournament,
      currentView: this.currentView
    };
    
    console.log('📊 Current App Status:', status);
    return status;
  }

  // ===============================
  // STORAGE INITIALIZATION
  // ===============================
  
  async initializeStorage() {
    if (this.useDatabase) {
      console.log('🗄️ Using Neon database for data storage');
      this.addDebugMessage('🗄️ Initializing Neon database storage', 'info');
    } else {
      console.log('💾 Using localStorage for local development');
      this.addDebugMessage('💾 Using localStorage for local development', 'info');
    }
  }

  async testDatabaseConnection() {
    if (!this.useDatabase) return;
    
    try {
      console.log('🔍 Testing database connection...');
      this.addDebugMessage('🔍 Testing database connection...', 'info');
      
      // Add timeout for database connection test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.apiBaseUrl}/db-health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data.success) {
        this.showNotification('✅ Database connection successful!');
        this.addDebugMessage(`✅ Database connected: ${data.data.teamsCount} teams, ${data.data.tournamentsCount} tournaments`, 'success');
        console.log('✅ Database connection test successful:', data);
      } else {
        throw new Error(data.error || 'Database health check failed');
      }
    } catch (error) {
      console.error('❌ Database connection test error:', error);
      this.addDebugMessage(`❌ Database connection failed: ${error.message}`, 'error');
      
      if (this.isLocal) {
        this.showNotification('💾 Local mode - using localStorage instead of database');
        this.addDebugMessage('💾 Local development - falling back to localStorage', 'info');
      } else {
        this.showNotification('❌ Database connection failed - falling back to localStorage');
      }
      
      this.useDatabase = false; // Fall back to localStorage
    }
  }

  async testAPIConnection() {
    try {
      console.log('🧪 Testing Football API connection via serverless function...');
      this.addDebugMessage('🧪 Testing Football API connection...', 'info');
      
      // For local development, check if netlify dev is running
      if (this.isLocal) {
        console.log('🏠 Local environment detected - checking if Netlify Dev is running...');
        
        // Try to fetch with a timeout for local development
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        try {
          const response = await fetch(`${this.apiBaseUrl}/football-search?tournament=Premier League&type=fixtures`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              this.showNotification('✅ Netlify Dev detected - API functions available!');
              this.addDebugMessage('✅ Netlify Dev running - serverless functions available', 'success');
              return;
            }
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.log('⏰ Local API timeout - Netlify Dev not running');
          } else {
            console.log('🔌 Local API connection failed - Netlify Dev not running');
          }
        }
        
        // If we get here, netlify dev is not running
        this.showNotification('💻 Local mode - Netlify Dev not detected, using simulation');
        this.addDebugMessage('💻 Local mode - using simulation (start "netlify dev" for serverless functions)', 'info');
        return;
      }
      
      // Production environment
      const response = await fetch(`${this.apiBaseUrl}/football-search?tournament=Premier League&type=fixtures`);
      const data = await response.json();
      
      if (data.success && !data.isSimulation) {
        this.showNotification('✅ Football API connection successful!');
        this.addDebugMessage('✅ Football API connection test successful', 'success');
        console.log('✅ Football API connection test successful');
      } else if (data.isSimulation) {
        this.showNotification('⚠️ Football API not configured - check environment variables');
        this.addDebugMessage('⚠️ API not configured - using simulation mode', 'warning');
        console.log('⚠️ Football API not configured, will use simulation');
      } else {
        throw new Error(data.message || 'Unknown API error');
      }
    } catch (error) {
      console.error('❌ API connection test error:', error);
      this.addDebugMessage(`❌ API connection test failed: ${error.message}`, 'error');
      
      if (this.isLocal) {
        this.showNotification('💻 Local development - using simulation mode');
      } else {
        this.showNotification('❌ Football API connection test failed - will use simulation');
      }
    }
  }

  // ===============================
  // STORAGE METHODS (Database + localStorage)
  // ===============================

  // Favorite Teams Storage Methods
  async saveFavoriteTeams() {
    try {
      if (this.useDatabase) {
        // Database automatically saves when we add/remove teams via API
        this.addDebugMessage('💾 Favorite teams saved to database', 'info');
      } else {
        const data = {
          favoriteTeams: this.favoriteTeams,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('footballTracker_favoriteTeams', JSON.stringify(data));
        console.log('💾 Favorite teams saved to localStorage');
        this.addDebugMessage('💾 Favorite teams saved to localStorage', 'info');
      }
    } catch (error) {
      console.error('Error saving favorite teams:', error);
      this.addDebugMessage(`❌ Error saving favorite teams: ${error.message}`, 'error');
    }
  }

  async loadFavoriteTeams() {
    try {
      if (this.useDatabase) {
        console.log('📂 Loading favorite teams from database...');
        
        const response = await fetch(`${this.apiBaseUrl}/favorites?type=team`);
        const data = await response.json();
        
        if (data.success) {
          this.favoriteTeams = data.data.favorites.map(fav => fav.item_name).filter(Boolean) || [];
          console.log(`📂 Loaded ${this.favoriteTeams.length} favorite teams from database`);
          this.addDebugMessage(`📂 Loaded ${this.favoriteTeams.length} favorite teams from database`, 'success');
        } else {
          throw new Error(data.error || 'Failed to load favorite teams');
        }
      } else {
        const stored = localStorage.getItem('footballTracker_favoriteTeams');
        if (stored) {
          const data = JSON.parse(stored);
          this.favoriteTeams = data.favoriteTeams || [];
          console.log(`📂 Loaded ${this.favoriteTeams.length} favorite teams from localStorage`);
          this.addDebugMessage(`📂 Loaded ${this.favoriteTeams.length} favorite teams from localStorage`, 'info');
        } else {
          console.log('📂 No favorite teams found in localStorage, starting fresh');
          this.addDebugMessage('📂 No favorite teams found, starting fresh', 'info');
        }
      }
    } catch (error) {
      console.error('Error loading favorite teams:', error);
      this.addDebugMessage(`❌ Error loading favorite teams: ${error.message}`, 'error');
      this.favoriteTeams = [];
      
      // If database fails, try falling back to localStorage
      if (this.useDatabase) {
        console.log('🔄 Database failed, falling back to localStorage...');
        this.useDatabase = false;
        await this.loadFavoriteTeams();
      }
    }
  }

  async loadUserFavorites() {
    try {
      if (this.useDatabase) {
        console.log('📂 Loading user favorites from database...');
        
        const response = await fetch(`${this.apiBaseUrl}/favorites`);
        const data = await response.json();
        
        if (data.success) {
          this.userFavorites = data.data.favorites || [];
          console.log(`📂 Loaded ${this.userFavorites.length} user favorites from database`);
          this.addDebugMessage(`📂 Loaded ${this.userFavorites.length} user favorites from database`, 'success');
        } else {
          throw new Error(data.error || 'Failed to load user favorites');
        }
      } else {
        const stored = localStorage.getItem('footballTracker_userFavorites');
        if (stored) {
          const data = JSON.parse(stored);
          this.userFavorites = data.userFavorites || [];
          console.log(`📂 Loaded ${this.userFavorites.length} user favorites from localStorage`);
          this.addDebugMessage(`📂 Loaded ${this.userFavorites.length} user favorites from localStorage`, 'info');
        } else {
          console.log('📂 No user favorites found in localStorage, starting fresh');
          this.addDebugMessage('📂 No user favorites found, starting fresh', 'info');
        }
      }
    } catch (error) {
      console.error('Error loading user favorites:', error);
      this.addDebugMessage(`❌ Error loading user favorites: ${error.message}`, 'error');
      this.userFavorites = [];
    }
  }

  async addFavoriteTeam() {
    const input = document.getElementById('team-input');
    if (!input) return;
    
    const teamName = input.value.trim();
    if (!teamName) return;
    
    try {
      if (this.useDatabase) {
        console.log(`⭐ Adding "${teamName}" to database...`);
        
        // First try to add team to teams table, then to favorites
        const response = await fetch(`${this.apiBaseUrl}/teams`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            name: teamName,
            country: null,
            league: null 
          })
        });
        
        const teamData = await response.json();
        let teamId = null;
        
        if (teamData.success) {
          teamId = teamData.data.team.id;
        } else {
          // Team might already exist, try to find it
          const existingResponse = await fetch(`${this.apiBaseUrl}/teams`);
          const existingData = await existingResponse.json();
          if (existingData.success) {
            const existingTeam = existingData.data.teams.find(t => 
              t.name.toLowerCase() === teamName.toLowerCase()
            );
            if (existingTeam) {
              teamId = existingTeam.id;
            }
          }
        }
        
        if (teamId) {
          // Add to favorites
          const favResponse = await fetch(`${this.apiBaseUrl}/favorites`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              itemType: 'team',
              itemId: teamId
            })
          });
          
          const favData = await favResponse.json();
          
          if (favData.success) {
            this.favoriteTeams = favData.data.favorites
              .filter(fav => fav.item_type === 'team')
              .map(fav => fav.item_name)
              .filter(Boolean);
            console.log(`⭐ Added "${teamName}" to database`);
            this.addDebugMessage(`⭐ Added "${teamName}" to database`, 'success');
          } else {
            throw new Error(favData.error || 'Failed to add to favorites');
          }
        } else {
          throw new Error('Could not find or create team');
        }
      } else {
        if (!this.favoriteTeams.includes(teamName.toLowerCase())) {
          this.favoriteTeams.push(teamName);
          this.saveFavoriteTeams();
          console.log(`⭐ Added "${teamName}" to localStorage`);
          this.addDebugMessage(`⭐ Added "${teamName}" to localStorage`, 'success');
        }
      }
      
      this.renderFavoriteTeams();
      input.value = '';
      
      this.showNotification(`⭐ Added "${teamName}" to favorite teams`);
      
    } catch (error) {
      console.error('Error adding favorite team:', error);
      this.addDebugMessage(`❌ Error adding favorite team: ${error.message}`, 'error');
      this.showNotification(`❌ Failed to add team: ${error.message}`);
    }
  }

  async removeFavoriteTeam(teamName) {
    try {
      if (this.useDatabase) {
        console.log(`🗑️ Removing "${teamName}" from database...`);
        
        // Find the team in favorites and remove it
        const favorite = this.userFavorites.find(fav => 
          fav.item_type === 'team' && fav.item_name === teamName
        );
        
        if (favorite) {
          const response = await fetch(`${this.apiBaseUrl}/favorites?itemType=team&itemId=${favorite.item_id}`, {
            method: 'DELETE'
          });
          
          const data = await response.json();
          
          if (data.success) {
            this.favoriteTeams = data.data.favorites
              .filter(fav => fav.item_type === 'team')
              .map(fav => fav.item_name)
              .filter(Boolean);
            console.log(`🗑️ Removed "${teamName}" from database`);
            this.addDebugMessage(`🗑️ Removed "${teamName}" from database`, 'success');
          } else {
            throw new Error(data.error || 'Failed to remove team');
          }
        }
      } else {
        const index = this.favoriteTeams.findIndex(team => team.toLowerCase() === teamName.toLowerCase());
        if (index > -1) {
          this.favoriteTeams.splice(index, 1);
          this.saveFavoriteTeams();
          console.log(`🗑️ Removed "${teamName}" from localStorage`);
          this.addDebugMessage(`🗑️ Removed "${teamName}" from localStorage`, 'success');
        }
      }
      
      this.renderFavoriteTeams();
      
    } catch (error) {
      console.error('Error removing favorite team:', error);
      this.addDebugMessage(`❌ Error removing favorite team: ${error.message}`, 'error');
      this.showNotification(`❌ Failed to remove team: ${error.message}`);
    }
  }

  async clearFavoriteTeams() {
    if (this.favoriteTeams.length === 0) return;
    
    if (!confirm(`Are you sure you want to clear all ${this.favoriteTeams.length} favorite teams?`)) {
      return;
    }
    
    try {
      if (this.useDatabase) {
        console.log('🗑️ Clearing all favorite teams from database...');
        
        const response = await fetch(`${this.apiBaseUrl}/favorites?clearAll=true`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          this.favoriteTeams = [];
          console.log('🗑️ Cleared all favorite teams from database');
          this.addDebugMessage(`🗑️ Cleared ${data.data.deletedCount} favorite teams from database`, 'success');
        } else {
          throw new Error(data.error || 'Failed to clear teams');
        }
      } else {
        this.favoriteTeams = [];
        this.saveFavoriteTeams();
        console.log('🗑️ Cleared favorite teams from localStorage');
        this.addDebugMessage('🗑️ Cleared favorite teams from localStorage', 'success');
      }
      
      this.renderFavoriteTeams();
      this.showNotification('🗑️ Favorite teams cleared');
      
    } catch (error) {
      console.error('Error clearing favorite teams:', error);
      this.addDebugMessage(`❌ Error clearing favorite teams: ${error.message}`, 'error');
      this.showNotification(`❌ Failed to clear teams: ${error.message}`);
    }
  }

  // ===============================
  // FOOTBALL API AND DATA PROCESSING METHODS
  // ===============================

  async fetchFootballData(silent = false) {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      if (!silent) this.showLoadingState(true);
      
      this.addDebugMessage(`⚽ Starting football search for tournament: ${this.currentTournament}, view: ${this.currentView}`, 'info');
      console.log(`⚽ Fetching football data for tournament: ${this.currentTournament}, view: ${this.currentView}`);
      
      let results;
      
      try {
        console.log('🌐 Fetching REAL football data via serverless function...');
        this.addDebugMessage('🌐 Using serverless function for Football API', 'info');
        results = await this.fetchViaServerlessFunction();
        
      } catch (apiError) {
        console.log('🔄 API failed, falling back to simulation...');
        console.error('❌ Football API error:', apiError.message);
        this.addDebugMessage(`❌ API failed: ${apiError.message}`, 'error');
        this.addDebugMessage('🔄 Falling back to simulation...', 'warning');
        
        results = await this.simulateFootballAPI(this.currentTournament, this.currentView, this.maxPoolItems);
      }
      
      this.updateMatchPool(results);
      this.refreshDisplayedMatches();
      
      const dataSource = results.length > 0 && results[0].id && results[0].id.startsWith('sim_') ? 'simulation' : 'real Football API';
      if (!silent) {
        console.log(`✅ Fetched ${this.footballMatchesPool.length} matches to pool, displaying ${this.footballMatches.length}`);
        this.showNotification(`✅ Found ${this.footballMatches.length} ${this.currentView} for ${this.currentTournament} (${dataSource})`);
      }
      this.addDebugMessage(`✅ Search completed: ${this.footballMatches.length} matches displayed from ${this.footballMatchesPool.length} in pool`, 'success');
      
    } catch (error) {
      console.error('❌ Fatal error fetching football data:', error);
      this.addDebugMessage(`❌ Fatal error: ${error.message}`, 'error');
      if (!silent) this.showNotification(`❌ Error fetching football data: ${error.message}`);
    } finally {
      this.isLoading = false;
      if (!silent) this.showLoadingState(false);
    }
  }

  async fetchViaServerlessFunction() {
    try {
      const url = `${this.apiBaseUrl}/football-search?tournament=${encodeURIComponent(this.currentTournament)}&type=${this.currentView}&season=2025`;
      
      console.log(`📤 Making request to: ${url}`);
      this.addDebugMessage(`📤 Making API request to: ${url}`, 'info');
      
      this.updateDebugRequest({
        url: url,
        method: 'GET',
        tournament: this.currentTournament,
        type: this.currentView,
        timestamp: new Date().toISOString()
      });

      // Add timeout for local development
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.isLocal ? 5000 : 15000); // 5s for local, 15s for production

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('📥 Serverless function response:', data);
      
      this.updateDebugResponse({
        status: response.status,
        success: data.success,
        isSimulation: data.isSimulation,
        itemCount: data.data ? data.data.length : 0,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString()
      });
      
      if (!data.success) {
        throw new Error(data.message || 'Football API call failed');
      }
      
      if (data.isSimulation) {
        console.log('⚠️ Serverless function returned simulation data');
        this.addDebugMessage('⚠️ Serverless function using simulation mode', 'warning');
        throw new Error('API not configured on server');
      }
      
      console.log(`✅ Retrieved ${data.data.length} matches from Football API`);
      this.addDebugMessage(`✅ Retrieved ${data.data.length} matches from Football API`, 'success');
      
      return data.data || [];
      
    } catch (error) {
      console.error('❌ Serverless function error:', error);
      this.addDebugMessage(`❌ Serverless function error: ${error.message}`, 'error');
      
      // For local development, provide helpful error messages
      if (this.isLocal) {
        if (error.name === 'AbortError') {
          throw new Error('Local API timeout - start "netlify dev" to use serverless functions');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to local functions - start "netlify dev" or use simulation');
        }
      }
      
      throw error;
    }
  }

  // Simulation fallback for football data
  async simulateFootballAPI(tournament, dataType, itemCount = 20) {
    console.log('⚠️ Using SIMULATION data - API not available');
    this.addDebugMessage('⚠️ Using simulation data as fallback', 'warning');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const matches = [];
    
    for (let i = 0; i < itemCount; i++) {
      const match = this.generateSampleMatch(tournament, dataType, i);
      matches.push(match);
    }
    
    return matches;
  }

  generateSampleMatch(tournament, dataType, index) {
    const teams = [
      { name: 'Manchester City', logo: this.getPlaceholderLogo() },
      { name: 'Real Madrid', logo: this.getPlaceholderLogo() },
      { name: 'Bayern Munich', logo: this.getPlaceholderLogo() },
      { name: 'Paris Saint-Germain', logo: this.getPlaceholderLogo() },
      { name: 'Inter Miami', logo: this.getPlaceholderLogo() },
      { name: 'Chelsea', logo: this.getPlaceholderLogo() },
      { name: 'Barcelona', logo: this.getPlaceholderLogo() },
      { name: 'Liverpool', logo: this.getPlaceholderLogo() },
      { name: 'Juventus', logo: this.getPlaceholderLogo() },
      { name: 'Arsenal', logo: this.getPlaceholderLogo() }
    ];
    
    const homeTeam = teams[index % teams.length];
    const awayTeam = teams[(index + 1) % teams.length];
    
    const isFixture = dataType === 'fixtures';
    const isResult = dataType === 'results';
    const isLive = dataType === 'live';
    
    const matchDate = isResult 
      ? new Date(Date.now() - (index * 24 * 60 * 60 * 1000)) // Past dates for results
      : new Date(Date.now() + (index * 24 * 60 * 60 * 1000)); // Future dates for fixtures
    
    const score = isResult || isLive ? {
      home: Math.floor(Math.random() * 4),
      away: Math.floor(Math.random() * 4),
      halftime: { home: 1, away: 0 }
    } : null;
    
    return {
      id: `sim_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tournament,
      homeTeam,
      awayTeam,
      score,
      date: matchDate.toISOString(),
      time: matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      venue: `Stadium ${index + 1}`,
      city: this.getRandomCity(),
      status: isResult ? 'Finished' : (isLive ? 'Live' : 'Not Started'),
      statusShort: isResult ? 'FT' : (isLive ? 'LIVE' : 'NS'),
      minute: isLive ? Math.floor(Math.random() * 90) + 1 : null,
      stage: this.getRandomStage(tournament),
      isLive: isLive,
      isFinished: isResult,
      isUpcoming: isFixture,
      referee: 'Simulation Referee',
      attendance: Math.floor(Math.random() * 80000) + 20000,
      priority: this.getTournamentPriority(tournament),
      lastUpdated: new Date().toISOString()
    };
  }

  getPlaceholderLogo() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIzMCIgZmlsbD0iIzQ0NCIvPjx0ZXh0IHg9IjMwIiB5PSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIj7ijK88L3RleHQ+PC9zdmc+';
  }

  getRandomCity() {
    const cities = ['London', 'Madrid', 'Munich', 'Paris', 'Miami', 'Barcelona', 'Liverpool', 'Turin', 'Milan'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  getRandomStage(tournament) {
    if (tournament.includes('Club World Cup') || tournament.includes('Champions League')) {
      const stages = ['Group Stage', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'];
      return stages[Math.floor(Math.random() * stages.length)];
    }
    return 'Matchday ' + (Math.floor(Math.random() * 38) + 1);
  }

  getTournamentPriority(tournament) {
    const priorities = {
      'FIFA Club World Cup': 'high',
      'UEFA Euro U21': 'high',
      'UEFA Champions League': 'high',
      'Premier League': 'medium',
      'La Liga': 'medium',
      'Bundesliga': 'medium',
      'Serie A': 'low',
      'Ligue 1': 'low'
    };
    
    return priorities[tournament] || 'low';
  }

  // ===============================
  // DATA PROCESSING METHODS
  // ===============================

  updateMatchPool(rawResults) {
    const processingSteps = [];
    
    processingSteps.push({
      name: 'Initial API Results',
      input: 0,
      output: rawResults.length,
      details: `Fetched from ${rawResults.length > 0 && rawResults[0].id && rawResults[0].id.startsWith('sim_') ? 'simulation' : 'Football API'}`
    });
    
    const favoriteFilteredResults = this.prioritizeFavoriteTeams(rawResults);
    processingSteps.push({
      name: 'Favorite Teams Priority',
      input: rawResults.length,
      output: favoriteFilteredResults.length,
      details: `Prioritized ${this.favoriteTeams.length} favorite teams: ${this.favoriteTeams.join(', ') || 'none'}`
    });
    
    const sortedResults = this.sortByMatchTime(favoriteFilteredResults);
    processingSteps.push({
      name: 'Sort by Match Time',
      input: favoriteFilteredResults.length,
      output: sortedResults.length,
      details: 'Sorted by match date/time'
    });
    
    this.footballMatchesPool = sortedResults;
    processingSteps.push({
      name: 'Pool Updated',
      input: sortedResults.length,
      output: this.footballMatchesPool.length,
      details: `Pool now contains ${this.footballMatchesPool.length} available matches`
    });
    
    this.updateDebugProcessing(processingSteps);
    
    console.log(`🏊 Pool updated: ${this.footballMatchesPool.length} matches available`);
  }
  
  refreshDisplayedMatches() {
    this.displayedMatchIds.clear();
    this.footballMatchesPool = this.sortByMatchTime(this.footballMatchesPool);
    this.footballMatches = this.footballMatchesPool.slice(0, this.maxDisplayItems);
    this.footballMatches = this.sortByMatchTime(this.footballMatches);
    
    this.footballMatches.forEach(match => {
      this.displayedMatchIds.add(match.id);
    });
    
    this.lastFetchTime = new Date().toISOString();
    this.renderFootballResults();
    this.updateResultsInfo();
    this.updateSectionTitle();
    
    console.log(`📺 Display refreshed: ${this.footballMatches.length} matches shown from pool of ${this.footballMatchesPool.length} (sorted by time)`);
  }

  prioritizeFavoriteTeams(matches) {
    if (this.favoriteTeams.length === 0) return matches;
    
    const favoriteMatches = [];
    const otherMatches = [];
    
    matches.forEach(match => {
      const homeTeamName = match.homeTeam.name.toLowerCase();
      const awayTeamName = match.awayTeam.name.toLowerCase();
      const isFavorite = this.favoriteTeams.some(team => 
        homeTeamName.includes(team.toLowerCase()) || awayTeamName.includes(team.toLowerCase())
      );
      
      if (isFavorite) {
        favoriteMatches.push(match);
      } else {
        otherMatches.push(match);
      }
    });
    
    return [...favoriteMatches, ...otherMatches];
  }

  sortByMatchTime(matches) {
    return matches.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      
      if (isNaN(timeA) || isNaN(timeB)) {
        console.warn('Invalid match time found:', { a: a.date, b: b.date });
        return 0;
      }
      
      // For fixtures, sort ascending (earliest first)
      // For results, sort descending (most recent first)
      if (this.currentView === 'results') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });
  }

  // ===============================
  // VIEW SWITCHING METHODS
  // ===============================

  switchView(viewType) {
    if (this.currentView === viewType) return;
    
    this.currentView = viewType;
    console.log(`🔄 Switching to ${viewType} view`);
    this.addDebugMessage(`🔄 Switched to ${viewType} view`, 'info');
    
    // Clear current data
    this.footballMatches = [];
    this.footballMatchesPool = [];
    this.displayedMatchIds.clear();
    
    // Update UI
    this.updateSectionTitle();
    this.renderFootballResults();
    this.updateResultsInfo();
    
    // Show/hide containers based on view
    const liveContainer = document.getElementById('live-scores-container');
    const fixturesSection = document.querySelector('.fixtures-section');
    const tournamentSection = document.getElementById('tournament-structure-section');
    
    if (liveContainer) {
      liveContainer.style.display = viewType === 'live' ? 'block' : 'none';
    }
    
    if (fixturesSection) {
      fixturesSection.style.display = viewType === 'tournament' ? 'none' : 'block';
    }
    
    if (tournamentSection) {
      tournamentSection.style.display = viewType === 'tournament' ? 'block' : 'none';
    }
    
    // Handle tournament view
    if (viewType === 'tournament') {
      this.renderTournamentStructure();
    } else {
      // Fetch new data for other views
      setTimeout(() => {
        this.fetchFootballData();
      }, 100);
    }
  }

  updateSectionTitle() {
    const titleElement = document.getElementById('main-section-title');
    if (titleElement) {
      const titles = {
        'fixtures': '📅 Upcoming Fixtures',
        'results': '📊 Recent Results', 
        'live': '🔴 Live Matches',
        'tournament': '🏆 Tournament Structure'
      };
      titleElement.textContent = titles[this.currentView] || 'Football Matches';
    }
    
    const tournamentTitleElement = document.getElementById('tournament-section-title');
    if (tournamentTitleElement && this.currentView === 'tournament') {
      tournamentTitleElement.textContent = `🏆 ${this.currentTournament} - Tournament Structure`;
    }
  }

  onTournamentChange() {
    const select = document.getElementById('tournament-select');
    if (select) {
      const newTournament = select.value;
      if (newTournament !== this.currentTournament) {
        this.currentTournament = newTournament;
        console.log(`🏆 Tournament changed to: ${this.currentTournament}`);
        this.addDebugMessage(`🏆 Tournament changed to: ${this.currentTournament}`, 'info');
        
        // Clear current data
        this.footballMatches = [];
        this.footballMatchesPool = [];
        this.displayedMatchIds.clear();
        this.renderFootballResults();
        this.updateResultsInfo();
        
        // If in tournament view, refresh tournament structure
        if (this.currentView === 'tournament') {
          this.renderTournamentStructure();
        }
      }
    }
  }
  
  // ===============================
  // TOURNAMENT STRUCTURE METHODS
  // ===============================
  
  async renderTournamentStructure() {
    console.log(`🏆 Rendering tournament structure for ${this.currentTournament}`);
    this.addDebugMessage(`🏆 Loading tournament structure for ${this.currentTournament}`, 'info');
    
    try {
      if (this.currentTournament === 'UEFA Euro U21') {
        await this.renderU21EuroStructure();
      } else if (this.currentTournament === 'FIFA Club World Cup') {
        await this.renderClubWorldCupStructure();
      }
    } catch (error) {
      console.error('❌ Error rendering tournament structure:', error);
      this.addDebugMessage(`❌ Error rendering tournament structure: ${error.message}`, 'error');
    }
  }
  
  async renderU21EuroStructure() {
    const groupContainer = document.getElementById('group-stage-container');
    const knockoutContainer = document.getElementById('knockout-stage-container');
    
    if (!groupContainer || !knockoutContainer) return;
    
    // Load and render group stage
    try {
      const groupsResponse = await fetch('data/u21_euro_groups.json');
      const groupsData = await groupsResponse.json();
      this.renderGroupStage(groupContainer, groupsData);
    } catch (error) {
      console.error('Error loading group data:', error);
      groupContainer.innerHTML = '<p>Error loading group stage data</p>';
    }
    
    // Load and render knockout stage
    try {
      const knockoutResponse = await fetch('data/u21_euro_knockout.json');
      const knockoutData = await knockoutResponse.json();
      this.renderKnockoutStage(knockoutContainer, knockoutData, 'uefa');
    } catch (error) {
      console.error('Error loading knockout data:', error);
      knockoutContainer.innerHTML = '<p>Error loading knockout stage data</p>';
    }
  }
  
  async renderClubWorldCupStructure() {
    const groupContainer = document.getElementById('group-stage-container');
    const knockoutContainer = document.getElementById('knockout-stage-container');
    
    if (!groupContainer || !knockoutContainer) return;
    
    // Club World Cup typically doesn't have group stage, so hide it
    groupContainer.innerHTML = '';
    
    // Load and render tournament structure
    try {
      const structureResponse = await fetch('data/club_world_cup_structure.json');
      const structureData = await structureResponse.json();
      this.renderKnockoutStage(knockoutContainer, structureData, 'fifa');
    } catch (error) {
      console.error('Error loading tournament structure:', error);
      knockoutContainer.innerHTML = '<p>Error loading tournament structure data</p>';
    }
  }
  
  renderGroupStage(container, groupsData) {
    container.innerHTML = '';
    
    if (!groupsData || !Array.isArray(groupsData)) {
      container.innerHTML = '<p>No group stage data available</p>';
      return;
    }
    
    groupsData.forEach(group => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'group-table';
      
      groupDiv.innerHTML = `
        <div class="group-header">${group.group_name}</div>
        <div class="group-standings">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Team</th>
                <th>Played</th>
                <th>Won</th>
                <th>Drawn</th>
                <th>Lost</th>
                <th>For</th>
                <th>Against</th>
                <th>Goal Diff</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              ${this.generateGroupTableRows(group)}
            </tbody>
          </table>
        </div>
      `;
      
      container.appendChild(groupDiv);
    });
  }
  
  generateGroupTableRows(group) {
    // Use actual data from JSON file if available, otherwise fall back to sample data
    if (group.standings && Array.isArray(group.standings) && group.standings.length > 0) {
      // Check if standings are objects (new format) or strings (old format)
      if (typeof group.standings[0] === 'object') {
        return group.standings.map(team => this.generateTeamRow({
          rank: team.rank,
          team: team.team,
          flag: team.flag,
          played: team.played,
          won: team.won,
          drawn: team.drawn,
          lost: team.lost,
          for: team.goals_for,
          against: team.goals_against,
          goalDiff: team.goal_difference,
          points: team.points
        })).join('');
      }
    }
    
    // Fallback sample data structure based on your images
    const sampleTeams = [
      { rank: 1, team: 'Spain', flag: '🇪🇸', played: 1, won: 1, drawn: 0, lost: 0, for: 3, against: 2, goalDiff: 1, points: 3 },
      { rank: 2, team: 'Italy', flag: '🇮🇹', played: 1, won: 1, drawn: 0, lost: 0, for: 1, against: 0, goalDiff: 1, points: 3 },
      { rank: 3, team: 'Slovakia', flag: '🇸🇰', played: 1, won: 0, drawn: 0, lost: 1, for: 2, against: 3, goalDiff: -1, points: 0 },
      { rank: 4, team: 'Romania', flag: '🇷🇴', played: 1, won: 0, drawn: 0, lost: 1, for: 0, against: 1, goalDiff: -1, points: 0 }
    ];
    
    if (group.group_name === 'Group B') {
      const groupBTeams = [
        { rank: 1, team: 'Germany', flag: '🇩🇪', played: 1, won: 1, drawn: 0, lost: 0, for: 3, against: 0, goalDiff: 3, points: 3 },
        { rank: 2, team: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', played: 1, won: 1, drawn: 0, lost: 0, for: 3, against: 1, goalDiff: 2, points: 3 },
        { rank: 3, team: 'Czechia', flag: '🇨🇿', played: 1, won: 0, drawn: 0, lost: 1, for: 1, against: 3, goalDiff: -2, points: 0 },
        { rank: 4, team: 'Slovenia', flag: '🇸🇮', played: 1, won: 0, drawn: 0, lost: 1, for: 0, against: 3, goalDiff: -3, points: 0 }
      ];
      return groupBTeams.map(team => this.generateTeamRow(team)).join('');
    }
    
    return sampleTeams.map(team => this.generateTeamRow(team)).join('');
  }
  
  generateTeamRow(team) {
    return `
      <tr>
        <td class="team-rank">${team.rank}</td>
        <td class="team-name">${team.flag} ${team.team}</td>
        <td>${team.played}</td>
        <td>${team.won}</td>
        <td>${team.drawn}</td>
        <td>${team.lost}</td>
        <td>${team.for}</td>
        <td>${team.against}</td>
        <td>${team.goalDiff > 0 ? '+' + team.goalDiff : team.goalDiff}</td>
        <td><strong>${team.points}</strong></td>
      </tr>
    `;
  }
  
  renderKnockoutStage(container, knockoutData, tournamentType) {
    container.innerHTML = '';
    
    if (tournamentType === 'uefa') {
      this.renderUEFAKnockout(container, knockoutData);
    } else if (tournamentType === 'fifa') {
      this.renderFIFAKnockout(container, knockoutData);
    }
  }
  
  renderUEFAKnockout(container, knockoutData) {
    // Sample UEFA Euro U21 knockout structure
    const rounds = [
      {
        name: 'Round of 16',
        matches: [
          { team1: 'Netherlands', flag1: '🇳🇱', score1: 3, team2: 'USA', flag2: '🇺🇸', score2: 1 },
          { team1: 'Argentina', flag1: '🇦🇷', score1: 2, team2: 'Australia', flag2: '🇦🇺', score2: 1 },
          { team1: 'Japan', flag1: '🇯🇵', score1: 1, team2: 'Croatia', flag2: '🇭🇷', score2: 1 },
          { team1: 'Brazil', flag1: '🇧🇷', score1: 4, team2: 'South Korea', flag2: '🇰🇷', score2: 1 }
        ]
      },
      {
        name: 'Quarter-final',
        matches: [
          { team1: 'Netherlands', flag1: '🇳🇱', score1: 2, team2: 'Argentina', flag2: '🇦🇷', score2: 2 },
          { team1: 'Croatia', flag1: '🇭🇷', score1: 1, team2: 'Brazil', flag2: '🇧🇷', score2: 1 }
        ]
      },
      {
        name: 'Semi-final',
        matches: [
          { team1: 'Argentina', flag1: '🇦🇷', score1: 3, team2: 'France', flag2: '🇫🇷', score2: 3 },
          { team1: 'England', flag1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', score1: 1, team2: 'France', flag2: '🇫🇷', score2: 2 }
        ]
      },
      {
        name: 'Final',
        matches: [
          { team1: 'Argentina', flag1: '🇦🇷', score1: 3, team2: 'France', flag2: '🇫🇷', score2: 3, isWinner1: true },
          { team1: 'Croatia', flag1: '🇭🇷', score1: 2, team2: 'Morocco', flag2: '🇲🇦', score2: 1, isThirdPlace: true }
        ]
      }
    ];
    
    const bracketDiv = document.createElement('div');
    bracketDiv.className = 'knockout-bracket';
    
    rounds.forEach(round => {
      const roundDiv = document.createElement('div');
      roundDiv.className = 'knockout-round';
      
      roundDiv.innerHTML = `
        <div class="round-header">${round.name}</div>
        ${round.matches.map(match => this.generateKnockoutMatch(match)).join('')}
      `;
      
      bracketDiv.appendChild(roundDiv);
    });
    
    container.appendChild(bracketDiv);
  }
  
  renderFIFAKnockout(container, structureData) {
    if (!structureData || !structureData.rounds) {
      container.innerHTML = '<p>No tournament structure available</p>';
      return;
    }
    
    const bracketDiv = document.createElement('div');
    bracketDiv.className = 'knockout-bracket';
    
    structureData.rounds.forEach(round => {
      const roundDiv = document.createElement('div');
      roundDiv.className = 'knockout-round';
      
      const matches = round.matches || [];
      const matchesHtml = matches.map(match => {
        const teams = match.teams ? match.teams.split(' vs ') : ['TBD', 'TBD'];
        return this.generateKnockoutMatch({
          team1: teams[0] || 'TBD',
          team2: teams[1] || 'TBD',
          score1: match.score && match.score !== 'TBD' ? match.score.split('-')[0] : '-',
          score2: match.score && match.score !== 'TBD' ? match.score.split('-')[1] : '-'
        });
      }).join('');
      
      roundDiv.innerHTML = `
        <div class="round-header">${round.name}</div>
        ${matchesHtml || '<div class="knockout-match"><p>No matches scheduled</p></div>'}
      `;
      
      bracketDiv.appendChild(roundDiv);
    });
    
    container.appendChild(bracketDiv);
  }
  
  generateKnockoutMatch(match) {
    const isCompleted = match.score1 !== undefined && match.score1 !== '-' && match.score1 !== null;
    const isFinal = match.isWinner1 !== undefined;
    const isThirdPlace = match.isThirdPlace === true;
    
    let matchClass = 'knockout-match';
    if (isFinal && !isThirdPlace) {
      matchClass += ' final-match';
    } else if (isThirdPlace) {
      matchClass += ' third-place-match';
    }
    
    const team1Class = isCompleted && match.isWinner1 ? 'knockout-team winner' : (isCompleted && !match.isWinner1 ? 'knockout-team loser' : 'knockout-team');
    const team2Class = isCompleted && !match.isWinner1 ? 'knockout-team winner' : (isCompleted && match.isWinner1 ? 'knockout-team loser' : 'knockout-team');
    
    return `
      <div class="${matchClass}">
        <div class="knockout-teams">
          <div class="${team1Class}">
            <span>${match.flag1 || ''} ${match.team1}</span>
            <span class="team-score">${match.score1 || '-'}</span>
          </div>
          <div class="${team2Class}">
            <span>${match.flag2 || ''} ${match.team2}</span>
            <span class="team-score">${match.score2 || '-'}</span>
          </div>
        </div>
        ${match.info ? `<div class="match-info">${match.info}</div>` : ''}
      </div>
    `;
  }

  // ===============================
  // AUTO-REFRESH METHODS
  // ===============================

  setupAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    // Auto-refresh every 5 minutes for live scores, 30 minutes for others
    const refreshInterval = this.currentView === 'live' ? 5 * 60 * 1000 : 30 * 60 * 1000;
    
    this.autoRefreshInterval = setInterval(() => {
      if (this.autoRefreshEnabled && document.visibilityState === 'visible') {
        console.log('🔄 Auto-refreshing football data...');
        this.fetchFootballData(true); // Silent refresh
      }
    }, refreshInterval);
    
    console.log(`⏰ Auto-refresh setup: ${refreshInterval / 60000} minutes`);
  }

  // ===============================
  // RENDERING METHODS
  // ===============================

  renderFootballResults() {
    const container = document.getElementById('football-results');
    if (!container) return;

    container.innerHTML = '';

    if (this.footballMatches.length === 0) {
      const viewNames = {
        'fixtures': 'fixtures',
        'results': 'results',
        'live': 'live matches'
      };
      
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🎯</div>
          <div class="no-results-text">No ${viewNames[this.currentView]} found for ${this.currentTournament}</div>
          <div class="no-results-subtext">Try selecting a different tournament or view type</div>
        </div>
      `;
      return;
    }

    this.footballMatches.forEach((match, index) => {
      const matchCard = document.createElement('div');
      matchCard.className = `football-item ${this.currentView}-item`;
      matchCard.setAttribute('data-match-id', match.id);
      
      const isFavoriteMatch = this.isMatchWithFavoriteTeam(match);
      if (isFavoriteMatch) {
        matchCard.classList.add('favorite-match');
      }
      
      matchCard.innerHTML = this.generateMatchHTML(match);
      container.appendChild(matchCard);
    });
  }

  generateMatchHTML(match) {
    const matchDate = new Date(match.date);
    const formattedDate = matchDate.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    let scoreHTML = '';
    if (match.score) {
      scoreHTML = `
        <div class="match-score">
          ${match.score.home} - ${match.score.away}
          ${match.score.penalties ? ` (${match.score.penalties.home}-${match.score.penalties.away} pens)` : ''}
        </div>
      `;
    } else {
      scoreHTML = `<div class="match-vs">VS</div>`;
    }

    return `
      <div class="football-item-actions">
        <button class="favorite-btn" data-match-id="${match.id}" title="Add to favorites">
          ⭐
        </button>
        ${match.isLive ? '<div class="live-indicator">🔴 LIVE</div>' : ''}
      </div>
      
      <div class="match-teams">
        <div class="team-info">
          <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" class="team-logo"
               onerror="this.src='${this.getPlaceholderLogo()}'">
          <div class="team-name">${match.homeTeam.name}</div>
        </div>
        
        ${scoreHTML}
        
        <div class="team-info">
          <img src="${match.awayTeam.logo}" alt="${match.awayTeam.name}" class="team-logo"
               onerror="this.src='${this.getPlaceholderLogo()}'">
          <div class="team-name">${match.awayTeam.name}</div>
        </div>
      </div>
      
      <div class="match-details">
        <div class="match-date">
          📅 ${formattedDate} • ⏰ ${match.time}
          ${match.minute ? ` • ${match.minute}'` : ''}
        </div>
        
        <div class="match-venue">
          📍 ${match.venue}${match.city ? `, ${match.city}` : ''}
        </div>
        
        <div class="match-stage">${match.stage}</div>
        
        <div class="tournament-badge">${match.tournament}</div>
        
        ${match.attendance ? `<div class="match-attendance">👥 ${match.attendance.toLocaleString()}</div>` : ''}
      </div>
    `;
  }

  isMatchWithFavoriteTeam(match) {
    if (this.favoriteTeams.length === 0) return false;
    
    const homeTeamName = match.homeTeam.name.toLowerCase();
    const awayTeamName = match.awayTeam.name.toLowerCase();
    
    return this.favoriteTeams.some(team => 
      homeTeamName.includes(team.toLowerCase()) || awayTeamName.includes(team.toLowerCase())
    );
  }

  renderFavoriteTeams() {
    const container = document.getElementById('team-tags');
    if (!container) return;

    container.innerHTML = '';

    this.favoriteTeams.forEach(teamName => {
      const tag = document.createElement('div');
      tag.className = 'team-tag';
      tag.innerHTML = `
        <span>${teamName}</span>
        <button class="remove-tag" onclick="window.footballApp.removeFavoriteTeam('${teamName}')" title="Remove">
          ✕
        </button>
      `;
      container.appendChild(tag);
    });
  }

  updateResultsInfo() {
    const countElement = document.getElementById('results-count');
    const lastUpdatedElement = document.getElementById('last-updated');
    const filterInfoElement = document.getElementById('filter-info');
    
    if (countElement) {
      const poolSize = this.footballMatchesPool.length;
      const viewName = this.currentView === 'fixtures' ? 'fixtures' : (this.currentView === 'results' ? 'results' : 'live matches');
      countElement.textContent = `${this.footballMatches.length} ${viewName} shown (from ${poolSize} in pool)`;
    }
    
    if (lastUpdatedElement && this.lastFetchTime) {
      const time = new Date(this.lastFetchTime).toLocaleTimeString('en-GB');
      lastUpdatedElement.textContent = `Last updated: ${time}`;
    } else if (lastUpdatedElement) {
      lastUpdatedElement.textContent = '';
    }
    
    if (filterInfoElement) {
      const storage = this.useDatabase ? 'Database' : 'Local';
      const favoriteInfo = this.favoriteTeams.length > 0 
        ? `⭐ ${this.favoriteTeams.length} favorite teams (prioritized)`
        : '⭐ No favorite teams';
      filterInfoElement.textContent = `${favoriteInfo} • ${storage} storage`;
    }
  }

  showLoadingState(isLoading) {
    const fetchBtn = document.getElementById('fetch-btn');
    const resultsContainer = document.getElementById('football-results');
    
    if (fetchBtn) {
      if (isLoading) {
        fetchBtn.textContent = '⏳ Loading...';
        fetchBtn.disabled = true;
      } else {
        fetchBtn.innerHTML = '⚽ Get Data';
        fetchBtn.disabled = false;
      }
    }
    
    if (resultsContainer && isLoading) {
      const viewName = this.currentView === 'fixtures' ? 'fixtures' : (this.currentView === 'results' ? 'results' : 'live matches');
      resultsContainer.innerHTML = `
        <div class="no-results loading">
          <div class="no-results-icon">⏳</div>
          <div class="no-results-text">Loading ${viewName} for ${this.currentTournament}...</div>
          <div class="no-results-subtext">Please wait while we fetch the latest football data</div>
        </div>
      `;
    }
  }

  // ===============================
  // EVENT HANDLING AND UI METHODS
  // ===============================

  updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB');
    const dateString = now.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
      timeElement.textContent = `${timeString} - ${dateString}`;
    }
  }

  setupEventListeners() {
    const tournamentSelect = document.getElementById('tournament-select');
    if (tournamentSelect) {
      const handler = (e) => {
        this.currentTournament = e.target.value;
        this.footballMatches = [];
        this.footballMatchesPool = [];
        this.displayedMatchIds.clear();
        this.renderFootballResults();
        this.updateResultsInfo();
      };
      this.addManagedEventListener(tournamentSelect, 'change', handler);
    }

    const teamInput = document.getElementById('team-input');
    if (teamInput) {
      const handler = (e) => {
        if (e.key === 'Enter') {
          this.addFavoriteTeam();
        }
      };
      this.addManagedEventListener(teamInput, 'keypress', handler);
    }

    const clickHandler = (e) => {
      if (e.target.classList.contains('favorite-btn')) {
        const matchId = e.target.getAttribute('data-match-id');
        if (matchId) {
          e.preventDefault();
          e.stopPropagation();
          this.addMatchToFavorites(matchId);
        }
      }
    };
    this.addManagedEventListener(document, 'click', clickHandler);

    this.renderFavoriteTeams();
    this.renderFootballResults();
  }

  async addMatchToFavorites(matchId) {
    const match = this.footballMatches.find(m => m.id === matchId);
    if (!match) return;
    
    const homeTeam = match.homeTeam.name;
    const awayTeam = match.awayTeam.name;
    
    this.showNotification(`⭐ Match added to favorites: ${homeTeam} vs ${awayTeam}`);
    console.log(`⭐ Added match to favorites: ${homeTeam} vs ${awayTeam}`);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #00a86b 0%, #6f42c1 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0, 168, 107, 0.3);
      z-index: 1000;
      animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s forwards;
      max-width: 350px;
      word-wrap: break-word;
    `;
    
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 3000);
  }

  showDebugTab(tabName) {
    document.querySelectorAll('.debug-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    
    document.querySelectorAll('.debug-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    const panel = document.getElementById(`debug-${tabName}`);
    const tab = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (panel) panel.classList.add('active');
    if (tab) tab.classList.add('active');
  }

  // ===============================
  // DEBUG AND MONITORING METHODS
  // ===============================

  addDebugMessage(message, type = 'info') {
    const timestamp = new Date().toISOString();
    this.debugInfo.consoleMessages.unshift({
      timestamp,
      message,
      type
    });
    
    if (this.debugInfo.consoleMessages.length > 50) {
      this.debugInfo.consoleMessages = this.debugInfo.consoleMessages.slice(0, 50);
    }
    
    this.updateDebugConsole();
  }

  updateDebugConsole() {
    const element = document.getElementById('console-messages');
    if (element) {
      const messages = this.debugInfo.consoleMessages.map(msg => {
        const color = {
          'error': '#ff6b6b',
          'warning': '#feca57',
          'success': '#48ca98',
          'info': '#54a0ff'
        }[msg.type] || '#ffffff';
        
        return `<div style="color: ${color}; margin-bottom: 8px;">
          <span style="color: #888; font-size: 11px;">[${new Date(msg.timestamp).toLocaleTimeString()}]</span>
          ${msg.message}
        </div>`;
      }).join('');
      
      element.innerHTML = messages || 'No console messages captured';
    }
  }

  updateDebugRequest(requestData) {
    this.debugInfo.lastRequest = {
      timestamp: new Date().toISOString(),
      ...requestData
    };
    
    const element = document.getElementById('api-request-info');
    if (element) {
      element.innerHTML = `
        <div style="color: var(--tournament-gold); font-weight: bold;">Request URL:</div>
        ${requestData.url}
        
        <div style="margin-top: 15px; color: var(--football-blue); font-weight: bold;">Method:</div>
        ${requestData.method}
        
        <div style="margin-top: 15px; color: var(--tournament-purple); font-weight: bold;">Tournament:</div>
        ${requestData.tournament}
        
        <div style="margin-top: 15px; color: var(--football-green); font-weight: bold;">View Type:</div>
        ${requestData.type}
        
        <div style="margin-top: 15px; color: var(--tournament-purple); font-weight: bold;">Storage:</div>
        ${this.useDatabase ? 'Neon Database' : 'localStorage'}
        
        <div style="margin-top: 15px; color: var(--tournament-purple); font-weight: bold;">Timestamp:</div>
        ${requestData.timestamp}
      `;
    }
  }
  
  updateDebugResponse(responseData) {
    this.debugInfo.lastResponse = {
      timestamp: new Date().toISOString(),
      ...responseData
    };
    
    const element = document.getElementById('api-response-info');
    if (element) {
      const status = responseData.status || 'Unknown';
      const statusColor = status === 200 ? 'var(--football-green)' : 'var(--football-red)';
      
      element.innerHTML = `
        <div style="color: ${statusColor}; font-weight: bold;">Status: ${status}</div>
        
        <div style="margin-top: 15px; color: var(--tournament-gold); font-weight: bold;">Success:</div>
        ${responseData.success ? 'Yes' : 'No'}
        
        <div style="margin-top: 15px; color: var(--football-blue); font-weight: bold;">Matches Found:</div>
        ${responseData.itemCount || 0}
        
        <div style="margin-top: 15px; color: var(--tournament-purple); font-weight: bold;">Is Simulation:</div>
        ${responseData.isSimulation ? 'Yes' : 'No'}
        
        <div style="margin-top: 15px; color: var(--football-gray); font-weight: bold;">Message:</div>
        ${responseData.message || 'N/A'}
        
        <div style="margin-top: 15px; color: var(--tournament-purple); font-weight: bold;">Timestamp:</div>
        ${responseData.timestamp || new Date().toISOString()}
      `;
    }
  }

  updateDebugProcessing(steps) {
    this.debugInfo.processingSteps = steps;
    
    const element = document.getElementById('filtering-info');
    if (element) {
      let html = '';
      steps.forEach((step, index) => {
        html += `
          <div class="debug-filter-step">
            <strong>Step ${index + 1}: ${step.name}</strong>
            <div>Input: ${step.input} matches</div>
            <div>Output: ${step.output} matches</div>
            ${step.details ? `<div>Details: ${step.details}</div>` : ''}
          </div>
        `;
      });
      
      element.innerHTML = html || 'No processing steps recorded';
    }
  }

  // ===============================
  // MEMORY MANAGEMENT METHODS
  // ===============================

  setupMemoryManagement() {
    try {
      if (window.IntersectionObserver) {
        this.intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src && !img.src) {
                this.loadImageWithCache(img, img.dataset.src);
              }
            }
          });
        }, { threshold: 0.1 });
      }

      this.memoryCleanupInterval = setInterval(() => {
        this.performMemoryCleanup();
      }, 30000);

      this.addManagedEventListener(document, 'visibilitychange', () => {
        if (document.hidden) {
          this.performMemoryCleanup();
        }
      });

      this.addManagedEventListener(window, 'beforeunload', () => {
        this.cleanup();
      });
      
      console.log('📊 Memory management initialized');
    } catch (error) {
      console.warn('⚠️ Memory management setup failed:', error);
    }
  }

  addManagedInterval(callback, interval) {
    try {
      const id = setInterval(callback, interval);
      if (!this.eventListeners.has('intervals')) {
        this.eventListeners.set('intervals', []);
      }
      this.eventListeners.get('intervals').push(id);
      return id;
    } catch (error) {
      console.warn('⚠️ Failed to add managed interval:', error);
      return setInterval(callback, interval);
    }
  }

  addManagedEventListener(element, event, handler) {
    try {
      element.addEventListener(event, handler);
      const key = `${event}_${Date.now()}_${Math.random()}`;
      this.eventListeners.set(key, { element, event, handler });
    } catch (error) {
      console.warn('⚠️ Failed to add event listener:', error);
    }
  }

  loadImageWithCache(img, src) {
    if (this.imageCache.has(src)) {
      img.src = this.imageCache.get(src);
      return;
    }

    if (this.imageCache.size >= this.maxImageCache) {
      const entries = Array.from(this.imageCache.entries());
      for (let i = 0; i < 10; i++) {
        this.imageCache.delete(entries[i][0]);
      }
    }

    img.src = src;
    this.imageCache.set(src, src);
  }

  performMemoryCleanup() {
    this.logMemoryUsage();
    this.cleanupUnusedElements();
    
    if (this.footballMatchesPool.length > this.maxPoolItems) {
      this.footballMatchesPool = this.footballMatchesPool.slice(0, this.maxPoolItems);
    }
    
    if (this.debugInfo.consoleMessages.length > 50) {
      this.debugInfo.consoleMessages = this.debugInfo.consoleMessages.slice(0, 25);
    }
    
    if (window.gc) {
      window.gc();
    }
  }

  cleanupUnusedElements() {
    const results = document.getElementById('football-results');
    if (results) {
      const items = results.querySelectorAll('.football-item');
      items.forEach(item => {
        const matchId = item.getAttribute('data-match-id');
        if (matchId && !this.displayedMatchIds.has(matchId)) {
          item.remove();
        }
      });
    }
  }

  cleanup() {
    const intervals = this.eventListeners.get('intervals');
    if (intervals) {
      intervals.forEach(id => clearInterval(id));
    }

    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    this.eventListeners.forEach((listener, key) => {
      if (key !== 'intervals' && listener.element && listener.handler) {
        listener.element.removeEventListener(listener.event, listener.handler);
      }
    });

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
    }

    this.imageCache.clear();
    this.renderQueue.clear();
    this.displayedMatchIds.clear();

    console.log('🧹 App cleanup completed');
  }

  logMemoryUsage() {
    if (performance && performance.memory) {
      const memory = performance.memory;
      console.log('📊 Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB',
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) + '%'
      });
    }
  }
}

console.log('⚽ Football Tracker (Neon DB version) script loaded!');

// Initialize the app
function createFootballApp() {
  try {
    window.footballApp = new FootballApp();
    console.log('✅ Neon DB FootballApp initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to create FootballApp instance:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createFootballApp);
} else {
  createFootballApp();
}
