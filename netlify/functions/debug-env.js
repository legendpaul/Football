// Netlify function to debug environment and database configuration
// GET: Shows all environment info for debugging

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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('🔍 Debugging environment configuration...');
    
    // Check environment variables (without exposing sensitive data)
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL || !!process.env.NEON_DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
      neonUrlLength: process.env.NEON_DATABASE_URL ? process.env.NEON_DATABASE_URL.length : 0,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'NOT_SET',
      neonUrlPrefix: process.env.NEON_DATABASE_URL ? process.env.NEON_DATABASE_URL.substring(0, 15) + '...' : 'NOT_SET',
      // Football API environment checks
      hasFootballAPI: !!process.env.FOOTBALL_API_KEY || !!process.env.SPORTSDATA_API_KEY || !!process.env.APIFOOTBALL_KEY,
      footballProvider: process.env.FOOTBALL_PROVIDER || 'primary',
      hasPrimaryKey: !!process.env.FOOTBALL_API_KEY,
      hasSecondaryKey: !!process.env.SPORTSDATA_API_KEY,
      hasFreeKey: !!process.env.APIFOOTBALL_KEY
    };

    // Test database connection
    let dbTest = { status: 'not_tested' };
    try {
      const db = require('../../database/connection');
      dbTest = await db.healthCheck();
      dbTest.status = 'tested';
    } catch (dbError) {
      dbTest = {
        status: 'error',
        error: dbError.message,
        stack: dbError.stack.split('\n').slice(0, 3).join('\n')
      };
    }

    // Function deployment check
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      region: process.env.AWS_REGION || 'unknown',
      functionName: context.functionName,
      functionVersion: context.functionVersion
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        environment: envCheck,
        database: dbTest,
        deployment: deploymentInfo,
        recommendations: [
          envCheck.hasDatabase ? 
            '✅ Database URL found' : 
            '❌ Missing DATABASE_URL or NEON_DATABASE_URL environment variable',
          dbTest.success ? 
            '✅ Database connection successful' : 
            '❌ Database connection failed - check your Neon database settings',
          envCheck.hasFootballAPI ?
            '✅ Football API credentials found' :
            '⚠️ No Football API credentials found - app will use simulation data',
          'Check Netlify environment variables in Site Settings → Environment Variables',
          'For Football API: Set FOOTBALL_API_KEY, SPORTSDATA_API_KEY, or APIFOOTBALL_KEY',
          'Set FOOTBALL_PROVIDER to "primary", "secondary", or "free" based on your API'
        ]
      })
    };

  } catch (error) {
    console.error('❌ Debug function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      })
    };
  }
};
