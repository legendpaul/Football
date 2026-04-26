// football-search.js - AllSportsAPI football data
// Fetches by specific leagueId OR all active leagues
// Uses native fetch (Node 18+)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache'
};

const API_BASE = 'https://apiv2.allsportsapi.com/football/';

// Known league keys from AllSportsAPI docs
// These are fetched by leagueId parameter regardless of live status
const PINNED_LEAGUES = [
  // England
  { key: '148',  name: 'Premier League',        country: 'England',     category: 'England' },
  { key: '149',  name: 'Championship',           country: 'England',     category: 'England' },
  { key: '150',  name: 'League One',             country: 'England',     category: 'England' },
  { key: '151',  name: 'League Two',             country: 'England',     category: 'England' },
  { key: '8640', name: 'Carabao Cup',            country: 'England',     category: 'England' },
  { key: '152',  name: 'FA Cup',                 country: 'England',     category: 'England' },
  // Scotland
  { key: '179',  name: 'Scottish Premiership',   country: 'Scotland',    category: 'Scotland' },
  { key: '180',  name: 'Scottish Championship',  country: 'Scotland',    category: 'Scotland' },
  // Spain
  { key: '302',  name: 'La Liga',                country: 'Spain',       category: 'Spain' },
  { key: '303',  name: 'La Liga 2',              country: 'Spain',       category: 'Spain' },
  { key: '304',  name: 'Copa del Rey',           country: 'Spain',       category: 'Spain' },
  // Germany
  { key: '195',  name: 'Bundesliga',             country: 'Germany',     category: 'Germany' },
  { key: '196',  name: '2. Bundesliga',          country: 'Germany',     category: 'Germany' },
  { key: '197',  name: 'DFB Pokal',              country: 'Germany',     category: 'Germany' },
  // Italy
  { key: '207',  name: 'Serie A',                country: 'Italy',       category: 'Italy' },
  { key: '208',  name: 'Serie B',                country: 'Italy',       category: 'Italy' },
  { key: '209',  name: 'Coppa Italia',           country: 'Italy',       category: 'Italy' },
  // France
  { key: '176',  name: 'Ligue 1',               country: 'France',      category: 'France' },
  { key: '177',  name: 'Ligue 2',               country: 'France',      category: 'France' },
  // Europe
  { key: '3',    name: 'UEFA Champions League', country: 'Europe',      category: 'European' },
  { key: '4',    name: 'UEFA Europa League',    country: 'Europe',      category: 'European' },
  { key: '5',    name: 'UEFA Conference League',country: 'Europe',      category: 'European' },
  // Netherlands
  { key: '244',  name: 'Eredivisie',            country: 'Netherlands', category: 'Other Europe' },
  // Portugal
  { key: '308',  name: 'Primeira Liga',         country: 'Portugal',    category: 'Other Europe' },
];

function today()     { return new Date().toISOString().split('T')[0]; }
function yesterday() { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; }
function tomorrow()  { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }

async function allSportsGet(params, apiKey) {
  const url = new URL(API_BASE);
  url.searchParams.set('APIkey', apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('timezone', 'Europe/London');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`AllSportsAPI ${res.status}`);
  const json = await res.json();
  if (json.success === 0 && json.result === null) return [];
  return json.result || [];
}

function normaliseStatus(m) {
  if (m.event_live === '1' || m.event_live === 1) return 'live';
  const s = (m.event_status || '').toLowerCase();
  if (['finished','ft','aet','pen','after et'].includes(s)) return 'finished';
  if (m.event_final_result && m.event_final_result !== '-') return 'finished';
  return 'upcoming';
}

