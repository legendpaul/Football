/**
 * Football Tracker v5.0
 * - Dynamic league selector (all active leagues today)
 * - Live scores with minute display
 * - Fixtures grouped by date
 * - Results grouped by league
 * - Favourite teams filtering
 * - 30-second live auto-refresh
 */

/* ─────────────────────────── CONSTANTS ─────────────────────────── */

const CATEGORY_COLOURS = {
  'Champions League & European': '#1a237e',
  'Top Leagues':   '#1b5e20',
  'International': '#4a148c',
  'England':       '#b71c1c',
  'Spain':         '#e65100',
  'Germany':       '#212121',
  'Italy':         '#1565c0',
  'France':        '#283593',
  'Netherlands':   '#e65100',
  'Portugal':      '#1b5e20',
  'Americas':      '#004d40',
  'Asia':          '#880e4f',
  'Africa':        '#33691e',
  'Other Europe':  '#37474f',
  'Other':         '#455a64'
};

/* ─────────────────────────── MAIN CLASS ─────────────────────────── */

class FootballApp {
  constructor() {
    this.currentView       = 'live';
    this.currentLeague     = null;
    this.leagues           = [];
    this.favoriteTeams     = [];
    this.data              = { live: [], fixtures: [], results: [] };
    this.matchPool         = [];   // full pool, display max 20 at a time
    this.MAX_DISPLAY       = 20;
    this.autoRefreshInterval = null;
    this.REFRESH_INTERVAL  = 30000;
    this.isRefreshing      = false;
    this.lastUpdated       = null;
    this.useNeonDB         = false; // set true when DATABASE_URL available
    this.debugLog          = [];   // debug console messages

    this.init();
  }

  async init() {
    this.loadFavourites();
    this.startClock();
    this.bindNavButtons();
    this.bindTeamControls();
    this.bindDebugTabs();
    await this.checkNeonDB();
    await this.loadLeagues();
    this.startAutoRefresh();
    this.log('⚽ Football Tracker v5 ready', 'success');
  }

  /* ─────────── LEAGUES ─────────── */

  async loadLeagues() {
    try {
      const res  = await fetch('/.netlify/functions/leagues');
      const data = await res.json();
      if (!data.success && !data.leagues?.length) throw new Error(data.error || 'No leagues');

      this.leagues = data.leagues || [];
      this.renderLeagueSelector(data.grouped || {});

      // Default to All
      this.currentLeague = { id: 'all', name: 'All Active Leagues', category: '', country: '' };
      const sel = document.getElementById('league-select');
      if (sel) sel.value = 'all';
      await this.fetchData();
    } catch (err) {
      console.error('Failed to load leagues:', err);
      this.renderFallbackSelector();
    }
  }

