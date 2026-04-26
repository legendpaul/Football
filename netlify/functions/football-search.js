// football-search.js - AllSportsAPI football/soccer data
// Uses native fetch (Node 18+) - no dependencies needed

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache'
};

const API_BASE = 'https://apiv2.allsportsapi.com/football/';

function today()     { return new Date().toISOString().split('T')[0]; }
function yesterday() { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; }
function tomorrow()  { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }

async function allSportsGet(params, apiKey) {
  const url = new URL(API_BASE);
  url.searchParams.set('APIkey', apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('timezone', 'Europe/London');

  console.log(`⚽ GET ${url.toString().replace(apiKey, '***')}`);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`AllSportsAPI ${res.status}`);
  const json = await res.json();
  if (json.success === 0 && json.result === null) return []; // empty but valid
  return json.result || [];
}

function normaliseStatus(match) {
  const live = match.event_live === '1' || match.event_live === 1;
  if (live) return 'live';
  const s = (match.event_status || '').toLowerCase();
  if (s === 'finished' || s === 'ft' || s === 'aet' || s === 'pen') return 'finished';
  if (match.event_final_result && match.event_final_result !== '-' && match.event_live !== '1') return 'finished';
  return 'upcoming';
}

function transformMatch(m) {
  const home = m.event_home_team || 'Home';
  const away = m.event_away_team || 'Away';
  const status = normaliseStatus(m);

  // Score
  const score = m.event_final_result && m.event_final_result !== '-'
    ? m.event_final_result
    : (m.event_live === '1' ? (m.event_live_data?.score || '0 - 0') : '');

  // Half-time score
  const htScore = m.event_halftime_result && m.event_halftime_result !== '-'
    ? m.event_halftime_result : null;

  // Match minute
  const minute = m.event_live === '1' ? (m.event_live_data?.minute || null) : null;

  // Time
  const ukTime = m.event_time || 'TBD';
  const dateStr = m.event_date || today();

  // Tournament
  const leagueName  = m.league_name   || '';
  const countryName = m.country_name  || '';

  // Home/Away logos
  const homeLogo = m.home_team_logo || null;
  const awayLogo = m.away_team_logo || null;

  return {
    id:           String(m.event_key || `${Date.now()}-${Math.random()}`),
    home_team:    home,
    away_team:    away,
    teams:        `${home} vs ${away}`,
    score,
    ht_score:     htScore,
    minute,
    status,
    uk_time:      ukTime,
    date:         dateStr,
    league_name:  leagueName,
    league_key:   String(m.league_key || ''),
    country_name: countryName,
    home_logo:    homeLogo,
    away_logo:    awayLogo,
    stage:        m.league_round || 'TBD',
    event_status: m.event_status || '',
    last_updated: new Date().toISOString()
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };

  const params = event.queryStringParameters || {};
  const { leagueKey, from, to, health } = params;

  if (health === 'true') {
    return { statusCode: 200, headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, healthy: !!process.env.ALLSPORTS_API_KEY }) };
  }

  const apiKey = process.env.ALLSPORTS_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'ALLSPORTS_API_KEY not configured' }) };
  }

  try {
    let rawLive = [], rawToday = [], rawYesterday = [];

    if (from && to) {
      // Specific date range (used by date picker)
      const dateResult = await allSportsGet({ met: 'Fixtures', from, to }, apiKey);
      rawToday = dateResult;
    } else {
      const [liveRes, todayRes, yesterdayRes] = await Promise.allSettled([
        allSportsGet({ met: 'Livescore' }, apiKey),
        allSportsGet({ met: 'Fixtures', from: today(),     to: tomorrow()   }, apiKey),
        allSportsGet({ met: 'Fixtures', from: yesterday(), to: today()      }, apiKey),
      ]);
      rawLive      = liveRes.status      === 'fulfilled' ? liveRes.value      : [];
      rawToday     = todayRes.status     === 'fulfilled' ? todayRes.value     : [];
      rawYesterday = yesterdayRes.status === 'fulfilled' ? yesterdayRes.value : [];
    }

    console.log(`📊 Raw: ${rawLive.length} live, ${rawToday.length} today, ${rawYesterday.length} yesterday`);

    // Deduplicate
    const seen = new Set();
    let allMatches = [...rawLive, ...rawToday, ...rawYesterday]
      .filter(m => {
        const k = String(m.event_key);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map(transformMatch);

    // Filter by league if requested
    if (leagueKey && leagueKey !== 'all') {
      allMatches = allMatches.filter(m => String(m.league_key) === String(leagueKey));
    }

    const live     = allMatches.filter(m => m.status === 'live');
    const fixtures = allMatches.filter(m => m.status === 'upcoming');
    const results  = allMatches.filter(m => m.status === 'finished');

    const leaguesInData = [...new Map(allMatches.map(m => [m.league_key, { key: m.league_key, name: m.league_name, country: m.country_name }])).values()]
      .filter(l => l.name)
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`✅ ${live.length} live, ${fixtures.length} fixtures, ${results.length} results`);
    console.log(`🏆 Leagues: ${leaguesInData.slice(0,8).map(l=>l.name).join(', ')}`);

    return { statusCode: 200, headers: CORS_HEADERS,
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
    return { statusCode: 500, headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: err.message, data: [], live: [], fixtures: [], results: [] }) };
  }
};
