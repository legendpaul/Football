// Netlify function for database health check and initialization
// GET: Check database connection and stats

const db = require('../../database/connection');

// Set CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET method
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('🏥 Performing database health check...');
    
    // Perform health check
    const healthResult = await db.healthCheck();
    
    if (!healthResult.success) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Database unhealthy',
          details: healthResult.error
        })
      };
    }

    // Get database statistics
    const [teams, tournaments, fixtures, results] = await Promise.all([
      db.getTeams().catch(() => []),
      db.getTournaments().catch(() => []),
      db.getFixtures().catch(() => []),
      db.getResults().catch(() => [])
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        database: {
          status: 'healthy',
          timestamp: healthResult.timestamp,
          version: healthResult.dbVersion,
          poolStats: healthResult.poolStats
        },
        data: {
          teamsCount: teams.length,
          tournamentsCount: tournaments.length,
          fixturesCount: fixtures.length,
          resultsCount: results.length
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabase: !!process.env.DATABASE_URL || !!process.env.NEON_DATABASE_URL
        }
      })
    };

  } catch (error) {
    console.error('❌ Database health check error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        database: {
          status: 'error'
        }
      })
    };
  }
};
