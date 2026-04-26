// Netlify function for database initialization and migrations
// GET: Check database status and apply migrations if needed
// POST: Force run migrations (admin endpoint)

const db = require('../../database/connection');
const MigrationRunner = require('../../database/migrate');

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
    console.error('❌ Database init function error:', error);
    
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

// GET: Check database status and auto-migrate if needed
async function handleGet(event) {
  try {
    console.log('🔍 Checking database status and migrations...');
    
    const migrationRunner = new MigrationRunner();
    
    // Perform health check
    const healthResult = await db.healthCheck();
    
    if (!healthResult.success) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed',
          details: healthResult.error
        })
      };
    }

    // Check migration status
    const migrationFiles = migrationRunner.getMigrationFiles();
    const appliedMigrations = await migrationRunner.getAppliedMigrations();
    const pendingMigrations = await migrationRunner.getPendingMigrations();
    
    let migrationsApplied = false;
    
    // Auto-apply pending migrations if any
    if (pendingMigrations.length > 0) {
      console.log(`🔄 Auto-applying ${pendingMigrations.length} pending migrations...`);
      
      try {
        await migrationRunner.applyPendingMigrations();
        migrationsApplied = true;
        console.log('✅ Auto-migrations completed successfully');
      } catch (migrationError) {
        console.error('❌ Auto-migration failed:', migrationError);
        
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Database migration failed',
            details: migrationError.message,
            database: {
              status: 'healthy',
              migrationsStatus: 'failed'
            }
          })
        };
      }
    }

    // Get final migration status
    const finalAppliedMigrations = await migrationRunner.getAppliedMigrations();
    const finalPendingMigrations = await migrationRunner.getPendingMigrations();

    // Get data statistics
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
          version: healthResult.dbVersion,
          timestamp: healthResult.timestamp,
          poolStats: healthResult.poolStats
        },
        migrations: {
          total: migrationFiles.length,
          applied: finalAppliedMigrations.length,
          pending: finalPendingMigrations.length,
          appliedList: finalAppliedMigrations,
          pendingList: finalPendingMigrations,
          autoApplied: migrationsApplied
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
    throw new Error(`Failed to check database status: ${error.message}`);
  }
}

// POST: Force run migrations (admin endpoint)
async function handlePost(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { action, force } = body;
    
    console.log(`📥 Migration POST request: action=${action}, force=${force}`);
    
    const migrationRunner = new MigrationRunner();
    
    // Perform health check first
    const healthResult = await db.healthCheck();
    
    if (!healthResult.success) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed',
          details: healthResult.error
        })
      };
    }

    let result = {};
    
    switch (action) {
      case 'migrate':
        console.log('🚀 Force applying migrations...');
        
        const pendingBefore = await migrationRunner.getPendingMigrations();
        
        if (pendingBefore.length === 0 && !force) {
          result = {
            action: 'migrate',
            message: 'No pending migrations',
            migrationsApplied: 0
          };
        } else {
          await migrationRunner.applyPendingMigrations();
          
          result = {
            action: 'migrate',
            message: 'Migrations applied successfully',
            migrationsApplied: pendingBefore.length
          };
        }
        break;
        
      case 'status':
        const migrationFiles = migrationRunner.getMigrationFiles();
        const appliedMigrations = await migrationRunner.getAppliedMigrations();
        const pendingMigrations = await migrationRunner.getPendingMigrations();
        
        result = {
          action: 'status',
          total: migrationFiles.length,
          applied: appliedMigrations.length,
          pending: pendingMigrations.length,
          appliedList: appliedMigrations,
          pendingList: pendingMigrations
        };
        break;
        
      case 'health':
        const health = await migrationRunner.healthCheck();
        
        result = {
          action: 'health',
          healthy: health,
          database: healthResult
        };
        break;
        
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid action. Supported actions: migrate, status, health'
          })
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    throw new Error(`Failed to execute migration action: ${error.message}`);
  }
}