function transformMatch(m) {
  const status = normaliseStatus(m);
  const score  = m.event_final_result && m.event_final_result !== '-' ? m.event_final_result
               : m.event_live === '1' ? (m.event_live_data?.score || '') : '';
  const htScore = m.event_halftime_result && m.event_halftime_result !== '-' ? m.event_halftime_result : null;
  const minute  = m.event_live === '1' ? (m.event_live_data?.minute || null) : null;

  let ukTime = m.event_time || 'TBD';
  let dateStr = m.event_date || today();

  return {
    id:           String(m.event_key || `${Date.now()}-${Math.random()}`),
    home_team:    m.event_home_team || 'Home',
    away_team:    m.event_away_team || 'Away',
    teams:        `${m.event_home_team} vs ${m.event_away_team}`,
    score, ht_score: htScore, minute, status,
    uk_time:      ukTime,
    date:         dateStr,
    league_name:  m.league_name  || '',
    league_key:   String(m.league_key || ''),
    country_name: m.country_name || '',
    home_logo:    m.home_team_logo || null,
    away_logo:    m.away_team_logo || null,
    stage:        m.league_round  || '',
    venue:        m.event_venue   || null,
    attendance:   m.event_attendance || null,
    event_status: m.event_status  || '',
    last_updated: new Date().toISOString()
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const { leagueKey, from, to, health } = event.queryStringParameters || {};

  if (health === 'true') return {
    statusCode: 200, headers: CORS,
    body: JSON.stringify({ success: true, healthy: !!process.env.ALLSPORTS_API_KEY })
  };

  const apiKey = process.env.ALLSPORTS_API_KEY;
  if (!apiKey) return {
    statusCode: 500, headers: CORS,
    body: JSON.stringify({ success: false, error: 'ALLSPORTS_API_KEY not configured' })
  };

  try {
    const fromDate = from || yesterday();
    const toDate   = to   || tomorrow();

    let rawMatches = [];

    if (leagueKey && leagueKey !== 'all') {
      // Fetch specific league by ID
      console.log(`⚽ Fetching league ${leagueKey} from ${fromDate} to ${toDate}`);
      rawMatches = await allSportsGet({ met: 'Fixtures', leagueId: leagueKey, from: fromDate, to: toDate }, apiKey);
    } else {
      // Fetch all pinned leagues in parallel (batch of concurrent requests)
      console.log(`⚽ Fetching all ${PINNED_LEAGUES.length} pinned leagues`);

      // Also get livescore for real-time data
      const [liveResult, ...leagueResults] = await Promise.allSettled([
        allSportsGet({ met: 'Livescore' }, apiKey),
        ...PINNED_LEAGUES.map(l =>
          allSportsGet({ met: 'Fixtures', leagueId: l.key, from: fromDate, to: toDate }, apiKey)
        )
      ]);

      const live = liveResult.status === 'fulfilled' ? liveResult.value : [];
      const leagueMatches = leagueResults.flatMap(r => r.status === 'fulfilled' ? r.value : []);

      // Merge live + fixtures, deduplicate by event_key
      const seen = new Set();
      // Live scores take priority
      live.forEach(m => { if (m.event_key) seen.add(String(m.event_key)); rawMatches.push(m); });
      leagueMatches.forEach(m => {
        if (!m.event_key || seen.has(String(m.event_key))) return;
        seen.add(String(m.event_key));
        rawMatches.push(m);
      });
    }

    console.log(`📊 Total raw: ${rawMatches.length}`);

    const allMatches = rawMatches.map(transformMatch);
    const live     = allMatches.filter(m => m.status === 'live');
    const fixtures = allMatches.filter(m => m.status === 'upcoming');
    const results  = allMatches.filter(m => m.status === 'finished');

    const leaguesInData = [...new Map(
      allMatches.map(m => [m.league_key, { key: m.league_key, name: m.league_name, country: m.country_name }])
    ).values()].filter(l => l.name).sort((a,b) => a.name.localeCompare(b.name));

    console.log(`✅ ${live.length} live, ${fixtures.length} fixtures, ${results.length} results`);

    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        success: true, data: allMatches,
        live, fixtures, results,
        totalMatches: allMatches.length,
        liveMatches: live.length,
        leaguesInData,
        source: 'AllSportsAPI',
        leagueKey: leagueKey || 'all',
        timestamp: new Date().toISOString()
      })
    };

  } catch (err) {
    console.error('football-search error:', err);
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ success: false, error: err.message, data: [], live: [], fixtures: [], results: [] })
    };
  }
};
