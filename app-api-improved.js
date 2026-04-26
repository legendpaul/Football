/**
 * Football Tracker - Improved with Reliable API Client
 * Uses multiple API sources for consistent data fetching
 * Version 4.0 - API-Based Implementation
 */

class FootballAppImproved {
    constructor() {
        this.currentView = 'fixtures';
        this.currentTournament = 'UEFA Women\'s Euro';
        this.favoriteTeams = [];
        this.debugLogs = [];
        this.lastApiRequest = null;
        this.lastApiResponse = null;
        this.filteredData = null;
        this.storage = null;
        this.autoRefreshInterval = null;
        this.REFRESH_INTERVAL = 60000; // 1 minute for API calls
        this.isRefreshing = false;

        // Initialize the reliable API client
        this.apiClient = new window.ReliableFootballAPI();
        
        // Initialize storage and auto-refresh
        this.initializeStorage();
        this.setupAutoRefresh();
        this.updateTime();
        
        console.log('🚀 Football Tracker v4.0 initialized with reliable API client');
        
        // Initial data fetch
        this.fetchFootballData();
    }

    // Initialize storage (localStorage or Neon DB)
    async initializeStorage() {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocal) {
            this.storage = {
                async getFavoriteTeams() {
                    const teams = localStorage.getItem('footballFavoriteTeams');
                    return teams ? JSON.parse(teams) : [];
                },
                async saveFavoriteTeams(teams) {
                    localStorage.setItem('footballFavoriteTeams', JSON.stringify(teams));
                },
                async clearFavoriteTeams() {
                    localStorage.removeItem('footballFavoriteTeams');
                }
            };
            console.log('💾 Using localStorage for development');
        } else {
            // Production Neon DB storage (same as before)
            this.storage = {
                async getFavoriteTeams() {
                    try {
                        const response = await fetch('/.netlify/functions/favorites', {
                            method: 'GET'
                        });
                        const data = await response.json();
                        return data.teams || [];
                    } catch (error) {
                        console.error('Failed to load teams from Neon DB:', error);
                        return [];
                    }
                },
                async saveFavoriteTeams(teams) {
                    try {
                        await fetch('/.netlify/functions/favorites', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ teams })
                        });
                    } catch (error) {
                        console.error('Failed to save teams to Neon DB:', error);
                    }
                },
                async clearFavoriteTeams() {
                    try {
                        await fetch('/.netlify/functions/favorites', {
                            method: 'DELETE'
                        });
                    } catch (error) {
                        console.error('Failed to clear teams from Neon DB:', error);
                    }
                }
            };
            console.log('🐘 Using Neon PostgreSQL for production');
        }

        // Load existing favorite teams
        this.favoriteTeams = await this.storage.getFavoriteTeams();
        this.updateTeamTags();
    }

    // Setup auto-refresh for live data
    setupAutoRefresh() {
        console.log(`🔄 Setting up auto-refresh every ${this.REFRESH_INTERVAL / 1000} seconds`);
        
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        this.autoRefreshInterval = setInterval(() => {
            if (!this.isRefreshing) {
                this.fetchFootballData(true); // Silent refresh
            }
        }, this.REFRESH_INTERVAL);

        // Refresh when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isRefreshing) {
                console.log('🔄 Page became visible, refreshing data...');
                this.fetchFootballData(true);
            }
        });
    }

    // Enhanced data fetching with reliable API client
    async fetchFootballData(silentRefresh = false) {
        if (this.isRefreshing) {
            console.log('⏳ Refresh already in progress, skipping...');
            return;
        }

        this.isRefreshing = true;

        try {
            if (!silentRefresh) {
                this.showLoadingIndicator();
            }

            console.log(`🎯 Fetching data for ${this.currentTournament}...`);
            
            let data;
            
            // Use the reliable API client
            if (this.currentTournament === 'UEFA Women\'s Euro') {
                data = await this.apiClient.getUefaU21Data();
            } else if (this.currentTournament === 'FIFA Club World Cup') {
                data = await this.apiClient.getFifaClubWorldCupData();
            }

            // Update API request info for debugging
            this.lastApiRequest = {
                timestamp: new Date().toISOString(),
                tournament: this.currentTournament,
                view: this.currentView,
                method: 'Reliable API Client'
            };

            this.lastApiResponse = {
                timestamp: new Date().toISOString(),
                dataSize: JSON.stringify(data).length,
                fixtures: data.fixtures?.length || 0,
                results: data.results?.length || 0,
                fallback: data.fallback || false,
                source: data.source || 'Primary API'
            };

            // Process and display the data
            this.processData(data);
            
            // Update last updated time
            const lastUpdated = document.getElementById('last-updated');
            if (lastUpdated) {
                const now = new Date().toLocaleTimeString();
                lastUpdated.textContent = `Last updated: ${now}`;
            }

            if (!silentRefresh) {
                const sourceMsg = data.fallback ? ` (using ${data.source})` : '';
                this.addDebugLog(`✅ Successfully fetched ${this.currentTournament} data${sourceMsg}`, 'success');
            }

            console.log(`✅ Data fetch complete for ${this.currentTournament}`);

        } catch (error) {
            console.error('❌ Error fetching data:', error);
            this.addDebugLog(`❌ Error: ${error.message}`, 'error');
            
            if (!silentRefresh) {
                this.showErrorMessage('Failed to fetch data. Please try again later.');
            }
        } finally {
            this.isRefreshing = false;
            if (!silentRefresh) {
                this.hideLoadingIndicator();
            }
        }
    }

    // Process and filter the fetched data
    processData(data) {
        this.filteredData = {
            fixtures: this.filterByFavoriteTeams(data.fixtures || []),
            results: this.filterByFavoriteTeams(data.results || []),
            live: this.filterByFavoriteTeams(data.live || []),
            groups: data.groups || [],
            knockout: data.knockout || {},
            structure: data.structure || {},
            fallback: data.fallback || false,
            source: data.source || 'API'
        };

        this.updateDisplay();
        this.updateResultsCount();
        this.updateDebugPanels();
    }

    // Filter data by favorite teams
    filterByFavoriteTeams(matches) {
        if (this.favoriteTeams.length === 0) {
            return matches;
        }

        return matches.filter(match => {
            return this.favoriteTeams.some(team => 
                match.teams.toLowerCase().includes(team.toLowerCase())
            );
        });
    }

    // Update display based on current view
    updateDisplay() {
        const container = document.getElementById('football-results');
        const liveContainer = document.getElementById('live-scores-container');
        const tournamentContainer = document.getElementById('tournament-structure-section');

        if (!container) return;

        // Hide all sections first
        if (liveContainer) liveContainer.style.display = 'none';
        if (tournamentContainer) tournamentContainer.style.display = 'none';

        switch (this.currentView) {
            case 'fixtures':
                this.displayFixtures();
                break;
            case 'results':
                this.displayResults();
                break;
            case 'live':
                this.displayLiveScores();
                if (liveContainer) liveContainer.style.display = 'block';
                break;
            case 'tournament':
                this.displayTournamentStructure();
                if (tournamentContainer) tournamentContainer.style.display = 'block';
                break;
        }
    }

    // Display fixtures
    displayFixtures() {
        const container = document.getElementById('football-results');
        const title = document.getElementById('main-section-title');
        
        if (title) title.textContent = 'Upcoming Fixtures';
        
        if (!this.filteredData || !this.filteredData.fixtures.length) {
            container.innerHTML = this.getNoDataMessage('fixtures');
            return;
        }

        const html = this.filteredData.fixtures.map(fixture => `
            <div class="football-item fixture-item">
                <div class="match-teams">
                    <span class="team-names">${fixture.teams}</span>
                    ${this.isTeamFavorite(fixture.teams) ? '<span class="favorite-star">⭐</span>' : ''}
                </div>
                <div class="match-details">
                    <div class="match-time">
                        <span class="time-label">Kick-off (UK Time):</span>
                        <span class="time-value">${fixture.uk_time || 'TBD'} BST</span>
                    </div>
                    <div class="match-date">
                        <span class="date-value">${fixture.datetime_utc || 'TBD'}</span>
                    </div>
                </div>
                <div class="match-status">
                    <span class="status-upcoming">Upcoming</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // Display results
    displayResults() {
        const container = document.getElementById('football-results');
        const title = document.getElementById('main-section-title');
        
        if (title) title.textContent = 'Match Results';

        if (!this.filteredData || !this.filteredData.results.length) {
            container.innerHTML = this.getNoDataMessage('results');
            return;
        }

        const html = this.filteredData.results.map(result => `
            <div class="football-item result-item">
                <div class="match-teams">
                    <span class="team-names">${result.teams}</span>
                    ${this.isTeamFavorite(result.teams) ? '<span class="favorite-star">⭐</span>' : ''}
                </div>
                <div class="match-score">
                    <span class="score-value">${result.score}</span>
                </div>
                <div class="match-details">
                    <div class="match-date">
                        <span class="date-value">${result.date}</span>
                    </div>
                </div>
                <div class="match-status">
                    <span class="status-finished">Finished</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // Display live scores
    displayLiveScores() {
        const container = document.getElementById('live-scores');
        const mainContainer = document.getElementById('football-results');
        const title = document.getElementById('main-section-title');
        
        if (title) title.textContent = 'Live Matches';

        const liveMatches = this.filteredData?.live || [];

        if (liveMatches.length === 0) {
            if (mainContainer) {
                mainContainer.innerHTML = this.getNoDataMessage('live');
            }
            return;
        }

        const liveHtml = liveMatches.map(match => `
            <div class="football-item live-item">
                <div class="match-teams">
                    <span class="team-names">${match.teams}</span>
                    ${this.isTeamFavorite(match.teams) ? '<span class="favorite-star">⭐</span>' : ''}
                </div>
                <div class="match-score">
                    <span class="score-value live-score">${match.score || '0-0'}</span>
                </div>
                <div class="match-details">
                    <div class="match-time">
                        <span class="time-label">Kick-off (UK):</span>
                        <span class="time-value">${match.uk_time || 'TBD'}</span>
                    </div>
                </div>
                <div class="match-status">
                    <span class="status-live">🔴 LIVE</span>
                </div>
            </div>
        `).join('');

        if (container) container.innerHTML = liveHtml;
        if (mainContainer) mainContainer.innerHTML = '';
    }

    // Display tournament structure
    displayTournamentStructure() {
        const container = document.getElementById('tournament-structure-section');
        if (!container) return;

        const title = document.getElementById('tournament-section-title');
        if (title) title.textContent = `${this.currentTournament} Structure`;

        if (this.currentTournament === 'UEFA Women\'s Euro') {
            this.displayUefaStructure(container);
        } else if (this.currentTournament === 'FIFA Club World Cup') {
            this.displayFifaStructure(container);
        }
    }

    // Display UEFA structure
    displayUefaStructure(container) {
        const groupContainer = document.getElementById('group-stage-container');
        const knockoutContainer = document.getElementById('knockout-stage-container');

        if (groupContainer && this.filteredData?.groups) {
            const groupsHtml = this.filteredData.groups.map(group => `
                <div class="group-table">
                    <h4>${group.group_name}</h4>
                    <div class="standings">
                        ${group.standings.map(standing => `
                            <div class="standing-row">${standing}</div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
            groupContainer.innerHTML = groupsHtml;
        }

        if (knockoutContainer && this.filteredData?.knockout) {
            const knockout = this.filteredData.knockout;
            let knockoutHtml = '';

            if (knockout.quarter_finals) {
                knockoutHtml += `
                    <div class="knockout-round">
                        <h4>Quarter Finals</h4>
                        ${knockout.quarter_finals.map(match => `
                            <div class="knockout-match">${match.teams} - ${match.score}</div>
                        `).join('')}
                    </div>
                `;
            }

            if (knockout.semi_finals) {
                knockoutHtml += `
                    <div class="knockout-round">
                        <h4>Semi Finals</h4>
                        ${knockout.semi_finals.map(match => `
                            <div class="knockout-match">${match.teams} - ${match.score}</div>
                        `).join('')}
                    </div>
                `;
            }

            if (knockout.final) {
                knockoutHtml += `
                    <div class="knockout-round">
                        <h4>Final</h4>
                        <div class="knockout-match">${knockout.final.teams} - ${knockout.final.score}</div>
                    </div>
                `;
            }

            knockoutContainer.innerHTML = knockoutHtml;
        }
    }

    // Display FIFA structure
    displayFifaStructure(container) {
        const knockoutContainer = document.getElementById('knockout-stage-container');
        const groupContainer = document.getElementById('group-stage-container');

        if (groupContainer) {
            groupContainer.innerHTML = '<p>FIFA Club World Cup uses expanded group format</p>';
        }

        if (knockoutContainer && this.filteredData?.structure?.rounds) {
            const roundsHtml = this.filteredData.structure.rounds.map(round => `
                <div class="knockout-round">
                    <h4>${round.name}</h4>
                    ${round.matches.map(match => `
                        <div class="knockout-match">${match.teams} - ${match.score}</div>
                    `).join('')}
                </div>
            `).join('');
            knockoutContainer.innerHTML = roundsHtml;
        }
    }

    // Utility functions
    isTeamFavorite(teams) {
        return this.favoriteTeams.some(team => 
            teams.toLowerCase().includes(team.toLowerCase())
        );
    }

    getNoDataMessage(type) {
        const messages = {
            fixtures: 'No upcoming fixtures found',
            results: 'No results available yet',
            live: 'No live matches at the moment'
        };

        const fallbackMsg = this.filteredData?.fallback 
            ? `<div class="fallback-info">📡 Using ${this.filteredData.source}</div>` 
            : '';

        return `
            <div class="no-results">
                <div class="no-results-icon">⚽</div>
                <div class="no-results-text">${messages[type]}</div>
                <div class="no-results-subtext">API updates every minute</div>
                ${fallbackMsg}
            </div>
        `;
    }

    // View and tournament switching
    switchView(viewType) {
        this.currentView = viewType;
        this.updateDisplay();
        console.log(`🔄 Switched to ${viewType} view`);
    }

    onTournamentChange() {
        const select = document.getElementById('tournament-select');
        if (select) {
            this.currentTournament = select.value;
            console.log(`🏆 Switched to ${this.currentTournament}`);
            this.fetchFootballData();
        }
    }

    // Team management (same as before)
    async addFavoriteTeam() {
        const input = document.getElementById('team-input');
        if (!input || !input.value.trim()) return;

        const teamName = input.value.trim();
        if (!this.favoriteTeams.includes(teamName)) {
            this.favoriteTeams.push(teamName);
            await this.storage.saveFavoriteTeams(this.favoriteTeams);
            this.updateTeamTags();
            this.updateDisplay();
            input.value = '';
            this.addDebugLog(`⭐ Added favorite team: ${teamName}`, 'info');
        }
    }

    async clearFavoriteTeams() {
        this.favoriteTeams = [];
        await this.storage.clearFavoriteTeams();
        this.updateTeamTags();
        this.updateDisplay();
        this.addDebugLog('🗑️ Cleared all favorite teams', 'info');
    }

    async removeFavoriteTeam(teamName) {
        this.favoriteTeams = this.favoriteTeams.filter(team => team !== teamName);
        await this.storage.saveFavoriteTeams(this.favoriteTeams);
        this.updateTeamTags();
        this.updateDisplay();
        this.addDebugLog(`🗑️ Removed favorite team: ${teamName}`, 'info');
    }

    updateTeamTags() {
        const container = document.getElementById('team-tags');
        if (!container) return;

        if (this.favoriteTeams.length === 0) {
            container.innerHTML = '<span class="no-teams">No favorite teams added yet</span>';
            return;
        }

        const html = this.favoriteTeams.map(team => `
            <span class="team-tag">
                ${team}
                <button class="remove-team" onclick="window.footballApp.removeFavoriteTeam('${team}')">×</button>
            </span>
        `).join('');

        container.innerHTML = html;
    }

    // Update results count and info
    updateResultsCount() {
        const count = document.getElementById('results-count');
        const filterInfo = document.getElementById('filter-info');
        
        if (count && this.filteredData) {
            const total = (this.filteredData.fixtures?.length || 0) + (this.filteredData.results?.length || 0) + (this.filteredData.live?.length || 0);
            const liveCount = this.filteredData.live?.length || 0;
            count.textContent = `${total} matches found (${liveCount} live)`;
        }

        if (filterInfo) {
            const favoriteInfo = this.favoriteTeams.length > 0 
                ? `⭐ Filtered by ${this.favoriteTeams.length} favorite team(s) • ` 
                : '🌐 Showing all matches • ';
            
            const sourceInfo = this.filteredData?.fallback 
                ? `Data from ${this.filteredData.source} • ` 
                : '';
            
            filterInfo.textContent = `${favoriteInfo}${sourceInfo}All times in UK timezone (BST)`;
        }
    }

    // Debug functionality
    addDebugLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        this.debugLogs.unshift({ timestamp, message, type });
        if (this.debugLogs.length > 50) this.debugLogs.pop();
        this.updateDebugPanels();
    }

    updateDebugPanels() {
        // Update request info
        const requestInfo = document.getElementById('api-request-info');
        if (requestInfo && this.lastApiRequest) {
            requestInfo.innerHTML = `
                <strong>Last Request:</strong><br>
                Timestamp: ${this.lastApiRequest.timestamp}<br>
                Tournament: ${this.lastApiRequest.tournament}<br>
                View: ${this.lastApiRequest.view}<br>
                Method: ${this.lastApiRequest.method}
            `;
        }

        // Update response info
        const responseInfo = document.getElementById('api-response-info');
        if (responseInfo && this.lastApiResponse) {
            requestInfo.innerHTML = `
                <strong>Last Response:</strong><br>
                Timestamp: ${this.lastApiResponse.timestamp}<br>
                Data Size: ${this.lastApiResponse.dataSize} characters<br>
                Fixtures: ${this.lastApiResponse.fixtures}<br>
                Results: ${this.lastApiResponse.results}<br>
                Source: ${this.lastApiResponse.source}<br>
                Fallback: ${this.lastApiResponse.fallback ? 'Yes' : 'No'}
            `;
        }

        // Update console logs
        const consoleMessages = document.getElementById('console-messages');
        if (consoleMessages) {
            const logsHtml = this.debugLogs.slice(0, 20).map(log => `
                <div class="console-log ${log.type}">
                    <span class="log-time">[${log.timestamp}]</span>
                    <span class="log-message">${log.message}</span>
                </div>
            `).join('');
            consoleMessages.innerHTML = logsHtml;
        }
    }

    showDebugTab(tabName) {
        const tabs = document.querySelectorAll('.debug-tab');
        const panels = document.querySelectorAll('.debug-panel');

        tabs.forEach(tab => tab.classList.remove('active'));
        panels.forEach(panel => panel.classList.remove('active'));

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`debug-${tabName}`).classList.add('active');
    }

    // UI helpers
    showLoadingIndicator() {
        const fetchBtn = document.getElementById('fetch-btn');
        if (fetchBtn) {
            fetchBtn.disabled = true;
            fetchBtn.innerHTML = '🔄 Loading...';
        }
    }

    hideLoadingIndicator() {
        const fetchBtn = document.getElementById('fetch-btn');
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.innerHTML = '⚽ Get Data';
        }
    }

    showErrorMessage(message) {
        console.error(message);
        this.addDebugLog(message, 'error');
    }

    // Update time display
    updateTime() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            const now = new Date();
            const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
            const timeStr = ukTime.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            timeElement.textContent = `${timeStr} BST (UK Time)`;
        }
        
        setTimeout(() => this.updateTime(), 1000);
    }

    // Cleanup
    destroy() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        if (this.apiClient) {
            this.apiClient.clearCache();
        }
        console.log('🔄 Football App destroyed');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Content Loaded - initializing Improved Football App...');
    
    // Check if ReliableFootballAPI loaded
    if (typeof window.ReliableFootballAPI === 'undefined') {
        console.error('❌ ReliableFootballAPI not loaded. Please include the API client script first.');
        return;
    }
    
    console.log('✅ ReliableFootballAPI found, creating improved FootballApp...');
    
    try {
        window.footballApp = new FootballAppImproved();
        console.log('✅ Improved Football App initialized successfully');
    } catch (error) {
        console.error('❌ Error creating FootballApp:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.footballApp) {
        window.footballApp.destroy();
    }
});
