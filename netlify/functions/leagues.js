// leagues.js - Always returns pinned leagues + any live leagues found today
// Pinned leagues always appear so users can select them even when no games are live

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300'
};

// Pinned leagues - ALWAYS shown in selector
// league_key matches AllSportsAPI leagueId parameter
const PINNED = [
  // ── England ──
  { id:'148',  name:'Premier League',         country:'England',     category:'England',  pinned:true },
  { id:'149',  name:'Championship',           country:'England',     category:'England',  pinned:true },
  { id:'150',  name:'League One',             country:'England',     category:'England',  pinned:true },
  { id:'151',  name:'League Two',             country:'England',     category:'England',  pinned:true },
  { id:'152',  name:'FA Cup',                 country:'England',     category:'England',  pinned:true },
  { id:'8640', name:'Carabao Cup',            country:'England',     category:'England',  pinned:true },
  // ── Scotland ──
  { id:'179',  name:'Scottish Premiership',   country:'Scotland',    category:'Scotland', pinned:true },
  { id:'180',  name:'Scottish Championship',  country:'Scotland',    category:'Scotland', pinned:true },
  // ── Spain ──
  { id:'302',  name:'La Liga',                country:'Spain',       category:'Spain',    pinned:true },
  { id:'303',  name:'La Liga 2',              country:'Spain',       category:'Spain',    pinned:true },
  { id:'304',  name:'Copa del Rey',           country:'Spain',       category:'Spain',    pinned:true },
  // ── Germany ──
  { id:'195',  name:'Bundesliga',             country:'Germany',     category:'Germany',  pinned:true },
  { id:'196',  name:'2. Bundesliga',          country:'Germany',     category:'Germany',  pinned:true },
  { id:'197',  name:'DFB Pokal',              country:'Germany',     category:'Germany',  pinned:true },
  // ── Italy ──
  { id:'207',  name:'Serie A',                country:'Italy',       category:'Italy',    pinned:true },
  { id:'208',  name:'Serie B',                country:'Italy',       category:'Italy',    pinned:true },
  // ── France ──
  { id:'176',  name:'Ligue 1',                country:'France',      category:'France',   pinned:true },
  { id:'177',  name:'Ligue 2',                country:'France',      category:'France',   pinned:true },
  // ── European ──
  { id:'3',    name:'UEFA Champions League',  country:'Europe',      category:'European', pinned:true },
  { id:'4',    name:'UEFA Europa League',     country:'Europe',      category:'European', pinned:true },
  { id:'5',    name:'UEFA Conference League', country:'Europe',      category:'European', pinned:true },
  // ── Other ──
  { id:'244',  name:'Eredivisie',             country:'Netherlands', category:'Other Europe', pinned:true },
  { id:'308',  name:'Primeira Liga',          country:'Portugal',    category:'Other Europe', pinned:true },
  // ── World Cup (static) ──
  { id:'wc2026', name:'FIFA World Cup 2026',  country:'International', category:'World Cup', pinned:true, static:true },
];

function today()   { return new Date().toISOString().split('T')[0]; }
function tomorrow(){ const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const apiKey = process.env.ALLSPORTS_API_KEY;

  // Build base catalogue
  let leagues = PINNED.map(l => ({ ...l, active: false, liveCount: 0, matchCount: 0 }));

  // Try to enrich with live counts from API
  if (apiKey) {
    try {
      const url = `https://apiv2.allsportsapi.com/football/?met=Livescore&APIkey=${apiKey}&timezone=Europe/London`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const live = json.result || [];

        // Count live matches per league key
        const liveCounts = {};
        live.forEach(m => {
          const k = String(m.league_key);
          liveCounts[k] = (liveCounts[k] || 0) + 1;
        });

        // Mark pinned leagues that have live matches
        leagues = leagues.map(l => ({
          ...l,
          active:    !!liveCounts[l.id],
          liveCount: liveCounts[l.id] || 0
        }));

        // Add any live leagues not already in the pinned list
        const pinnedIds = new Set(leagues.map(l => l.id));
        const extraLeagues = new Map();
        live.forEach(m => {
          const k = String(m.league_key);
          if (!pinnedIds.has(k) && !extraLeagues.has(k)) {
            extraLeagues.set(k, {
              id: k, name: m.league_name || 'Unknown', country: m.country_name || '',
              category: 'Other', pinned: false, active: true,
              liveCount: liveCounts[k] || 0, matchCount: 0
            });
          }
        });
        leagues = [...leagues, ...extraLeagues.values()];
      }
    } catch (e) {
      console.warn('Could not fetch live data for league enrichment:', e.message);
    }
  }

  // Group by category
  const ORDER = ['England','Scotland','European','Spain','Germany','Italy','France','Other Europe','World Cup','Other'];
  const grouped = {};
  leagues.forEach(l => {
    if (!grouped[l.category]) grouped[l.category] = [];
    grouped[l.category].push(l);
  });

  return {
    statusCode: 200, headers: CORS,
    body: JSON.stringify({
      success: true,
      leagues,
      grouped,
      total: leagues.length,
      timestamp: new Date().toISOString()
    })
  };
};
