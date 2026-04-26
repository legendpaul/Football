// worldcup.js - FIFA World Cup 2026 - Full fixture list including knockout bracket rules
// Sources: Wikipedia, ESPN, FIFA official schedule

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=3600'
};

// ─────────────── GROUP STAGE ───────────────
const GROUP_FIXTURES = [
  // Group A
  { match:1,  date:'2026-06-11',time:'20:00',home:'Mexico',            away:'South Africa',        group:'A',venue:'Mexico City' },
  { match:2,  date:'2026-06-12',time:'03:00',home:'South Korea',       away:'Czech Republic',      group:'A',venue:'Zapopan' },
  { match:19, date:'2026-06-18',time:'17:00',home:'Czech Republic',    away:'South Africa',        group:'A',venue:'Atlanta' },
  { match:20, date:'2026-06-19',time:'02:00',home:'Mexico',            away:'South Korea',         group:'A',venue:'Zapopan' },
  { match:37, date:'2026-06-25',time:'02:00',home:'Czech Republic',    away:'Mexico',              group:'A',venue:'Mexico City' },
  { match:38, date:'2026-06-25',time:'02:00',home:'South Africa',      away:'South Korea',         group:'A',venue:'Guadalajara' },
  // Group B
  { match:3,  date:'2026-06-12',time:'20:00',home:'Canada',            away:'Bosnia-Herzegovina',  group:'B',venue:'Toronto' },
  { match:4,  date:'2026-06-13',time:'20:00',home:'Qatar',             away:'Switzerland',         group:'B',venue:'Santa Clara' },
  { match:21, date:'2026-06-18',time:'20:00',home:'Switzerland',       away:'Bosnia-Herzegovina',  group:'B',venue:'Inglewood' },
  { match:22, date:'2026-06-18',time:'23:00',home:'Canada',            away:'Qatar',               group:'B',venue:'Vancouver' },
  { match:39, date:'2026-06-24',time:'20:00',home:'Bosnia-Herzegovina',away:'Qatar',               group:'B',venue:'Seattle' },
  { match:40, date:'2026-06-24',time:'20:00',home:'Switzerland',       away:'Canada',              group:'B',venue:'Vancouver' },
  // Group C
  { match:5,  date:'2026-06-13',time:'23:00',home:'Brazil',            away:'Morocco',             group:'C',venue:'East Rutherford' },
  { match:6,  date:'2026-06-14',time:'02:00',home:'Haiti',             away:'Scotland',            group:'C',venue:'Foxborough' },
  { match:23, date:'2026-06-19',time:'23:00',home:'Scotland',          away:'Morocco',             group:'C',venue:'Foxborough' },
  { match:24, date:'2026-06-20',time:'01:30',home:'Brazil',            away:'Haiti',               group:'C',venue:'Philadelphia' },
  { match:41, date:'2026-06-24',time:'23:00',home:'Morocco',           away:'Haiti',               group:'C',venue:'Atlanta' },
  { match:42, date:'2026-06-24',time:'23:00',home:'Scotland',          away:'Brazil',              group:'C',venue:'Miami Gardens' },
  // Group D
  { match:7,  date:'2026-06-13',time:'02:00',home:'United States',     away:'Paraguay',            group:'D',venue:'Inglewood' },
  { match:8,  date:'2026-06-14',time:'05:00',home:'Australia',         away:'Turkey',              group:'D',venue:'Vancouver' },
  { match:25, date:'2026-06-19',time:'20:00',home:'United States',     away:'Australia',           group:'D',venue:'Seattle' },
  { match:26, date:'2026-06-20',time:'04:00',home:'Turkey',            away:'Paraguay',            group:'D',venue:'Santa Clara' },
  { match:43, date:'2026-06-26',time:'03:00',home:'Paraguay',          away:'Australia',           group:'D',venue:'Santa Clara' },
  { match:44, date:'2026-06-26',time:'03:00',home:'Turkey',            away:'United States',       group:'D',venue:'Seattle' },
  // Group E
  { match:9,  date:'2026-06-14',time:'18:00',home:'Germany',           away:'Curaçao',             group:'E',venue:'Houston' },
  { match:10, date:'2026-06-15',time:'00:00',home:'Ivory Coast',       away:'Ecuador',             group:'E',venue:'Philadelphia' },
  { match:27, date:'2026-06-20',time:'21:00',home:'Germany',           away:'Ivory Coast',         group:'E',venue:'Toronto' },
  { match:28, date:'2026-06-21',time:'01:00',home:'Ecuador',           away:'Curaçao',             group:'E',venue:'Kansas City' },
  { match:45, date:'2026-06-25',time:'21:00',home:'Curaçao',           away:'Ivory Coast',         group:'E',venue:'Philadelphia' },
  { match:46, date:'2026-06-25',time:'21:00',home:'Ecuador',           away:'Germany',             group:'E',venue:'East Rutherford' },
  // Group F
  { match:11, date:'2026-06-14',time:'21:00',home:'Netherlands',       away:'Japan',               group:'F',venue:'Arlington' },
  { match:12, date:'2026-06-15',time:'03:00',home:'Sweden',            away:'Tunisia',             group:'F',venue:'Guadalajara' },
  { match:29, date:'2026-06-20',time:'18:00',home:'Netherlands',       away:'Sweden',              group:'F',venue:'Houston' },
  { match:30, date:'2026-06-21',time:'05:00',home:'Tunisia',           away:'Japan',               group:'F',venue:'Guadalajara' },
  { match:47, date:'2026-06-26',time:'00:00',home:'Japan',             away:'Sweden',              group:'F',venue:'Guadalajara' },
  { match:48, date:'2026-06-26',time:'00:00',home:'Tunisia',           away:'Netherlands',         group:'F',venue:'Guadalajara' },
  // Group G
  { match:13, date:'2026-06-15',time:'20:00',home:'Belgium',           away:'Egypt',               group:'G',venue:'Seattle' },
  { match:14, date:'2026-06-16',time:'02:00',home:'Iran',              away:'New Zealand',         group:'G',venue:'Inglewood' },
  { match:31, date:'2026-06-21',time:'20:00',home:'Belgium',           away:'Iran',               group:'G',venue:'Inglewood' },
  { match:32, date:'2026-06-22',time:'02:00',home:'New Zealand',       away:'Egypt',               group:'G',venue:'Vancouver' },
  { match:49, date:'2026-06-27',time:'04:00',home:'Egypt',             away:'Iran',               group:'G',venue:'Arlington' },
  { match:50, date:'2026-06-27',time:'04:00',home:'New Zealand',       away:'Belgium',             group:'G',venue:'Arlington' },
  // Group H
  { match:15, date:'2026-06-15',time:'17:00',home:'Spain',             away:'Cape Verde',          group:'H',venue:'Atlanta' },
  { match:16, date:'2026-06-15',time:'23:00',home:'Saudi Arabia',      away:'Uruguay',             group:'H',venue:'Miami Gardens' },
  { match:33, date:'2026-06-21',time:'17:00',home:'Spain',             away:'Saudi Arabia',        group:'H',venue:'Atlanta' },
  { match:34, date:'2026-06-21',time:'23:00',home:'Uruguay',           away:'Cape Verde',          group:'H',venue:'Miami Gardens' },
  { match:51, date:'2026-06-27',time:'01:00',home:'Cape Verde',        away:'Saudi Arabia',        group:'H',venue:'Miami Gardens' },
  { match:52, date:'2026-06-27',time:'01:00',home:'Uruguay',           away:'Spain',               group:'H',venue:'Miami Gardens' },
  // Group I
  { match:17, date:'2026-06-16',time:'20:00',home:'France',            away:'Senegal',             group:'I',venue:'East Rutherford' },
  { match:18, date:'2026-06-16',time:'23:00',home:'Iraq',              away:'Norway',              group:'I',venue:'Foxborough' },
  { match:35, date:'2026-06-22',time:'22:00',home:'France',            away:'Iraq',               group:'I',venue:'Philadelphia' },
  { match:36, date:'2026-06-23',time:'01:00',home:'Norway',            away:'Senegal',             group:'I',venue:'East Rutherford' },
  { match:53, date:'2026-06-26',time:'20:00',home:'Norway',            away:'France',              group:'I',venue:'East Rutherford' },
  { match:54, date:'2026-06-26',time:'20:00',home:'Senegal',           away:'Iraq',               group:'I',venue:'East Rutherford' },
  // Group J
  { match:19, date:'2026-06-17',time:'02:00',home:'Argentina',         away:'Algeria',             group:'J',venue:'Kansas City' },
  { match:20, date:'2026-06-17',time:'05:00',home:'Austria',           away:'Jordan',              group:'J',venue:'Santa Clara' },
  { match:55, date:'2026-06-22',time:'18:00',home:'Argentina',         away:'Austria',             group:'J',venue:'Arlington' },
  { match:56, date:'2026-06-23',time:'04:00',home:'Jordan',            away:'Algeria',             group:'J',venue:'Santa Clara' },
  { match:57, date:'2026-06-28',time:'03:00',home:'Algeria',           away:'Austria',             group:'J',venue:'Santa Clara' },
  { match:58, date:'2026-06-28',time:'03:00',home:'Jordan',            away:'Argentina',           group:'J',venue:'Kansas City' },
  // Group K
  { match:21, date:'2026-06-17',time:'18:00',home:'Portugal',          away:'Congo DR',            group:'K',venue:'Houston' },
  { match:22, date:'2026-06-18',time:'03:00',home:'Uzbekistan',        away:'Colombia',            group:'K',venue:'Mexico City' },
  { match:59, date:'2026-06-23',time:'18:00',home:'Portugal',          away:'Uzbekistan',          group:'K',venue:'Houston' },
  { match:60, date:'2026-06-24',time:'03:00',home:'Colombia',          away:'Congo DR',            group:'K',venue:'Zapopan' },
  { match:61, date:'2026-06-28',time:'00:30',home:'Colombia',          away:'Portugal',            group:'K',venue:'Zapopan' },
  { match:62, date:'2026-06-28',time:'00:30',home:'Congo DR',          away:'Uzbekistan',          group:'K',venue:'Zapopan' },
  // Group L
  { match:23, date:'2026-06-17',time:'21:00',home:'England',           away:'Croatia',             group:'L',venue:'Arlington' },
  { match:24, date:'2026-06-18',time:'00:00',home:'Ghana',             away:'Panama',              group:'L',venue:'Toronto' },
  { match:63, date:'2026-06-23',time:'21:00',home:'England',           away:'Ghana',               group:'L',venue:'Foxborough' },
  { match:64, date:'2026-06-24',time:'00:00',home:'Panama',            away:'Croatia',             group:'L',venue:'Toronto' },
  { match:65, date:'2026-06-27',time:'22:00',home:'Croatia',           away:'Ghana',               group:'L',venue:'Toronto' },
  { match:66, date:'2026-06-27',time:'22:00',home:'Panama',            away:'England',             group:'L',venue:'Toronto' },
];

