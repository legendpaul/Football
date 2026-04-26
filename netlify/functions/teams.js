// Netlify function for managing teams
// GET: Retrieve all teams
// POST: Add new team
// PUT: Update team
// DELETE: Remove team

const db = require('../../database/connection');

// Set CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      case 'PUT':
        return await handlePut(event);
      case 'DELETE':
        return await handleDelete(event);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

  } catch (error) {
    console.error('❌ Teams function error:', error);
    
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

// GET: Retrieve all teams or a specific team
async function handleGet(event) {
  try {
    const params = event.queryStringParameters || {};
    const { id, country, league } = params;
    
    console.log('⚽ Fetching teams from database...');
    let teams = await db.getTeams();
    
    // Filter by country if specified
    if (country) {
      teams = teams.filter(team => 
        team.country && team.country.toLowerCase().includes(country.toLowerCase())
      );
    }
    
    // Filter by league if specified
    if (league) {
      teams = teams.filter(team => 
        team.league && team.league.toLowerCase().includes(league.toLowerCase())
      );
    }
    
    // Get specific team if ID provided
    if (id) {
      teams = teams.filter(team => team.id === id);
      
      if (teams.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Team not found'
          })
        };
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          teams: teams,
          count: teams.length,
          lastUpdated: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    throw new Error(`Failed to fetch teams: ${error.message}`);
  }
}

// POST: Add new team
async function handlePost(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, country, league, logo_url, founded_year, stadium } = body;
    
    if (!name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Team name is required'
        })
      };
    }

    console.log(`⚽ Adding team "${name}" to database...`);
    
    const teamData = {
      name: name.trim(),
      country: country?.trim() || null,
      league: league?.trim() || null,
      logo_url: logo_url?.trim() || null,
      founded_year: founded_year ? parseInt(founded_year) : null,
      stadium: stadium?.trim() || null
    };
    
    const newTeam = await db.addTeam(teamData);
    const updatedTeams = await db.getTeams();
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          team: newTeam,
          teams: updatedTeams,
          lastUpdated: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    if (error.message.includes('unique constraint')) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Team with this name already exists'
        })
      };
    }
    throw new Error(`Failed to add team: ${error.message}`);
  }
}

// PUT: Update existing team
async function handlePut(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { id, name, country, league, logo_url, founded_year, stadium } = body;
    
    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Team ID is required for update'
        })
      };
    }

    if (!name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Team name is required'
        })
      };
    }

    console.log(`⚽ Updating team ${id} in database...`);
    
    const teamData = {
      name: name.trim(),
      country: country?.trim() || null,
      league: league?.trim() || null,
      logo_url: logo_url?.trim() || null,
      founded_year: founded_year ? parseInt(founded_year) : null,
      stadium: stadium?.trim() || null
    };
    
    const updatedTeam = await db.updateTeam(id, teamData);
    
    if (!updatedTeam) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Team not found'
        })
      };
    }

    const updatedTeams = await db.getTeams();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          team: updatedTeam,
          teams: updatedTeams,
          lastUpdated: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    throw new Error(`Failed to update team: ${error.message}`);
  }
}

// DELETE: Remove team
async function handleDelete(event) {
  try {
    const params = event.queryStringParameters || {};
    const { id } = params;
    
    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Team ID parameter is required'
        })
      };
    }

    console.log(`🗑️ Removing team ${id} from database...`);
    
    // Note: We need to implement removeTeam in the database connection
    try {
      await db.query('DELETE FROM teams WHERE id = $1', [id]);
      
      const updatedTeams = await db.getTeams();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            teams: updatedTeams,
            lastUpdated: new Date().toISOString(),
            removedTeamId: id
          }
        })
      };
    } catch (deleteError) {
      if (deleteError.message.includes('foreign key')) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Cannot delete team: it has associated fixtures or results'
          })
        };
      }
      throw deleteError;
    }
    
  } catch (error) {
    throw new Error(`Failed to delete team: ${error.message}`);
  }
}
