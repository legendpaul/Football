// Netlify function for analytics and monitoring
// Tracks app usage, performance metrics, and errors for Football Tracker
// GET: Retrieve analytics data
// POST: Log events and metrics

const db = require('../../database/connection');

// Set CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const method = event.httpMethod;
    
    switch (method) {
      case 'GET':
        return await handleGet(event);
      case 'POST':
        return await handlePost(event);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

  } catch (error) {
    console.error('❌ Analytics function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

// GET: Retrieve analytics data
async function handleGet(event) {
  try {
    const params = event.queryStringParameters || {};
    const { timeframe = '24h', metric = 'overview' } = params;
    
    console.log(`📊 Getting analytics: metric=${metric}, timeframe=${timeframe}`);
    
    // Calculate time range
    const timeRanges = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    };
    
    const hoursBack = timeRanges[timeframe] || 24;
    const since = new Date(Date.now() - (hoursBack * 60 * 60 * 1000)).toISOString();
    
    let analytics = {};
    
    try {
      // Try to get analytics from database
      switch (metric) {
        case 'overview':
          analytics = await getOverviewAnalytics(since);
          break;
          
        case 'usage':
          analytics = await getUsageAnalytics(since);
          break;
          
        case 'errors':
          analytics = await getErrorAnalytics(since);
          break;
          
        case 'performance':
          analytics = await getPerformanceAnalytics(since);
          break;
          
        default:
          analytics = await getOverviewAnalytics(since);
          break;
      }
      
    } catch (dbError) {
      console.warn('⚠️ Database analytics not available:', dbError.message);
      
      // Return basic analytics without database
      analytics = {
        message: 'Analytics database not configured',
        basicStats: await getBasicStats(),
        timeframe,
        since
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analytics,
        timeframe,
        since,
        generated: new Date().toISOString()
      })
    };

  } catch (error) {
    throw new Error(`Failed to get analytics: ${error.message}`);
  }
}

// POST: Log analytics events
async function handlePost(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { 
      event: eventType, 
      category, 
      data = {}, 
      timestamp = new Date().toISOString(),
      userAgent = event.headers['user-agent'] || 'unknown',
      ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown'
    } = body;
    
    if (!eventType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Event type is required'
        })
      };
    }
    
    console.log(`📝 Logging analytics event: ${eventType} (${category})`);
    
    // Prepare analytics data
    const analyticsData = {
      event: eventType,
      category: category || 'general',
      data: JSON.stringify(data),
      timestamp,
      userAgent,
      ip: hashIP(ip), // Hash IP for privacy
      sessionId: data.sessionId || generateSessionId()
    };
    
    try {
      // Try to store in database
      await logEventToDatabase(analyticsData);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Event logged successfully',
          eventId: generateEventId()
        })
      };
      
    } catch (dbError) {
      console.warn('⚠️ Database logging failed:', dbError.message);
      
      // Log to console as fallback
      console.log('📊 Analytics Event:', analyticsData);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Event logged to console (database unavailable)',
          warning: 'Database logging failed'
        })
      };
    }

  } catch (error) {
    throw new Error(`Failed to log analytics event: ${error.message}`);
  }
}

