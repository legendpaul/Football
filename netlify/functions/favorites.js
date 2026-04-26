// favorites.js - Favourite teams stored in Neon PostgreSQL (production) or localStorage (local)
// Self-contained: no external db module needed

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

function getPool() {
  const { Pool } = require('pg');
  const conn = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!conn) throw new Error('No DATABASE_URL or NEON_DATABASE_URL set');
  return new Pool({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 3000
  });
}

async function ensureTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS football_favourites (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      team_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, team_name)
    )
  `);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const conn = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!conn) {
    return { statusCode: 200, headers: CORS,
      body: JSON.stringify({ success: false, error: 'No database configured', favourites: [] }) };
  }

  const pool = getPool();
  try {
    await ensureTable(pool);
    const userId = (event.queryStringParameters || {}).userId || 'default';

    // GET
    if (event.httpMethod === 'GET') {
      const res = await pool.query(
        'SELECT team_name FROM football_favourites WHERE user_id=$1 ORDER BY created_at DESC', [userId]
      );
      return { statusCode: 200, headers: CORS,
        body: JSON.stringify({ success: true, favourites: res.rows.map(r => r.team_name) }) };
    }

    // POST — add team
    if (event.httpMethod === 'POST') {
      const { teamName } = JSON.parse(event.body || '{}');
      if (!teamName) return { statusCode: 400, headers: CORS, body: JSON.stringify({ success: false, error: 'teamName required' }) };
      await pool.query(
        'INSERT INTO football_favourites (user_id, team_name) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, teamName]
      );
      const res = await pool.query(
        'SELECT team_name FROM football_favourites WHERE user_id=$1 ORDER BY created_at DESC', [userId]
      );
      return { statusCode: 200, headers: CORS,
        body: JSON.stringify({ success: true, favourites: res.rows.map(r => r.team_name) }) };
    }

    // DELETE — remove team or clear all
    if (event.httpMethod === 'DELETE') {
      const params = event.queryStringParameters || {};
      if (params.clearAll === 'true') {
        await pool.query('DELETE FROM football_favourites WHERE user_id=$1', [userId]);
      } else if (params.teamName) {
        await pool.query('DELETE FROM football_favourites WHERE user_id=$1 AND team_name=$2', [userId, params.teamName]);
      }
      const res = await pool.query(
        'SELECT team_name FROM football_favourites WHERE user_id=$1 ORDER BY created_at DESC', [userId]
      );
      return { statusCode: 200, headers: CORS,
        body: JSON.stringify({ success: true, favourites: res.rows.map(r => r.team_name) }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('favorites error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: err.message, favourites: [] }) };
  } finally {
    await pool.end().catch(() => {});
  }
};
