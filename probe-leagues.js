// probe-leagues.js - Find league keys for specific leagues
const fs = require('fs');
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length && !line.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
});

const KEY = process.env.ALLSPORTS_API_KEY;
const BASE = 'https://apiv2.allsportsapi.com/football/';

function dateStr(offset) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

async function get(params) {
  const url = new URL(BASE);
  url.searchParams.set('APIkey', KEY);
  for (const [k,v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  const json = await res.json();
  return json.result || [];
}

async function findLeagues(searchTerms) {
  // Search over a wider date range to find leagues
  const matches = await get({ met: 'Fixtures', from: dateStr(-7), to: dateStr(60) });
  console.log(`Total matches in range: ${matches.length}\n`);

  const leagueMap = new Map();
  matches.forEach(m => {
    const key = m.league_key;
    if (!leagueMap.has(key)) {
      leagueMap.set(key, { key, name: m.league_name, country: m.country_name });
    }
  });

  const leagues = [...leagueMap.values()];
  console.log(`Unique leagues found: ${leagues.length}\n`);

  // Find matching leagues
  for (const term of searchTerms) {
    const found = leagues.filter(l =>
      (l.name || '').toLowerCase().includes(term.toLowerCase()) ||
      (l.country || '').toLowerCase().includes(term.toLowerCase())
    );
    console.log(`\n"${term}":`);
    if (found.length) {
      found.forEach(l => console.log(`  key:${l.key}  "${l.name}" (${l.country})`));
    } else {
      console.log('  ❌ Not found');
    }
  }
}

(async () => {
  await findLeagues([
    'premier league', 'championship', 'league one', 'league two', 'fa cup', 'efl',
    'la liga', 'primera', 'bundesliga', 'scottish premiership', 'scotland',
    'serie a', 'ligue 1', 'eredivisie', 'champions league', 'europa league',
    'world cup', 'fifa'
  ]);
})().catch(console.error);