// Analytics helper functions
async function getOverviewAnalytics(since) {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(CASE WHEN event = 'tournament_search' THEN 1 END) as tournament_searches,
        COUNT(CASE WHEN event = 'fixture_view' THEN 1 END) as fixture_views,
        COUNT(CASE WHEN event = 'result_view' THEN 1 END) as result_views,
        COUNT(CASE WHEN event = 'team_favorite' THEN 1 END) as team_favorites,
        COUNT(CASE WHEN event = 'live_score_view' THEN 1 END) as live_score_views,
        COUNT(CASE WHEN event = 'error' THEN 1 END) as errors
      FROM analytics_events 
      WHERE timestamp >= $1
    `, [since]);
    
    const stats = result.rows[0] || {};
    
    return {
      totalEvents: parseInt(stats.total_events) || 0,
      uniqueSessions: parseInt(stats.unique_sessions) || 0,
      tournamentSearches: parseInt(stats.tournament_searches) || 0,
      fixtureViews: parseInt(stats.fixture_views) || 0,
      resultViews: parseInt(stats.result_views) || 0,
      teamFavorites: parseInt(stats.team_favorites) || 0,
      liveScoreViews: parseInt(stats.live_score_views) || 0,
      errors: parseInt(stats.errors) || 0
    };
    
  } catch (error) {
    throw new Error(`Failed to get overview analytics: ${error.message}`);
  }
}

async function getUsageAnalytics(since) {
  try {
    const result = await db.query(`
      SELECT 
        event,
        category,
        COUNT(*) as count,
        COUNT(DISTINCT session_id) as unique_users
      FROM analytics_events 
      WHERE timestamp >= $1
      GROUP BY event, category
      ORDER BY count DESC
    `, [since]);
    
    return {
      eventBreakdown: result.rows || []
    };
    
  } catch (error) {
    throw new Error(`Failed to get usage analytics: ${error.message}`);
  }
}

async function getErrorAnalytics(since) {
  try {
    const result = await db.query(`
      SELECT 
        data->>'error' as error_message,
        data->>'stack' as error_stack,
        COUNT(*) as count,
        MAX(timestamp) as last_occurrence
      FROM analytics_events 
      WHERE timestamp >= $1 AND event = 'error'
      GROUP BY data->>'error', data->>'stack'
      ORDER BY count DESC
      LIMIT 20
    `, [since]);
    
    return {
      topErrors: result.rows || []
    };
    
  } catch (error) {
    throw new Error(`Failed to get error analytics: ${error.message}`);
  }
}

async function getPerformanceAnalytics(since) {
  try {
    const result = await db.query(`
      SELECT 
        AVG((data->>'loadTime')::numeric) as avg_load_time,
        AVG((data->>'searchTime')::numeric) as avg_search_time,
        AVG((data->>'memoryUsage')::numeric) as avg_memory_usage,
        COUNT(*) as performance_events
      FROM analytics_events 
      WHERE timestamp >= $1 AND event = 'performance'
    `, [since]);
    
    const stats = result.rows[0] || {};
    
    return {
      avgLoadTime: parseFloat(stats.avg_load_time) || 0,
      avgSearchTime: parseFloat(stats.avg_search_time) || 0,
      avgMemoryUsage: parseFloat(stats.avg_memory_usage) || 0,
      performanceEvents: parseInt(stats.performance_events) || 0
    };
    
  } catch (error) {
    throw new Error(`Failed to get performance analytics: ${error.message}`);
  }
}

async function getBasicStats() {
  try {
    const [teams, tournaments, fixtures, results] = await Promise.all([
      db.getTeams().catch(() => []),
      db.getTournaments().catch(() => []),
      db.getFixtures().catch(() => []),
      db.getResults().catch(() => [])
    ]);
    
    return {
      teamsCount: teams.length,
      tournamentsCount: tournaments.length,
      fixturesCount: fixtures.length,
      resultsCount: results.length
    };
    
  } catch (error) {
    return {
      teamsCount: 0,
      tournamentsCount: 0,
      fixturesCount: 0,
      resultsCount: 0,
      error: 'Database not available'
    };
  }
}

async function logEventToDatabase(analyticsData) {
  try {
    // Create analytics table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        data JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_hash VARCHAR(64),
        session_id VARCHAR(100)
      );
    `);
    
    // Create indexes if they don't exist
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
    `);
    
    // Insert the event
    await db.query(`
      INSERT INTO analytics_events (event, category, data, timestamp, user_agent, ip_hash, session_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      analyticsData.event,
      analyticsData.category,
      analyticsData.data,
      analyticsData.timestamp,
      analyticsData.userAgent,
      analyticsData.ip,
      analyticsData.sessionId
    ]);
    
  } catch (error) {
    throw new Error(`Failed to log event to database: ${error.message}`);
  }
}

// Utility functions
function hashIP(ip) {
  // Simple hash for privacy (not cryptographically secure, but good enough for analytics)
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip + 'football_tracker_salt').digest('hex').substring(0, 16);
}

function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateEventId() {
  return 'evt_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
