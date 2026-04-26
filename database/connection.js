// Database connection utility for Neon PostgreSQL
// Handles connection pooling and query execution for Football Tracker

const { Pool } = require('pg');

// Create connection pool
let pool = null;

function createPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });

  console.log('🗄️ Database connection pool created');
  return pool;
}

// Execute query with error handling
async function query(text, params = []) {
  const client = createPool();
  
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    console.log('📊 Query executed:', { duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Database query error:', { query: text, error: error.message });
    throw error;
  }
}

// Transaction wrapper
async function transaction(callback) {
  const client = await createPool().connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Specific database operations for the Football Tracker

// Teams Operations
async function getTeams() {
  try {
    const result = await query(
      'SELECT * FROM teams ORDER BY name ASC'
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    throw new Error(`Failed to fetch teams: ${error.message}`);
  }
}

async function addTeam(teamData) {
  try {
    const { name, country, league, logo_url } = teamData;
    const result = await query(
      'INSERT INTO teams (name, country, league, logo_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, country, league, logo_url]
    );
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error adding team:', error);
    throw new Error(`Failed to add team: ${error.message}`);
  }
}

async function updateTeam(teamId, teamData) {
  try {
    const { name, country, league, logo_url } = teamData;
    const result = await query(
      'UPDATE teams SET name = $1, country = $2, league = $3, logo_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, country, league, logo_url, teamId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error updating team:', error);
    throw new Error(`Failed to update team: ${error.message}`);
  }
}

// Fixtures Operations
async function getFixtures(tournamentId = null) {
  try {
    let queryText = 'SELECT f.*, ht.name as home_team_name, at.name as away_team_name FROM fixtures f LEFT JOIN teams ht ON f.home_team_id = ht.id LEFT JOIN teams at ON f.away_team_id = at.id';
    let params = [];
    
    if (tournamentId) {
      queryText += ' WHERE f.tournament_id = $1';
      params = [tournamentId];
    }
    
    queryText += ' ORDER BY f.match_date ASC';
    
    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching fixtures:', error);
    throw new Error(`Failed to fetch fixtures: ${error.message}`);
  }
}

async function addFixture(fixtureData) {
  try {
    const { tournament_id, home_team_id, away_team_id, match_date, venue, stage } = fixtureData;
    const result = await query(
      'INSERT INTO fixtures (tournament_id, home_team_id, away_team_id, match_date, venue, stage) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [tournament_id, home_team_id, away_team_id, match_date, venue, stage]
    );
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error adding fixture:', error);
    throw new Error(`Failed to add fixture: ${error.message}`);
  }
}

// Results Operations
async function getResults(tournamentId = null) {
  try {
    let queryText = 'SELECT r.*, ht.name as home_team_name, at.name as away_team_name FROM results r LEFT JOIN teams ht ON r.home_team_id = ht.id LEFT JOIN teams at ON r.away_team_id = at.id';
    let params = [];
    
    if (tournamentId) {
      queryText += ' WHERE r.tournament_id = $1';
      params = [tournamentId];
    }
    
    queryText += ' ORDER BY r.match_date DESC';
    
    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching results:', error);
    throw new Error(`Failed to fetch results: ${error.message}`);
  }
}

async function addResult(resultData) {
  try {
    const { tournament_id, home_team_id, away_team_id, home_score, away_score, match_date, venue, stage } = resultData;
    const result = await query(
      'INSERT INTO results (tournament_id, home_team_id, away_team_id, home_score, away_score, match_date, venue, stage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [tournament_id, home_team_id, away_team_id, home_score, away_score, match_date, venue, stage]
    );
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error adding result:', error);
    throw new Error(`Failed to add result: ${error.message}`);
  }
}

// Tournaments Operations
async function getTournaments() {
  try {
    const result = await query(
      'SELECT * FROM tournaments ORDER BY start_date DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching tournaments:', error);
    throw new Error(`Failed to fetch tournaments: ${error.message}`);
  }
}

async function addTournament(tournamentData) {
  try {
    const { name, year, start_date, end_date, location, type } = tournamentData;
    const result = await query(
      'INSERT INTO tournaments (name, year, start_date, end_date, location, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, year, start_date, end_date, location, type]
    );
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error adding tournament:', error);
    throw new Error(`Failed to add tournament: ${error.message}`);
  }
}

// User Settings Operations
async function getUserSetting(key) {
  try {
    const result = await query(
      'SELECT setting_value FROM user_settings WHERE setting_key = $1',
      [key]
    );
    return result.rows.length > 0 ? result.rows[0].setting_value : null;
  } catch (error) {
    console.error('❌ Error fetching user setting:', error);
    throw new Error(`Failed to fetch user setting: ${error.message}`);
  }
}

async function setUserSetting(key, value) {
  try {
    const result = await query(
      `INSERT INTO user_settings (setting_key, setting_value) 
       VALUES ($1, $2) 
       ON CONFLICT (setting_key) 
       DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [key, JSON.stringify(value)]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('❌ Error setting user setting:', error);
    throw new Error(`Failed to set user setting: ${error.message}`);
  }
}

// Health check
async function healthCheck() {
  try {
    const result = await query('SELECT NOW() as timestamp, version() as db_version');
    return {
      success: true,
      timestamp: result.rows[0].timestamp,
      dbVersion: result.rows[0].db_version,
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Initialize database (create tables if they don't exist)
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database schema...');
    
    // Read schema file and execute
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await query(schema);
      console.log('✅ Database schema initialized');
    } else {
      console.warn('⚠️ Schema file not found, skipping initialization');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Cleanup pool on exit
process.on('SIGINT', () => {
  if (pool) {
    pool.end();
  }
});

process.on('SIGTERM', () => {
  if (pool) {
    pool.end();
  }
});

module.exports = {
  query,
  transaction,
  // Teams
  getTeams,
  addTeam,
  updateTeam,
  // Fixtures
  getFixtures,
  addFixture,
  // Results
  getResults,
  addResult,
  // Tournaments
  getTournaments,
  addTournament,
  // User settings
  getUserSetting,
  setUserSetting,
  // Utilities
  healthCheck,
  initializeDatabase
};
