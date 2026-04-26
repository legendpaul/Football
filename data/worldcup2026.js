// World Cup 2026 - Full fixture list
// Source: FIFA official schedule
// Tournament: June 11 - July 19, 2026
// Hosts: USA, Canada, Mexico
// All times are UK BST (UTC+1)

const WC2026_FIXTURES = [
  // GROUP STAGE
  // Group A
  { date: '2026-06-11', time: '20:00', home: 'Mexico',      away: 'South Africa',      group: 'A' },
  { date: '2026-06-12', time: '03:00', home: 'South Korea', away: 'Czech Republic',     group: 'A' },
  { date: '2026-06-18', time: '17:00', home: 'Czech Republic', away: 'South Africa',   group: 'A' },
  { date: '2026-06-19', time: '02:00', home: 'Mexico',      away: 'South Korea',        group: 'A' },
  { date: '2026-06-25', time: '02:00', home: 'Czech Republic', away: 'Mexico',          group: 'A' },
  { date: '2026-06-25', time: '02:00', home: 'South Africa', away: 'South Korea',       group: 'A' },
  // Group B
  { date: '2026-06-12', time: '20:00', home: 'Canada',          away: 'Bosnia-Herzegovina', group: 'B' },
  { date: '2026-06-13', time: '20:00', home: 'Qatar',           away: 'Switzerland',         group: 'B' },
  { date: '2026-06-18', time: '20:00', home: 'Switzerland',     away: 'Bosnia-Herzegovina',  group: 'B' },
  { date: '2026-06-18', time: '23:00', home: 'Canada',          away: 'Qatar',               group: 'B' },
  { date: '2026-06-24', time: '20:00', home: 'Bosnia-Herzegovina', away: 'Qatar',            group: 'B' },
  { date: '2026-06-24', time: '20:00', home: 'Switzerland',     away: 'Canada',              group: 'B' },
  // Group C
  { date: '2026-06-13', time: '23:00', home: 'Brazil',   away: 'Morocco',   group: 'C' },
  { date: '2026-06-14', time: '02:00', home: 'Haiti',    away: 'Scotland',  group: 'C' },
  { date: '2026-06-19', time: '23:00', home: 'Scotland', away: 'Morocco',   group: 'C' },
  { date: '2026-06-20', time: '01:30', home: 'Brazil',   away: 'Haiti',     group: 'C' },
  { date: '2026-06-24', time: '23:00', home: 'Morocco',  away: 'Haiti',     group: 'C' },
  { date: '2026-06-24', time: '23:00', home: 'Scotland', away: 'Brazil',    group: 'C' },
  // Group D
  { date: '2026-06-13', time: '02:00', home: 'United States', away: 'Paraguay',      group: 'D' },
  { date: '2026-06-14', time: '05:00', home: 'Australia',     away: 'Turkey',         group: 'D' },
  { date: '2026-06-19', time: '20:00', home: 'United States', away: 'Australia',      group: 'D' },
  { date: '2026-06-20', time: '04:00', home: 'Turkey',        away: 'Paraguay',       group: 'D' },
  { date: '2026-06-26', time: '03:00', home: 'Paraguay',      away: 'Australia',      group: 'D' },
  { date: '2026-06-26', time: '03:00', home: 'Turkey',        away: 'United States',  group: 'D' },
  // Group E
  { date: '2026-06-14', time: '18:00', home: 'Germany',    away: 'Curaçao',      group: 'E' },
  { date: '2026-06-15', time: '00:00', home: 'Ivory Coast', away: 'Ecuador',     group: 'E' },
  { date: '2026-06-20', time: '21:00', home: 'Germany',    away: 'Ivory Coast',  group: 'E' },
  { date: '2026-06-21', time: '01:00', home: 'Ecuador',    away: 'Curaçao',      group: 'E' },
  { date: '2026-06-25', time: '21:00', home: 'Curaçao',    away: 'Ivory Coast',  group: 'E' },
  { date: '2026-06-25', time: '21:00', home: 'Ecuador',    away: 'Germany',      group: 'E' },
  // Group F
  { date: '2026-06-14', time: '21:00', home: 'Netherlands', away: 'Japan',       group: 'F' },
  { date: '2026-06-15', time: '03:00', home: 'Sweden',      away: 'Tunisia',     group: 'F' },
  { date: '2026-06-20', time: '18:00', home: 'Netherlands', away: 'Sweden',      group: 'F' },
  { date: '2026-06-21', time: '05:00', home: 'Tunisia',     away: 'Japan',       group: 'F' },
  { date: '2026-06-26', time: '00:00', home: 'Japan',       away: 'Sweden',      group: 'F' },
  { date: '2026-06-26', time: '00:00', home: 'Tunisia',     away: 'Netherlands', group: 'F' },
  // Group G
  { date: '2026-06-15', time: '20:00', home: 'Belgium',     away: 'Egypt',       group: 'G' },
  { date: '2026-06-16', time: '02:00', home: 'Iran',        away: 'New Zealand', group: 'G' },
  { date: '2026-06-21', time: '20:00', home: 'Belgium',     away: 'Iran',        group: 'G' },
  { date: '2026-06-22', time: '02:00', home: 'New Zealand', away: 'Egypt',       group: 'G' },
  { date: '2026-06-27', time: '04:00', home: 'Egypt',       away: 'Iran',        group: 'G' },
  { date: '2026-06-27', time: '04:00', home: 'New Zealand', away: 'Belgium',     group: 'G' },
  // Group H
  { date: '2026-06-15', time: '17:00', home: 'Spain',         away: 'Cape Verde',   group: 'H' },
  { date: '2026-06-15', time: '23:00', home: 'Saudi Arabia',  away: 'Uruguay',      group: 'H' },
  { date: '2026-06-21', time: '17:00', home: 'Spain',         away: 'Saudi Arabia', group: 'H' },
  { date: '2026-06-21', time: '23:00', home: 'Uruguay',       away: 'Cape Verde',   group: 'H' },
  { date: '2026-06-27', time: '01:00', home: 'Cape Verde',    away: 'Saudi Arabia', group: 'H' },
  { date: '2026-06-27', time: '01:00', home: 'Uruguay',       away: 'Spain',        group: 'H' },
  // Group I
  { date: '2026-06-16', time: '20:00', home: 'France',   away: 'Senegal', group: 'I' },
  { date: '2026-06-16', time: '23:00', home: 'Iraq',     away: 'Norway',  group: 'I' },
  { date: '2026-06-22', time: '22:00', home: 'France',   away: 'Iraq',    group: 'I' },
  { date: '2026-06-23', time: '01:00', home: 'Norway',   away: 'Senegal', group: 'I' },
  { date: '2026-06-26', time: '20:00', home: 'Norway',   away: 'France',  group: 'I' },
  { date: '2026-06-26', time: '20:00', home: 'Senegal',  away: 'Iraq',    group: 'I' },
  // Group J
  { date: '2026-06-17', time: '02:00', home: 'Argentina', away: 'Algeria', group: 'J' },
  { date: '2026-06-17', time: '05:00', home: 'Austria',   away: 'Jordan',  group: 'J' },
  { date: '2026-06-22', time: '18:00', home: 'Argentina', away: 'Austria', group: 'J' },
  { date: '2026-06-23', time: '04:00', home: 'Jordan',    away: 'Algeria', group: 'J' },
  { date: '2026-06-28', time: '03:00', home: 'Algeria',   away: 'Austria', group: 'J' },
  { date: '2026-06-28', time: '03:00', home: 'Jordan',    away: 'Argentina', group: 'J' },
  // Group K
  { date: '2026-06-17', time: '18:00', home: 'Portugal',   away: 'Congo DR',   group: 'K' },
  { date: '2026-06-18', time: '03:00', home: 'Uzbekistan', away: 'Colombia',   group: 'K' },
  { date: '2026-06-23', time: '18:00', home: 'Portugal',   away: 'Uzbekistan', group: 'K' },
  { date: '2026-06-24', time: '03:00', home: 'Colombia',   away: 'Congo DR',   group: 'K' },
  { date: '2026-06-28', time: '00:30', home: 'Colombia',   away: 'Portugal',   group: 'K' },
  { date: '2026-06-28', time: '00:30', home: 'Congo DR',   away: 'Uzbekistan', group: 'K' },
  // Group L
  { date: '2026-06-17', time: '21:00', home: 'England',  away: 'Croatia', group: 'L' },
  { date: '2026-06-18', time: '00:00', home: 'Ghana',    away: 'Panama',  group: 'L' },
  { date: '2026-06-23', time: '21:00', home: 'England',  away: 'Ghana',   group: 'L' },
  { date: '2026-06-24', time: '00:00', home: 'Panama',   away: 'Croatia', group: 'L' },
  { date: '2026-06-27', time: '22:00', home: 'Croatia',  away: 'Ghana',   group: 'L' },
  { date: '2026-06-27', time: '22:00', home: 'Panama',   away: 'England', group: 'L' },
  // KNOCKOUT STAGE (TBC teams)
  { date: '2026-06-28', time: '20:00', home: 'TBC', away: 'TBC', stage: 'Last 32' },
  { date: '2026-06-29', time: '18:00', home: 'TBC', away: 'TBC', stage: 'Last 32' },
  { date: '2026-06-29', time: '21:30', home: 'TBC', away: 'TBC', stage: 'Last 32' },
  { date: '2026-06-30', time: '02:00', home: 'TBC', away: 'TBC', stage: 'Last 32' },
  { date: '2026-06-30', time: '18:00', home: 'TBC', away: 'TBC', stage: 'Last 32' },
  { date: '2026-06-30', time: '22:00', home: 'TBC', away: 'TBC', stage: 'Last 32' },
];

// Groups for the draw view
const WC2026_GROUPS = {
  A: ['Mexico', 'South Korea', 'South Africa', 'Czech Republic'],
  B: ['Canada', 'Switzerland', 'Qatar', 'Bosnia-Herzegovina'],
  C: ['Brazil', 'Scotland', 'Morocco', 'Haiti'],
  D: ['United States', 'Australia', 'Turkey', 'Paraguay'],
  E: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
  F: ['Netherlands', 'Sweden', 'Japan', 'Tunisia'],
  G: ['Belgium', 'New Zealand', 'Iran', 'Egypt'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'],
  I: ['France', 'Norway', 'Senegal', 'Iraq'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'Congo DR'],
  L: ['England', 'Panama', 'Croatia', 'Ghana'],
};

const WC2026_INFO = {
  name: 'FIFA World Cup 2026',
  hosts: 'USA, Canada & Mexico',
  dates: '11 June – 19 July 2026',
  teams: 48,
  groups: 12,
  venues: 16,
  stadiums: 'MetLife Stadium, SoFi Stadium, AT&T Stadium, Levi\'s Stadium + more',
};

if (typeof module !== 'undefined') module.exports = { WC2026_FIXTURES, WC2026_GROUPS, WC2026_INFO };
