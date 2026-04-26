// probe-league-ids.js - Get ALL leagues from AllSportsAPI
const fs = require('fs');
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length && !line.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
});

const KEY = process.env.ALLSPORTS_API_KEY;
const BASE = 'https://apiv2.allsportsapi.com/football/';

async function get(params) {
  const url = new URL(BASE);
  url.searchParams.set('APIkey', KEY);
  for (const [k,v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  const json = await res.json();
  return json;
}

(async () => {
  // Get all leagues
  console.log('Fetching all leagues...');
  const r = await get({ met: 'Leagues' });
  console.log('success:', r.success, 'count:', r.result?.length);
  
  const leagues = r.result || [];
  const targets = ['england','scotland','spain','germany','france','italy','netherlands',
                   'portugal','premier','championship','league one','league two','fa cup',
                   'bundesliga','la liga','primera','scottish prem','ligue','serie a',
                   'eredivisie','champions','europa','world cup','fifa','carabao'];
  
  const matched = leagues.filter(l => {
    const name = (l.league_name||'').toLowerCase();
    const country = (l.country_name||'').toLowerCase();
    return targets.some(t => name.includes(t) || country.includes(t));
  });

  console.log(`\nMatched ${matched.length} leagues:`);
  matched.sort((a,b) => (a.country_name||'').localeCompare(b.country_name||'')).forEach(l => {
    console.log(`  key:${l.league_key}  "${l.league_name}" (${l.country_name})`);
  });

  // Also test fetching fixtures for Premier League key 148
  console.log('\n\nTesting Premier League (key 148) fixtures...');
  const d = new Date(); d.setDate(d.getDate()-7);
  const from = d.toISOString().split('T')[0];
  const to = new Date(Date.now() + 7*86400000).toISOString().split('T')[0];
  const prem = await get({ met: 'Fixtures', leagueId: '148', from, to });
  console.log('PL result count:', prem.result?.length || 0);
  if (prem.result?.length) {
    console.log('Sample:', prem.result[0].event_home_team, 'vs', prem.result[0].event_away_team, prem.result[0].event_date);
  }
})().catch(console.error);
