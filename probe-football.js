// probe-football.js - Check what football leagues AllSportsAPI has
// Run with: node probe-football.js
const fs = require('fs');
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length && !line.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
});

const KEY = process.env.ALLSPORTS_API_KEY;
if (!KEY || KEY === 'your_key_here') { console.error('No ALLSPORTS_API_KEY in .env'); process.exit(1); }

const BASE = 'https://apiv2.allsportsapi.com/football/';

async function get(params) {
  const url = new URL(BASE);
  url.searchParams.set('APIkey', KEY);
  for (const [k,v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('timezone', 'Europe/London');
  const res = await fetch(url.toString());
  const json = await res.json();
  return json.result || [];
}

function dateStr(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

(async () => {
  console.log('API Key:', KEY.slice(0,8) + '...\n');

  const ranges = [
    [dateStr(0),   dateStr(7),   'Next 7 days'],
    [dateStr(7),   dateStr(30),  'Days 7-30'],
    ['2026-06-11', '2026-06-20', 'World Cup opening week (Jun 11-20)'],
    ['2026-06-20', '2026-07-13', 'World Cup rest of group stage'],
  ];

  for (const [from, to, label] of ranges) {
    const matches = await get({ met: 'Fixtures', from, to });
    const wc = matches.filter(m =>
      (m.league_name || '').toLowerCase().includes('world cup') ||
      (m.league_name || '').toLowerCase().includes('fifa') ||
      (m.country_name || '').toLowerCase().includes('world')
    );
    console.log(`\n${label} (${from} → ${to}): ${matches.length} total`);
    if (wc.length) {
      console.log(`  ✅ World Cup: ${wc.length} matches`);
      const s = wc[0];
      console.log(`  Sample: ${s.event_home_team} vs ${s.event_away_team} | ${s.event_date}`);
      console.log(`  League: "${s.league_name}" | Key: ${s.league_key} | Country: ${s.country_name}`);
    } else {
      console.log(`  ❌ No World Cup matches`);
      const leagues = [...new Set(matches.map(m => `"${m.league_name}" [${m.league_key}] (${m.country_name})`))].slice(0,6);
      if (leagues.length) console.log('  Sample leagues:\n   ', leagues.join('\n    '));
    }
  }

  // Live now
  console.log('\n=== Live now ===');
  const live = await get({ met: 'Livescore' });
  console.log(`${live.length} live matches`);
  if (live.length) {
    const leagues = [...new Set(live.map(m => `"${m.league_name}" (${m.country_name})`))];
    console.log('Leagues:', leagues.slice(0,10).join(', '));
  }

})().catch(console.error);
