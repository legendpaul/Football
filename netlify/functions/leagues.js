// leagues.js - Get active football leagues from AllSportsAPI
// Fetches today's matches and extracts unique leagues

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300'
};

// Category priority ordering
const CATEGORY_ORDER = [
  'Top Leagues', 'Champions League & European', 'International',
  'England', 'Spain', 'Germany', 'Italy', 'France',
  'Netherlands', 'Portugal', 'Other Europe', 'Americas',
  'Asia', 'Africa', 'Other'
];

// League metadata lookup by name fragment
const LEAGUE_META = [
  // Top / International
  { f: 'champions league',    cat: 'Champions League & European' },
  { f: 'europa league',       cat: 'Champions League & European' },
  { f: 'conference league',   cat: 'Champions League & European' },
  { f: 'nations league',      cat: 'International' },
  { f: 'world cup',           cat: 'International' },
  { f: 'euros',               cat: 'International' },
  { f: 'euro 2024',           cat: 'International' },
  { f: 'african cup',         cat: 'Africa' },
  { f: 'copa america',        cat: 'Americas' },
  // England
  { f: 'premier league',      cat: 'England' },
  { f: 'championship',        cat: 'England' },
  { f: 'league one',          cat: 'England' },
  { f: 'league two',          cat: 'England' },
  { f: 'fa cup',              cat: 'England' },
  { f: 'efl cup',             cat: 'England' },
  { f: 'carabao',             cat: 'England' },
  // Spain
  { f: 'laliga',              cat: 'Spain' },
  { f: 'la liga',             cat: 'Spain' },
  { f: 'segunda',             cat: 'Spain' },
  { f: 'copa del rey',        cat: 'Spain' },
  // Germany
  { f: 'bundesliga',          cat: 'Germany' },
  { f: 'dfb pokal',           cat: 'Germany' },
  // Italy
  { f: 'serie a',             cat: 'Italy' },
  { f: 'serie b',             cat: 'Italy' },
  { f: 'coppa italia',        cat: 'Italy' },
  // France
  { f: 'ligue 1',             cat: 'France' },
  { f: 'ligue 2',             cat: 'France' },
  { f: 'coupe de france',     cat: 'France' },
  // Netherlands
  { f: 'eredivisie',          cat: 'Netherlands' },
  { f: 'eerste divisie',      cat: 'Netherlands' },
  // Portugal
  { f: 'primeira liga',       cat: 'Portugal' },
  { f: 'liga portugal',       cat: 'Portugal' },
  // Americas
  { f: 'mls',                 cat: 'Americas' },
  { f: 'brasileirao',         cat: 'Americas' },
  { f: 'serie a brazil',      cat: 'Americas' },
  { f: 'liga mx',             cat: 'Americas' },
  { f: 'argentinian',         cat: 'Americas' },
  { f: 'libertadores',        cat: 'Americas' },
  // Asia
  { f: 'j league',            cat: 'Asia' },
  { f: 'k league',            cat: 'Asia' },
  { f: 'chinese super',       cat: 'Asia' },
  { f: 'a-league',            cat: 'Asia' },
  { f: 'afc',                 cat: 'Asia' },
];

function getCategory(name) {
  const lower = (name || '').toLowerCase();
  for (const { f, cat } of LEAGUE_META) {
    if (lower.includes(f)) return cat;
  }
  return 'Other Europe';
}

function today()    { return new Date().toISOString().split('T')[0]; }
function tomorrow() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };

  const apiKey = process.env.ALLSPORTS_API_KEY;
  if (!apiKey) {
    return { statusCode: 200, headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'ALLSPORTS_API_KEY not set', leagues: [], grouped: {} }) };
  }

  try {
    const url = `https://apiv2.allsportsapi.com/football/?met=Fixtures&APIkey=${apiKey}&from=${today()}&to=${tomorrow()}&timezone=Europe/London`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`AllSportsAPI ${res.status}`);
    const json = await res.json();
    const matches = json.result || [];

    console.log(`⚽ leagues.js: ${matches.length} matches today`);

    if (matches.length === 0) {
      return { statusCode: 200, headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, leagues: [], grouped: {}, total: 0,
          note: 'No matches today yet' }) };
    }

    // Build unique league list with live counts
    const leagueMap = new Map();
    matches.forEach(m => {
      const key = m.league_key;
      if (!key) return;
      if (leagueMap.has(key)) {
        leagueMap.get(key).matchCount++;
        if (m.event_live === '1') leagueMap.get(key).liveCount++;
      } else {
        leagueMap.set(key, {
          id:         String(key),
          name:       m.league_name || 'Unknown',
          country:    m.country_name || '',
          category:   getCategory(m.league_name),
          logo:       m.league_logo || null,
          active:     true,
          matchCount: 1,
          liveCount:  m.event_live === '1' ? 1 : 0
        });
      }
    });

    const leagues = [...leagueMap.values()]
      .sort((a, b) => (b.liveCount - a.liveCount) || (b.matchCount - a.matchCount));

    // Group
    const grouped = {};
    leagues.forEach(l => {
      if (!grouped[l.category]) grouped[l.category] = [];
      grouped[l.category].push(l);
    });

    return { statusCode: 200, headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true, leagues, grouped,
        total: leagues.length, fromApi: true,
        timestamp: new Date().toISOString()
      })
    };

  } catch (err) {
    console.error('leagues.js error:', err);
    return { statusCode: 500, headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: err.message, leagues: [], grouped: {} }) };
  }
};