// ─────────────── KNOCKOUT BRACKET ───────────────
// Official FIFA match numbers 73-104
// Source: Wikipedia "2026 FIFA World Cup knockout stage"

const KNOCKOUT_FIXTURES = [
  // ── ROUND OF 32 (June 28 – July 3) ──
  // Match 73: Runner-up A vs Runner-up B
  { match:73,  round:'Round of 32', date:'2026-06-28',time:'20:00', home:'Runner-up Group A', away:'Runner-up Group B',        venue:'Atlanta',        rule:'2A v 2B' },
  // Match 74: Winner E vs Best 3rd (A/B/C/D/F)
  { match:74,  round:'Round of 32', date:'2026-06-28',time:'23:30', home:'Winner Group E',    away:'Best 3rd (A/B/C/D/F)',     venue:'Foxborough',     rule:'1E v 3rd(ABCDF)' },
  // Match 75: Winner F vs Runner-up C
  { match:75,  round:'Round of 32', date:'2026-06-29',time:'18:00', home:'Winner Group F',    away:'Runner-up Group C',        venue:'Guadalajara',    rule:'1F v 2C' },
  // Match 76: Winner C vs Runner-up F
  { match:76,  round:'Round of 32', date:'2026-06-29',time:'21:30', home:'Winner Group C',    away:'Runner-up Group F',        venue:'Houston',        rule:'1C v 2F' },
  // Match 77: Winner I vs Best 3rd (C/D/F/G/H)
  { match:77,  round:'Round of 32', date:'2026-06-30',time:'02:00', home:'Winner Group I',    away:'Best 3rd (C/D/F/G/H)',     venue:'East Rutherford',rule:'1I v 3rd(CDFGH)' },
  // Match 78: Runner-up E vs Runner-up I
  { match:78,  round:'Round of 32', date:'2026-06-30',time:'18:00', home:'Runner-up Group E', away:'Runner-up Group I',        venue:'Arlington',      rule:'2E v 2I' },
  // Match 79: Winner A vs Best 3rd (C/E/F/H/I)
  { match:79,  round:'Round of 32', date:'2026-06-30',time:'22:00', home:'Winner Group A',    away:'Best 3rd (C/E/F/H/I)',     venue:'Mexico City',    rule:'1A v 3rd(CEFHI)' },
  // Match 80: Winner L vs Best 3rd (E/H/I/J/K)
  { match:80,  round:'Round of 32', date:'2026-07-01',time:'17:00', home:'Winner Group L',    away:'Best 3rd (E/H/I/J/K)',     venue:'Atlanta',        rule:'1L v 3rd(EHIJK)' },
  // Match 81: Winner D vs Best 3rd (B/E/F/I/J)
  { match:81,  round:'Round of 32', date:'2026-07-01',time:'21:00', home:'Winner Group D',    away:'Best 3rd (B/E/F/I/J)',     venue:'Santa Clara',    rule:'1D v 3rd(BEFIJ)' },
  // Match 82: Winner G vs Best 3rd (A/E/H/I/J)
  { match:82,  round:'Round of 32', date:'2026-07-02',time:'17:00', home:'Winner Group G',    away:'Best 3rd (A/E/H/I/J)',     venue:'Seattle',        rule:'1G v 3rd(AEHIJ)' },
  // Match 83: Runner-up K vs Runner-up L
  { match:83,  round:'Round of 32', date:'2026-07-02',time:'20:00', home:'Runner-up Group K', away:'Runner-up Group L',        venue:'Arlington',      rule:'2K v 2L' },
  // Match 84: Winner H vs Runner-up J
  { match:84,  round:'Round of 32', date:'2026-07-02',time:'23:30', home:'Winner Group H',    away:'Runner-up Group J',        venue:'Inglewood',      rule:'1H v 2J' },
  // Match 85: Winner B vs Best 3rd (E/F/G/I/J)
  { match:85,  round:'Round of 32', date:'2026-07-03',time:'17:00', home:'Winner Group B',    away:'Best 3rd (E/F/G/I/J)',     venue:'Guadalajara',    rule:'1B v 3rd(EFGIJ)' },
  // Match 86: Winner J vs Runner-up H
  { match:86,  round:'Round of 32', date:'2026-07-03',time:'20:00', home:'Winner Group J',    away:'Runner-up Group H',        venue:'Miami Gardens',  rule:'1J v 2H' },
  // Match 87: Winner K vs Best 3rd (D/E/I/J/L)
  { match:87,  round:'Round of 32', date:'2026-07-03',time:'23:00', home:'Winner Group K',    away:'Best 3rd (D/E/I/J/L)',     venue:'Kansas City',    rule:'1K v 3rd(DEIJL)' },
  // Match 88: Runner-up D vs Runner-up G
  { match:88,  round:'Round of 32', date:'2026-07-04',time:'02:00', home:'Runner-up Group D', away:'Runner-up Group G',        venue:'Arlington',      rule:'2D v 2G' },

  // ── ROUND OF 16 (July 4–7) ──
  // Winner of M73 vs Winner of M76
  { match:89,  round:'Round of 16', date:'2026-07-04',time:'18:00', home:'Winner Match 73',   away:'Winner Match 76',          venue:'Houston',        rule:'W73 v W76' },
  // Winner of M74 vs Winner of M75
  { match:90,  round:'Round of 16', date:'2026-07-04',time:'22:00', home:'Winner Match 74',   away:'Winner Match 75',          venue:'Philadelphia',   rule:'W74 v W75' },
  // Winner of M77 vs Winner of M80
  { match:91,  round:'Round of 16', date:'2026-07-05',time:'21:00', home:'Winner Match 77',   away:'Winner Match 80',          venue:'East Rutherford',rule:'W77 v W80' },
  // Winner of M78 vs Winner of M79
  { match:92,  round:'Round of 16', date:'2026-07-06',time:'01:00', home:'Winner Match 78',   away:'Winner Match 79',          venue:'Mexico City',    rule:'W78 v W79' },
  // Winner of M81 vs Winner of M84
  { match:93,  round:'Round of 16', date:'2026-07-06',time:'20:00', home:'Winner Match 81',   away:'Winner Match 84',          venue:'Arlington',      rule:'W81 v W84' },
  // Winner of M82 vs Winner of M83
  { match:94,  round:'Round of 16', date:'2026-07-07',time:'00:00', home:'Winner Match 82',   away:'Winner Match 83',          venue:'Seattle',        rule:'W82 v W83' },
  // Winner of M85 vs Winner of M88
  { match:95,  round:'Round of 16', date:'2026-07-07',time:'17:00', home:'Winner Match 85',   away:'Winner Match 88',          venue:'Atlanta',        rule:'W85 v W88' },
  // Winner of M86 vs Winner of M87
  { match:96,  round:'Round of 16', date:'2026-07-08',time:'21:00', home:'Winner Match 86',   away:'Winner Match 87',          venue:'Vancouver',      rule:'W86 v W87' },

  // ── QUARTER-FINALS (July 9–10) ──
  { match:97,  round:'Quarter-Final', date:'2026-07-09',time:'21:00', home:'Winner Match 89',  away:'Winner Match 90',          venue:'Foxborough',     rule:'W89 v W90' },
  { match:98,  round:'Quarter-Final', date:'2026-07-10',time:'20:00', home:'Winner Match 91',  away:'Winner Match 92',          venue:'Inglewood',      rule:'W91 v W92' },
  { match:99,  round:'Quarter-Final', date:'2026-07-11',time:'21:00', home:'Winner Match 93',  away:'Winner Match 94',          venue:'Arlington',      rule:'W93 v W94' },
  { match:100, round:'Quarter-Final', date:'2026-07-12',time:'20:00', home:'Winner Match 95',  away:'Winner Match 96',          venue:'East Rutherford',rule:'W95 v W96' },

  // ── SEMI-FINALS (July 13–14) ──
  { match:101, round:'Semi-Final', date:'2026-07-13',time:'21:00', home:'Winner Match 97',    away:'Winner Match 98',            venue:'Inglewood',      rule:'W97 v W98' },
  { match:102, round:'Semi-Final', date:'2026-07-14',time:'21:00', home:'Winner Match 99',    away:'Winner Match 100',           venue:'Arlington',      rule:'W99 v W100' },

  // ── THIRD PLACE (July 18) ──
  { match:103, round:'Third Place Play-off', date:'2026-07-18',time:'21:00', home:'Loser Match 101', away:'Loser Match 102', venue:'Miami Gardens', rule:'L101 v L102' },

  // ── FINAL (July 19) ──
  { match:104, round:'Final', date:'2026-07-19',time:'21:00', home:'Winner Match 101', away:'Winner Match 102', venue:'East Rutherford (MetLife Stadium)', rule:'W101 v W102' },
];