  renderLeagueSelector(grouped) {
    const sel = document.getElementById('league-select');
    if (!sel) return;

    sel.innerHTML = '';

    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = '⚽ All Active Leagues';
    sel.appendChild(allOpt);

    const ORDER = [
      'Champions League & European', 'International', 'Top Leagues',
      'England', 'Spain', 'Germany', 'Italy', 'France',
      'Netherlands', 'Portugal', 'Other Europe', 'Americas', 'Asia', 'Africa', 'Other'
    ];
    const allCats = ORDER.filter(c => grouped[c]?.length)
      .concat(Object.keys(grouped).filter(c => !ORDER.includes(c)));

    allCats.forEach(cat => {
      const items = grouped[cat];
      if (!items?.length) return;
      const og = document.createElement('optgroup');
      og.label = cat;
      items.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        const live = l.liveCount > 0 ? ` 🔴${l.liveCount}` : '';
        opt.textContent = `${l.name}${l.country ? ' ('+l.country+')' : ''}${live}`;
        og.appendChild(opt);
      });
      sel.appendChild(og);
    });

    sel.addEventListener('change', () => this.onLeagueChange());
    this.updateLeagueBadge();
  }

  renderFallbackSelector() {
    const sel = document.getElementById('league-select');
    if (!sel) return;
    sel.innerHTML = '<option value="all">⚽ All Leagues</option>';
    this.currentLeague = { id: 'all', name: 'All Active Leagues', category: '', country: '' };
    sel.addEventListener('change', () => this.onLeagueChange());
    this.fetchData();
  }

  onLeagueChange() {
    const sel = document.getElementById('league-select');
    if (!sel) return;
    const id = sel.value;
    if (id === 'all') {
      this.currentLeague = { id: 'all', name: 'All Active Leagues', category: '', country: '' };
    } else {
      const found = this.leagues.find(l => String(l.id) === String(id));
      this.currentLeague = found || { id, name: id, category: '', country: '' };
    }
    this.updateLeagueBadge();
    this.fetchData();
  }

  updateLeagueBadge() {
    const badge = document.getElementById('league-badge');
    if (!badge || !this.currentLeague) return;
    const l = this.currentLeague;
    if (!l.category && !l.country) { badge.innerHTML = ''; return; }
    const colour = CATEGORY_COLOURS[l.category] || '#37474f';
    badge.innerHTML = `
      ${l.category ? `<span class="cat-pill" style="background:${colour}">${l.category}</span>` : ''}
      ${l.country  ? `<span class="country-label">${l.country}</span>` : ''}
    `;
  }

  /* ─────────── DATA FETCHING ─────────── */

  startAutoRefresh() {
    if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
    this.autoRefreshInterval = setInterval(() => {
      if (!this.isRefreshing && this.currentView === 'live') this.fetchData(true);
    }, this.REFRESH_INTERVAL);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isRefreshing) this.fetchData(true);
    });
  }

  async fetchData(silent = false) {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    if (!silent) this.setLoading(true);

    try {
      const lid = this.currentLeague?.id || 'all';
      const url = `/.netlify/functions/football-search?leagueKey=${encodeURIComponent(lid)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'API error');

      this.data = { live: json.live || [], fixtures: json.fixtures || [], results: json.results || [] };
      this.lastUpdated = new Date();
      this.updateLastUpdated();
      this.render();
    } catch (err) {
      console.error('Fetch error:', err);
      if (!silent) this.showError(err.message);
    } finally {
      this.isRefreshing = false;
      if (!silent) this.setLoading(false);
    }
  }

  /* ─────────── RENDER ─────────── */

  render() {
    const views = ['live', 'fixtures', 'results', 'teams', 'worldcup', 'tournament', 'debug'];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.style.display = v === this.currentView ? 'block' : 'none';
    });

    const title = document.getElementById('main-section-title');
    if (title) title.textContent = {
      live:       '🔴 Live Matches',
      fixtures:   '📅 Upcoming Fixtures',
      results:    '📊 Results',
      tournament: '🏆 Tournament Structure',
      teams:      '⭐ Favourite Teams',
      worldcup:   '🏆 FIFA World Cup 2026',
      debug:      '🔧 Debug'
    }[this.currentView] || '';

    this.updateCountBadge();

    switch (this.currentView) {
      case 'live':       this.renderLive();        break;
      case 'fixtures':   this.renderFixtures();    break;
      case 'results':    this.renderResults();     break;
      case 'teams':      this.renderTeams();       break;
      case 'worldcup':   this.renderWorldCup();    break;
      case 'tournament': this.renderTournament();  break;
      case 'debug':      this.renderDebug();       break;
    }
  }

  /* ─────────── LIVE ─────────── */

  renderLive() {
    const container = document.getElementById('view-live');
    if (!container) return;
    const matches = this.filterByFavourites(this.data.live);

    if (!matches.length) {
      container.innerHTML = this.emptyState('⚽', 'No live matches right now',
        `Auto-refreshes every ${this.REFRESH_INTERVAL/1000}s`);
      return;
    }

    // Group by league
    const byLeague = this.groupByLeague(matches);
    container.innerHTML = `
      <div class="live-header">
        <span class="live-dot-label"><span class="live-dot"></span> ${matches.length} LIVE</span>
        <span class="refresh-hint">Refreshes every ${this.REFRESH_INTERVAL/1000}s</span>
      </div>
      ${Object.entries(byLeague).map(([league, ms]) => `
        <div class="league-group">
          <div class="league-header">${league}</div>
          <div class="match-list">${ms.map(m => this.renderMatchCard(m, 'live')).join('')}</div>
        </div>
      `).join('')}
    `;
  }

  /* ─────────── FIXTURES ─────────── */

  renderFixtures() {
    const container = document.getElementById('view-fixtures');
    if (!container) return;
    const matches = this.filterByFavourites(this.data.fixtures);

    if (!matches.length) {
      container.innerHTML = this.emptyState('📅', 'No upcoming fixtures', this.currentLeague?.name || '');
      return;
    }

    // Group by date
    const byDate = {};
    matches.forEach(m => {
      const d = m.date || 'TBD';
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(m);
    });

    container.innerHTML = Object.entries(byDate)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, ms]) => `
        <div class="date-group">
          <div class="date-header">${this.formatDateHeader(date)}</div>
          <div class="match-list">${ms.map(m => this.renderMatchCard(m, 'fixture')).join('')}</div>
        </div>
      `).join('');
  }

  /* ─────────── RESULTS ─────────── */

  renderResults() {
    const container = document.getElementById('view-results');
    if (!container) return;
    const matches = this.filterByFavourites(this.data.results);

    if (!matches.length) {
      container.innerHTML = this.emptyState('📊', 'No results yet today', this.currentLeague?.name || '');
      return;
    }

    const byLeague = this.groupByLeague(matches);
    container.innerHTML = Object.entries(byLeague).map(([league, ms]) => `
      <div class="league-group">
        <div class="league-header">${league} <span class="bracket-count">${ms.length}</span></div>
        <div class="match-list">${ms.map(m => this.renderMatchCard(m, 'result')).join('')}</div>
      </div>
    `).join('');
  }

  /* ─────────── MATCH CARD ─────────── */

  renderMatchCard(match, type) {
    const isFav = this.isTeamFavourite(match.teams);
    const isLive = type === 'live';
    const isResult = type === 'result';

    const minuteBadge = isLive && match.minute
      ? `<span class="minute-badge">${match.minute}'</span>` : '';

    const scorePart = isLive || isResult
      ? `<div class="score-block">
           <span class="score-home">${this.parseScore(match.score, 'home')}</span>
           <span class="score-dash">-</span>
           <span class="score-away">${this.parseScore(match.score, 'away')}</span>
           ${match.ht_score && isResult ? `<div class="ht-score">HT: ${match.ht_score}</div>` : ''}
         </div>`
      : `<div class="score-block vs-block"><span class="vs-text">vs</span></div>`;

    const leagueBadge = match.league_name && type !== 'live'
      ? `<span class="league-badge">${match.league_name}</span>` : '';
    const stageBadge = match.stage && match.stage !== 'TBD'
      ? `<span class="stage-badge">${match.stage}</span>` : '';
    const favStar = isFav ? '<span class="fav-star">⭐</span>' : '';

    const statusBadge = {
      live:    `<span class="status-badge live"><span class="live-dot small"></span>${minuteBadge || 'LIVE'}</span>`,
      fixture: `<span class="status-badge upcoming">⏰ ${match.uk_time || 'TBD'}</span>`,
      result:  `<span class="status-badge finished">✅ FT</span>`
    }[type] || '';

    // Team logos
    const homeLogo = match.home_logo
      ? `<img src="${match.home_logo}" class="team-logo" onerror="this.style.display='none'" alt="">` : '';
    const awayLogo = match.away_logo
      ? `<img src="${match.away_logo}" class="team-logo" onerror="this.style.display='none'" alt="">` : '';

    // Venue
    const venueHtml = match.venue && match.venue !== 'TBD'
      ? `<span class="match-venue">🏙️ ${match.venue}</span>` : '';

    // Attendance
    const attHtml = match.attendance
      ? `<span class="match-att">👥 ${Number(match.attendance).toLocaleString()}</span>` : '';

    return `
      <div class="match-card ${type} ${isFav ? 'fav-match' : ''}">
        <div class="match-card-header">
          ${leagueBadge}${stageBadge}${favStar}
          ${statusBadge}
        </div>
        <div class="match-body">
          <div class="team-col home-col">
            ${homeLogo}
            <span class="team-name ${isResult && this.getWinner(match) === 'home' ? 'winner-name' : ''}">${match.home_team}</span>
          </div>
          ${scorePart}
          <div class="team-col away-col">
            <span class="team-name ${isResult && this.getWinner(match) === 'away' ? 'winner-name' : ''}">${match.away_team}</span>
            ${awayLogo}
          </div>
        </div>
        ${venueHtml || attHtml ? `<div class="match-meta">${venueHtml}${attHtml}</div>` : ''}
      </div>
    `;
  }

  getWinner(match) {
    if (!match.score || match.score === '-') return null;
    const parts = match.score.split('-').map(s => parseInt(s.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    if (parts[0] > parts[1]) return 'home';
    if (parts[1] > parts[0]) return 'away';
    return 'draw';
  }

  parseScore(score, side) {
    if (!score || score === '-') return '-';
    const parts = score.split('-').map(s => s.trim());
    return side === 'home' ? (parts[0] || '-') : (parts[1] || '-');
  }

  /* ─────────── TEAMS VIEW ─────────── */

  renderTeams() {
    const container = document.getElementById('view-teams');
    if (!container) return;

    if (!this.favoriteTeams.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-icon">⭐</div>
        <div class="empty-title">No favourite teams added</div>
        <div class="empty-sub">Use the panel below to add teams and filter all views</div>
      </div>`;
      return;
    }

    const all = [...this.data.live, ...this.data.fixtures, ...this.data.results];
    const favMatches = all.filter(m => this.isTeamFavourite(m.teams));

    if (!favMatches.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">⭐</div>
        <div class="empty-title">No matches found for your favourite teams today</div></div>`;
      return;
    }

    const byType = { live: [], fixture: [], result: [] };
    favMatches.forEach(m => {
      if (m.status === 'live') byType.live.push(m);
      else if (m.status === 'upcoming') byType.fixture.push(m);
      else byType.result.push(m);
    });

    container.innerHTML = [
      byType.live.length   ? `<div class="league-header">🔴 Live</div><div class="match-list">${byType.live.map(m=>this.renderMatchCard(m,'live')).join('')}</div>` : '',
      byType.fixture.length? `<div class="league-header">📅 Upcoming</div><div class="match-list">${byType.fixture.map(m=>this.renderMatchCard(m,'fixture')).join('')}</div>` : '',
      byType.result.length ? `<div class="league-header">📊 Results</div><div class="match-list">${byType.result.map(m=>this.renderMatchCard(m,'result')).join('')}</div>` : '',
    ].join('');
  }

  /* ─────────── FAVOURITES ─────────── */

  loadFavourites() {
    try { this.favoriteTeams = JSON.parse(localStorage.getItem('footballFavTeams') || '[]'); } catch { this.favoriteTeams = []; }
    this.renderTeamTags();
  }

  saveFavourites() {
    this.saveToLocalStorage();
    this.renderTeamTags();
    this.render();
  }

  addFavouriteTeam() {
    const input = document.getElementById('team-input');
    if (!input) return;
    const name = input.value.trim();
    if (!name || this.favoriteTeams.includes(name)) return;
    this.favoriteTeams.push(name);
    input.value = '';
    this.saveFavourites();
    this.saveToNeonDB(name, 'add');
    this.showNotification(`⭐ Added: ${name}`);
    this.log(`⭐ Added favourite: ${name}`, 'success');
  }

  removeFavouriteTeam(name) {
    this.favoriteTeams = this.favoriteTeams.filter(t => t !== name);
    this.saveFavourites();
    this.saveToNeonDB(name, 'remove');
    this.log(`🗑️ Removed favourite: ${name}`, 'info');
  }

  clearFavourites() {
    if (!this.favoriteTeams.length) return;
    if (!confirm(`Clear all ${this.favoriteTeams.length} favourite team${this.favoriteTeams.length !== 1 ? 's' : ''}?`)) return;
    this.favoriteTeams = [];
    this.saveFavourites();
    this.saveToNeonDB('', 'clear');
    this.showNotification('🗑️ Favourites cleared');
  }

  renderTeamTags() {
    const container = document.getElementById('team-tags');
    if (!container) return;
    if (!this.favoriteTeams.length) {
      container.innerHTML = '<span class="no-teams-hint">No favourites added yet</span>';
      return;
    }
    container.innerHTML = this.favoriteTeams.map(t => `
      <span class="team-tag">
        ⭐ ${t}
        <button onclick="window.footballApp.removeFavouriteTeam('${t}')" class="tag-remove">×</button>
      </span>
    `).join('');
  }

  isTeamFavourite(teamsStr) {
    if (!teamsStr || !this.favoriteTeams.length) return false;
    return this.favoriteTeams.some(t => teamsStr.toLowerCase().includes(t.toLowerCase()));
  }

  filterByFavourites(matches) {
    if (!this.favoriteTeams.length) return matches;
    return matches.filter(m => this.isTeamFavourite(m.teams));
  }

  /* ─────────── UI HELPERS ─────────── */

  bindNavButtons() {
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentView = btn.dataset.view;
        document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.render();
      });
    });
    const fetchBtn = document.getElementById('fetch-btn');
    if (fetchBtn) fetchBtn.addEventListener('click', () => this.fetchData());
  }

  bindTeamControls() {
    const addBtn = document.getElementById('add-team-btn');
    if (addBtn) addBtn.addEventListener('click', () => this.addFavouriteTeam());
    const input = document.getElementById('team-input');
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') this.addFavouriteTeam(); });
    const clearBtn = document.getElementById('clear-teams-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearFavourites());
  }

  groupByLeague(matches) {
    const map = {};
    matches.forEach(m => {
      const l = m.league_name || 'Unknown';
      if (!map[l]) map[l] = [];
      map[l].push(m);
    });
    return map;
  }

  updateCountBadge() {
    const liveCount = this.data.live.length;
    const btn = document.querySelector('[data-view="live"]');
    if (btn) {
      let badge = btn.querySelector('.count-badge');
      if (liveCount > 0) {
        if (!badge) { badge = document.createElement('span'); badge.className = 'count-badge'; btn.appendChild(badge); }
        badge.textContent = liveCount;
      } else if (badge) badge.remove();
    }
    const statusEl = document.getElementById('results-count');
    if (statusEl) {
      const total = this.data.live.length + this.data.fixtures.length + this.data.results.length;
      statusEl.textContent = `${total} matches • ${this.data.live.length} live`;
    }
  }

  updateLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el && this.lastUpdated) {
      el.textContent = `Updated ${this.lastUpdated.toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })} BST`;
    }
  }

  setLoading(on) {
    const btn = document.getElementById('fetch-btn');
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? '⏳ Loading…' : '🔄 Refresh';
  }

  showError(msg) {
    const c = document.getElementById(`view-${this.currentView}`);
    if (c) c.innerHTML = `<div class="error-state"><div class="error-icon">⚠️</div><div class="error-msg">${msg}</div>
      <button onclick="window.footballApp.fetchData()" class="retry-btn">Retry</button></div>`;
  }

  emptyState(icon, title, sub) {
    return `<div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      <div class="empty-sub">${sub}</div>
    </div>`;
  }

  startClock() {
    const tick = () => {
      const el = document.getElementById('current-time');
      if (el) el.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour12: false });
    };
    tick();
    setInterval(tick, 1000);
  }

  formatDateHeader(dateStr) {
    if (!dateStr || dateStr === 'TBD') return 'Date TBD';
    try { return new Date(dateStr).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' }); }
    catch { return dateStr; }
  }

  /* ─────────── WORLD CUP 2026 ─────────── */

  async renderWorldCup() {
    const container = document.getElementById('view-worldcup');
    if (!container) return;

    // Show loading
    container.innerHTML = `<div class="empty-state"><div class="loading-spinner" style="margin:0 auto 12px;width:32px;height:32px;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite"></div><div>Loading World Cup fixtures…</div></div>`;

    try {
      // Fetch from our static worldcup function
      if (!this._wcData) {
        const res  = await fetch('/.netlify/functions/worldcup');
        const json = await res.json();
        this._wcData = json;
      }
      const wc = this._wcData;
      this._wcGroup = this._wcGroup || 'all';
      this._wcRound = this._wcRound || 'all';

      const t = wc.tournament;
      const daysLabel = t.daysUntil > 0
        ? `<span class="wc-stat"><span class="wc-stat-num">${t.daysUntil}</span><span class="wc-stat-label">Days to go</span></span>`
        : `<span class="wc-stat"><span class="wc-stat-num">🔴</span><span class="wc-stat-label">Underway!</span></span>`;

      // Group + Round filter buttons
      const groups = ['all','A','B','C','D','E','F','G','H','I','J','K','L'];
      const rounds  = ['all','Group Stage','Round of 32','Round of 16','Quarter-Final','Semi-Final','Final'];
      const filterHtml = `
        <div class="wc-group-filter">
          ${groups.map(g => `<button class="wc-group-btn ${this._wcGroup === g ? 'active' : ''}" onclick="window.footballApp.setWcGroup('${g}')">${g === 'all' ? 'All Groups' : 'Group ' + g}</button>`).join('')}
        </div>
        <div class="wc-group-filter" style="margin-top:6px">
          ${rounds.map(r => `<button class="wc-group-btn ${this._wcRound === r ? 'active' : ''}" onclick="window.footballApp.setWcRound('${r}')">${r === 'all' ? 'All Rounds' : r}</button>`).join('')}
        </div>
      `;

      // Filter fixtures
      let fixtures = wc.fixtures || [];
      if (this._wcGroup !== 'all') fixtures = fixtures.filter(f => f.group === this._wcGroup);
      if (this._wcRound !== 'all') fixtures = fixtures.filter(f => (f.round || f.stage || '').includes(this._wcRound));
      if (this.favoriteTeams.length) {
        const fav = fixtures.filter(f => this.isTeamFavourite(f.teams));
        if (fav.length) fixtures = fav;
      }

      // Group by date
      const byDate = {};
      fixtures.forEach(f => {
        if (!byDate[f.date]) byDate[f.date] = [];
        byDate[f.date].push(f);
      });

      const fixturesHtml = Object.entries(byDate)
        .sort(([a],[b]) => a.localeCompare(b))
        .map(([date, ms]) => `
          <div class="date-group">
            <div class="date-header">${this.formatDateHeader(date)}</div>
            ${ms.map(m => `
              <div class="wc-match">
                <div class="wc-match-header">
                  ${m.group ? `<span class="wc-group-badge">Group ${m.group}</span>` : `<span class="wc-group-badge" style="background:rgba(74,20,140,.5);color:#ce93d8">${m.round}</span>`}
                  ${m.venue ? `<span style="font-size:10px;color:rgba(255,255,255,.35)">${m.venue}</span>` : ''}
                  <span style="margin-left:auto;font-size:11px;color:#90caf9;font-weight:700">${m.uk_time} BST</span>
                </div>
                <div class="wc-teams">
                  <span class="wc-team right ${this.isTeamFavourite(m.home_team) ? 'wc-team-fav' : ''}">${m.home_team}</span>
                  <span class="wc-vs">vs</span>
                  <span class="wc-team ${this.isTeamFavourite(m.away_team) ? 'wc-team-fav' : ''}">${m.away_team}</span>
                </div>
                ${m.rule && !m.group ? `<div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px;text-align:center">${m.rule}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `).join('');

      // Groups draw grid
      const groupsHtml = this._wcGroup === 'all' ? `
        <div class="league-header" style="margin-top:16px">Group Draw</div>
        <div class="wc-groups-grid">
          ${Object.entries(wc.groups).map(([g, teams]) => `
            <div class="wc-group-card">
              <div class="wc-group-title">Group ${g}</div>
              ${teams.map(team => `
                <div class="wc-group-team ${this.isTeamFavourite(team) ? 'wc-team-fav' : ''}">${team}</div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      ` : '';

      container.innerHTML = `
        <div class="wc-hero">
          <div class="wc-trophy">🏆</div>
          <div class="wc-title">${t.name}</div>
          <div class="wc-sub">${t.dates} • ${t.hosts} • ${t.teams} teams</div>
          <div class="wc-countdown">
            ${daysLabel}
            <span class="wc-stat"><span class="wc-stat-num">${t.teams}</span><span class="wc-stat-label">Teams</span></span>
            <span class="wc-stat"><span class="wc-stat-num">${t.groups}</span><span class="wc-stat-label">Groups</span></span>
            <span class="wc-stat"><span class="wc-stat-num">${wc.total}</span><span class="wc-stat-label">Fixtures</span></span>
          </div>
        </div>
        ${filterHtml}
        ${fixturesHtml || '<div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">No fixtures for this group</div></div>'}
        ${groupsHtml}
      `;

    } catch (err) {
      console.error('World Cup render error:', err);
      container.innerHTML = this.emptyState('⚠️', `Failed to load: ${err.message}`, '');
    }
  }

  setWcGroup(group) {
    this._wcGroup = group;
    this._wcRound = 'all'; // reset round when changing group
    this.renderWorldCup();
  }

  setWcRound(round) {
    this._wcRound = round;
    this._wcGroup = 'all'; // reset group when changing round
    this.renderWorldCup();
  }

  /* ─────────── NEON DB ─────────── */

  async checkNeonDB() {
    try {
      const res = await fetch('/.netlify/functions/db-health');
      const json = await res.json();
      this.useNeonDB = json.success;
      if (json.success) {
        this.log('🐘 Neon DB connected', 'success');
        await this.syncFavouritesFromDB();
      } else {
        this.log('💾 No Neon DB — using localStorage', 'info');
      }
    } catch {
      this.log('💾 Neon DB not available — using localStorage', 'info');
    }
  }

  async syncFavouritesFromDB() {
    try {
      const res  = await fetch('/.netlify/functions/favorites');
      const json = await res.json();
      if (json.success && json.favourites?.length) {
        this.favoriteTeams = json.favourites;
        this.saveToLocalStorage();
        this.renderTeamTags();
        this.log(`⭐ Loaded ${json.favourites.length} favourites from Neon DB`, 'success');
      }
    } catch (err) {
      this.log(`Neon sync failed: ${err.message}`, 'error');
    }
  }

  async saveToNeonDB(teamName, action = 'add') {
    if (!this.useNeonDB) return;
    try {
      if (action === 'add') {
        await fetch('/.netlify/functions/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamName })
        });
      } else if (action === 'remove') {
        await fetch(`/.netlify/functions/favorites?teamName=${encodeURIComponent(teamName)}`, { method: 'DELETE' });
      } else if (action === 'clear') {
        await fetch('/.netlify/functions/favorites?clearAll=true', { method: 'DELETE' });
      }
    } catch (err) {
      this.log(`Neon save failed: ${err.message}`, 'error');
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('footballFavTeams', JSON.stringify(this.favoriteTeams));
  }

  /* ─────────── TOURNAMENT STRUCTURE ─────────── */

  async renderTournament() {
    const container = document.getElementById('view-tournament');
    if (!container) return;
    container.innerHTML = `<div class="empty-state"><div class="loading-spinner" style="margin:0 auto 12px;width:32px;height:32px;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite"></div><div>Loading tournament data…</div></div>`;

    try {
      const [groupsRes, knockoutRes] = await Promise.allSettled([
        fetch('/data/womens_euro_groups.json'),
        fetch('/data/womens_euro_knockout.json')
      ]);

      const groups   = groupsRes.status   === 'fulfilled' && groupsRes.value.ok   ? await groupsRes.value.json()   : null;
      const knockout = knockoutRes.status === 'fulfilled' && knockoutRes.value.ok ? await knockoutRes.value.json() : null;

      let html = `
        <div class="tourn-info-bar">
          <span class="tourn-title">🏆 UEFA Women's Euro 2025</span>
          <span class="tourn-meta">🇮🇹 Switzerland • July 2025</span>
        </div>
      `;

      if (groups?.length) {
        html += `<div class="groups-grid">${groups.map(g => this.renderGroupTable(g)).join('')}</div>`;
      }

      if (knockout) {
        html += this.renderWomensEuroKnockout(knockout);
      }

      if (!groups?.length && !knockout) {
        html += this.emptyState('🏆', 'No tournament data available', 'Data loads from static JSON files in /data/');
      }

      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = this.emptyState('⚠️', `Failed: ${err.message}`, '');
    }
  }

  renderWomensEuroKnockout(ko) {
    const renderMatch = (label, match) => {
      if (!match) return '';
      const teams = (match.teams || '').split(' vs ');
      const scores = (match.score && match.score !== 'TBD') ? match.score.split('-') : [null, null];
      return `
        <div class="ko-match">
          <div class="ko-label">${label}</div>
          <div class="ko-team"><span>${teams[0] || 'TBD'}</span><span class="ko-score">${scores[0] ?? '-'}</span></div>
          <div class="ko-team"><span>${teams[1] || 'TBD'}</span><span class="ko-score">${scores[1] ?? '-'}</span></div>
          ${match.venue ? `<div class="ko-venue">🏙️ ${match.venue}</div>` : ''}
          <div class="ko-date">📅 ${match.date || ''} ${match.time || ''}</div>
        </div>
      `;
    };

    const qfs = ko.quarter_finals || [];
    const sfs = ko.semi_finals   || [];

    return `
      <div class="ko-section-title">🌿 Knockout Stage</div>
      <div class="ko-bracket">
        <div class="ko-round">
          <div class="ko-round-title">Quarter-Finals</div>
          ${qfs.map((m, i) => renderMatch(`QF${i+1}`, m)).join('')}
        </div>
        <div class="ko-round">
          <div class="ko-round-title">Semi-Finals</div>
          ${sfs.map((m, i) => renderMatch(`SF${i+1}`, m)).join('')}
        </div>
        <div class="ko-round">
          <div class="ko-round-title">Final</div>
          ${renderMatch('Final', ko.final)}
          ${renderMatch('3rd Place', ko.third_place)}
        </div>
      </div>
    `;
  }

  /* ─────────── DEBUG PANEL ─────────── */

  log(msg, type = 'info') {
    const ts = new Date().toLocaleTimeString('en-GB');
    this.debugLog.unshift({ ts, msg, type });
    if (this.debugLog.length > 100) this.debugLog = this.debugLog.slice(0, 100);
    if (this.currentView === 'debug') this.renderDebug();
  }

  bindDebugTabs() {
    document.querySelectorAll('.debug-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.debug-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.debug-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById(`dp-${btn.dataset.tab}`);
        if (panel) panel.classList.add('active');
      });
    });
  }

  renderDebug() {
    const container = document.getElementById('view-debug');
    if (!container) return;

    const storageInfo = {
      mode:       this.useNeonDB ? 'Neon PostgreSQL' : 'localStorage',
      favourites: this.favoriteTeams.length,
      league:     this.currentLeague?.name || 'All',
      live:       this.data.live.length,
      fixtures:   this.data.fixtures.length,
      results:    this.data.results.length,
      lastUpdated:this.lastUpdated?.toLocaleTimeString('en-GB') || '-'
    };

    const logHtml = this.debugLog.slice(0, 50).map(l => {
      const colour = { success:'#69f0ae', error:'#ef9a9a', info:'#90caf9', warning:'#ffd740' }[l.type] || '#fff';
      return `<div style="color:${colour};font-size:12px;margin-bottom:4px"><span style="color:#666">[${l.ts}]</span> ${l.msg}</div>`;
    }).join('') || '<div style="color:rgba(255,255,255,.4)">No log entries yet</div>';

    container.innerHTML = `
      <div class="debug-tabs">
        <button class="debug-tab active" data-tab="status">Status</button>
        <button class="debug-tab" data-tab="log">Console</button>
        <button class="debug-tab" data-tab="data">Raw Data</button>
      </div>
      <div id="dp-status" class="debug-panel active">
        <table class="debug-table">
          ${Object.entries(storageInfo).map(([k,v]) => `<tr><td>${k}</td><td><strong>${v}</strong></td></tr>`).join('')}
          <tr><td>API key</td><td><strong>${document.cookie ? '(set)' : 'server-side only'}</strong></td></tr>
          <tr><td>Neon DB</td><td><strong style="color:${this.useNeonDB ? '#69f0ae' : '#ef9a9a'}">${this.useNeonDB ? 'Connected' : 'Not connected'}</strong></td></tr>
        </table>
        <button onclick="window.footballApp.fetchData()" style="margin-top:10px;background:#1b5e20;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer">🔄 Force Refresh</button>
        <button onclick="window.footballApp.checkNeonDB()" style="margin-top:10px;margin-left:8px;background:#1a237e;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer">🐘 Test Neon DB</button>
      </div>
      <div id="dp-log" class="debug-panel">
        <div style="max-height:400px;overflow-y:auto;font-family:monospace">${logHtml}</div>
      </div>
      <div id="dp-data" class="debug-panel">
        <pre style="font-size:11px;color:#90caf9;max-height:400px;overflow:auto">${JSON.stringify({ live: this.data.live.slice(0,3), fixtures: this.data.fixtures.slice(0,3) }, null, 2)}</pre>
      </div>
    `;
    this.bindDebugTabs();
  }

  /* ─────────── NOTIFICATIONS ─────────── */

  showNotification(msg, type = 'success') {
    const el = document.createElement('div');
    const bg = type === 'error' ? '#c62828' : type === 'warning' ? '#e65100' : '#1b5e20';
    el.style.cssText = `position:fixed;top:20px;right:20px;background:${bg};color:#fff;padding:12px 20px;border-radius:8px;font-weight:600;box-shadow:0 4px 15px rgba(0,0,0,.3);z-index:9999;max-width:320px;font-size:14px;transition:opacity .3s`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2800);
  }

  /* ─────────── CLEANUP ─────────── */

  destroy() { if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval); }
}

/* ─────────────────────────── BOOTSTRAP ─────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) ls.classList.add('hidden');
  }, 1000);
  window.footballApp = new FootballApp();
  console.log('⚽ Football Tracker v5.0 ready');
});

window.addEventListener('beforeunload', () => { if (window.footballApp) window.footballApp.destroy(); });