// ─────────────── GROUPS ───────────────
const WC2026_GROUPS = {
  A: { teams:['Mexico','South Korea','South Africa','Czech Republic'],       path:'Upper bracket' },
  B: { teams:['Canada','Switzerland','Qatar','Bosnia-Herzegovina'],          path:'Upper bracket' },
  C: { teams:['Brazil','Scotland','Morocco','Haiti'],                        path:'Upper bracket' },
  D: { teams:['United States','Australia','Turkey','Paraguay'],              path:'Upper bracket' },
  E: { teams:['Germany','Ecuador','Ivory Coast','Curaçao'],                  path:'Upper bracket' },
  F: { teams:['Netherlands','Sweden','Japan','Tunisia'],                     path:'Upper bracket' },
  G: { teams:['Belgium','New Zealand','Iran','Egypt'],                       path:'Lower bracket' },
  H: { teams:['Spain','Uruguay','Saudi Arabia','Cape Verde'],                path:'Lower bracket' },
  I: { teams:['France','Norway','Senegal','Iraq'],                           path:'Lower bracket' },
  J: { teams:['Argentina','Austria','Algeria','Jordan'],                     path:'Lower bracket' },
  K: { teams:['Portugal','Colombia','Uzbekistan','Congo DR'],                path:'Lower bracket' },
  L: { teams:['England','Panama','Croatia','Ghana'],                         path:'Lower bracket' },
};

// ─────────────── THIRD PLACE RULES ───────────────
// The 8 best third-place teams advance. Which slot they fill in R32 depends on which 8 groups they come from.
// There are 495 possible combinations — this explains the "Best 3rd (X/Y/Z)" notation.
// Full table published in FIFA regulations Annex C.
const THIRD_PLACE_RULES = {
  description: 'The best 8 third-place teams qualify. Which Round of 32 slot they fill depends on which 8 groups they come from (495 possible combinations per FIFA Annex C).',
  slots: {
    'M74 (1E slot)': 'Best 3rd from groups A, B, C, D, or F',
    'M77 (1I slot)': 'Best 3rd from groups C, D, F, G, or H',
    'M79 (1A slot)': 'Best 3rd from groups C, E, F, H, or I',
    'M80 (1L slot)': 'Best 3rd from groups E, H, I, J, or K',
    'M81 (1D slot)': 'Best 3rd from groups B, E, F, I, or J',
    'M82 (1G slot)': 'Best 3rd from groups A, E, H, I, or J',
    'M85 (1B slot)': 'Best 3rd from groups E, F, G, I, or J',
    'M87 (1K slot)': 'Best 3rd from groups D, E, I, J, or L',
  }
};

// ─────────────── HANDLER ───────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers:CORS_HEADERS, body:'' };

  const { group, round, team } = event.queryStringParameters || {};
  const today = new Date().toISOString().split('T')[0];

  const allFixtures = [...GROUP_FIXTURES, ...KNOCKOUT_FIXTURES];

  let fixtures = allFixtures.map((f, i) => ({
    id:           `wc2026-${f.match || i}`,
    match_number: f.match || null,
    home_team:    f.home,
    away_team:    f.away,
    teams:        `${f.home} vs ${f.away}`,
    score:        '',
    status:       f.date < today ? 'finished' : 'upcoming',
    uk_time:      f.time,
    date:         f.date,
    league_name:  'FIFA World Cup 2026',
    league_key:   'wc2026',
    country_name: 'International',
    stage:        f.group ? `Group ${f.group}` : f.round,
    group:        f.group || null,
    round:        f.round || (f.group ? 'Group Stage' : null),
    venue:        f.venue || null,
    rule:         f.rule  || null,
    home_logo:    null,
    away_logo:    null,
    event_status: '',
    last_updated: new Date().toISOString()
  }));

  if (group)  fixtures = fixtures.filter(f => f.group === group.toUpperCase());
  if (round)  fixtures = fixtures.filter(f => (f.round || '').toLowerCase().includes(round.toLowerCase()));
  if (team)   fixtures = fixtures.filter(f =>
    f.home_team.toLowerCase().includes(team.toLowerCase()) ||
    f.away_team.toLowerCase().includes(team.toLowerCase())
  );

  const upcoming = fixtures.filter(f => f.date >= today);
  const past     = fixtures.filter(f => f.date <  today);

  const wcStart   = new Date('2026-06-11');
  const daysUntil = Math.max(0, Math.ceil((wcStart - new Date()) / (1000*60*60*24)));

  // Round breakdown counts
  const rounds = {};
  allFixtures.forEach(f => {
    const r = f.group ? 'Group Stage' : f.round;
    rounds[r] = (rounds[r] || 0) + 1;
  });

  return {
    statusCode: 200,
    headers:    CORS_HEADERS,
    body: JSON.stringify({
      success: true,
      tournament: {
        name:       'FIFA World Cup 2026',
        hosts:      'USA, Canada & Mexico',
        dates:      '11 June – 19 July 2026',
        final:      '19 July 2026 – MetLife Stadium, New Jersey',
        teams:      48,
        groups:     12,
        totalMatches: 104,
        daysUntil,
        started:    daysUntil <= 0,
        format:     '12 groups → Round of 32 → Round of 16 → QF → SF → Final'
      },
      groups:          WC2026_GROUPS,
      third_place_rules: THIRD_PLACE_RULES,
      rounds,
      fixtures,
      upcoming,
      past,
      group_fixtures:   GROUP_FIXTURES.length,
      knockout_fixtures: KNOCKOUT_FIXTURES.length,
      total: fixtures.length,
      timestamp: new Date().toISOString()
    })
  };
};
