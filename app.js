// Existing code at the top of app.js ...

document.addEventListener('DOMContentLoaded', () => {
    const tournamentNameElement = document.getElementById('tournament-name');
    const fixturesElement = document.getElementById('fixtures');
    const groupStageElement = document.getElementById('group-stage'); // Will be less used for CWC
    const knockoutStageElement = document.getElementById('knockout-stage');
    const resultsElement = document.getElementById('results');

    const u21EuroButton = document.getElementById('u21euro');
    const clubWorldCupButton = document.getElementById('clubworldcup');

    // Store fetched data
    let u21Data = {};
    let clubWorldCupData = {}; // Cache for CWC data

    async function fetchData(tournament, type) {
        let filePath = '';
        if (tournament === 'u21euro') {
            if (type === 'fixtures') filePath = 'data/u21_euro_fixtures.json';
            else if (type === 'groups') filePath = 'data/u21_euro_groups.json';
            else if (type === 'results') filePath = 'data/u21_euro_results.json';
            else if (type === 'knockout') filePath = 'data/u21_euro_knockout.json';
        } else if (tournament === 'clubworldcup') {
            if (type === 'fixtures') filePath = 'data/club_world_cup_fixtures.json';
            else if (type === 'structure') filePath = 'data/club_world_cup_structure.json'; // Changed from 'groups' or 'knockout'
            else if (type === 'results') filePath = 'data/club_world_cup_results.json';
        }

        if (!filePath) {
            console.error(`Unknown data type: ${type} for tournament: ${tournament}`);
            return null;
        }

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Could not fetch ${type} data for ${tournament}:`, error);
            return null;
        }
    }

    function displayFixtures(data, tournamentType = 'u21euro') { // Added tournamentType for context if needed
        const fixturesList = document.createElement('ul');
        if (data && data.length > 0) {
            data.forEach(fixture => {
                const listItem = document.createElement('li');
                // Assuming 'uk_time' will be populated correctly later by scraper.
                // Displaying the original time and a placeholder for UK time.
                const originalTime = fixture.datetime_cet || fixture.datetime_utc || 'Time TBD';
                const originalTimeZone = fixture.datetime_cet ? 'CET' : (fixture.datetime_utc ? 'UTC' : '');
                listItem.textContent = `${fixture.teams} - ${originalTime} ${originalTimeZone} / ${fixture.uk_time || 'UK Time TBD'}`;
                fixturesList.appendChild(listItem);
            });
        } else {
            fixturesList.innerHTML = '<li>No fixtures available or failed to load.</li>';
        }
        fixturesElement.innerHTML = '<h2>Upcoming Fixtures</h2>';
        fixturesElement.appendChild(fixturesList);
    }

    function displayGroupStandings(data) { // Primarily for U21 Euro
        groupStageElement.innerHTML = '<h3>Group Stage</h3>';
        if (data && data.length > 0) {
            data.forEach(group => {
                const groupContainer = document.createElement('div');
                groupContainer.className = 'group-container';
                const groupTitle = document.createElement('h4');
                groupTitle.textContent = group.group_name;
                groupContainer.appendChild(groupTitle);

                const table = document.createElement('table');
                group.standings.forEach(teamStanding => {
                    const row = table.insertRow();
                    const cell = row.insertCell();
                    cell.textContent = teamStanding;
                });
                groupContainer.appendChild(table);
                groupStageElement.appendChild(groupContainer);
            });
        } else {
            groupStageElement.innerHTML += '<p>No group standings available for this tournament or failed to load.</p>';
        }
    }

function displayU21KnockoutStages(data) {
    knockoutStageElement.innerHTML = '<h3>Knockout Stage</h3>';
    if (data && (data.round_of_16 || data.quarter_finals || data.semi_finals || data.final)) {
        const renderRound = (roundName, matches, roundKey) => {
            const roundContainer = document.createElement('div');
            roundContainer.className = 'tournament-round ' + roundKey; // e.g. round-of-16-round

            const roundTitle = document.createElement('h4');
            roundTitle.textContent = roundName.replace(/_/g, ' '); // Replace underscores
            roundContainer.appendChild(roundTitle);

            if (matches && matches.length > 0) {
                const matchList = document.createElement('ul');
                matchList.className = 'match-list';
                matches.forEach(match => {
                    const matchItem = document.createElement('li');
                    matchItem.className = 'match-item';

                    const teams = document.createElement('span');
                    teams.className = 'match-teams';
                    teams.textContent = `${match.teams || 'TBD vs TBD'}`;

                    const score = document.createElement('span');
                    score.className = 'match-score';
                    score.textContent = `${match.score || '-'}`; // Display '-' if no score

                    matchItem.appendChild(teams);
                    matchItem.appendChild(score);
                    matchList.appendChild(matchItem);
                });
                roundContainer.appendChild(matchList);
            } else {
                const noDataP = document.createElement('p');
                noDataP.textContent = `No matches scheduled for ${roundName.replace(/_/g, ' ')} yet.`;
                roundContainer.appendChild(noDataP);
            }
            knockoutStageElement.appendChild(roundContainer);
        };

        if (data.round_of_16) renderRound('Round of 16', data.round_of_16, 'round-of-16');
        if (data.quarter_finals) renderRound('Quarter Finals', data.quarter_finals, 'quarter-finals');
        if (data.semi_finals) renderRound('Semi Finals', data.semi_finals, 'semi-finals');

        // Final might be an object or an array
        let finalMatchData = [];
        if (data.final) {
            if (Array.isArray(data.final)) { // If it's an array (though unlikely for a single final match)
                 finalMatchData = data.final.length > 0 ? data.final : [];
            } else if (typeof data.final === 'object' && Object.keys(data.final).length > 0) {
                finalMatchData = [data.final]; // Wrap single match object in an array
            }
        }
        renderRound('Final', finalMatchData, 'final');


    } else {
        const noDataP = document.createElement('p');
        noDataP.textContent = 'No knockout stage data available or failed to load.';
        knockoutStageElement.appendChild(noDataP);
    }
}

function displayClubWorldCupStructure(data) {
    knockoutStageElement.innerHTML = '<h3>Tournament Structure</h3>';
    if (data && data.info) {
        const infoP = document.createElement('p');
        infoP.className = 'tournament-info';
        infoP.textContent = data.info;
        knockoutStageElement.appendChild(infoP);
    }

    if (data && data.rounds && data.rounds.length > 0) {
        data.rounds.forEach((round, index) => {
            const roundContainer = document.createElement('div');
            // Create a slug-like class name, e.g., "first-round-round"
            const roundKey = round.name.toLowerCase().replace(/\s+/g, '-') + '-round';
            roundContainer.className = 'tournament-round ' + roundKey;

            const roundTitle = document.createElement('h4');
            roundTitle.textContent = round.name;
            roundContainer.appendChild(roundTitle);

            if (round.matches && round.matches.length > 0) {
                const matchList = document.createElement('ul');
                matchList.className = 'match-list';
                round.matches.forEach(match => {
                    const matchItem = document.createElement('li');
                    matchItem.className = 'match-item';

                    const teams = document.createElement('span');
                    teams.className = 'match-teams';
                    // Match details might come from combining with fixtures data in a more complex app
                    teams.textContent = `${match.teams || 'TBD vs TBD'}`;

                    const score = document.createElement('span');
                    score.className = 'match-score';
                    score.textContent = `${match.score || '-'}`; // Display '-' if no score

                    matchItem.appendChild(teams);
                    matchItem.appendChild(score);
                    matchList.appendChild(matchItem);
                });
                roundContainer.appendChild(matchList);
            } else {
                const noMatchesP = document.createElement('p');
                noMatchesP.textContent = 'No matches scheduled for this round yet.';
                roundContainer.appendChild(noMatchesP);
            }
            knockoutStageElement.appendChild(roundContainer);
        });
    } else if (!data || !data.rounds || data.rounds.length === 0) {
        const noDataP = document.createElement('p');
        noDataP.textContent = 'No tournament structure data available or failed to load.';
        knockoutStageElement.appendChild(noDataP);
    }
}

    function displayResults(data) {
        const resultsList = document.createElement('ul');
        if (data && data.length > 0) {
            data.forEach(result => {
                const listItem = document.createElement('li');
                listItem.textContent = `${result.teams}, Score: ${result.score} (Date: ${result.date})`;
                resultsList.appendChild(listItem);
            });
        } else {
            resultsList.innerHTML = '<li>No results available or failed to load.</li>';
        }
        resultsElement.innerHTML = '<h2>Results</h2>';
        resultsElement.appendChild(resultsList);
    }

    async function loadU21EuroData() {
        tournamentNameElement.textContent = 'U21 European Championship';
        u21EuroButton.classList.add('active');
        clubWorldCupButton.classList.remove('active');

        // Fetch if not already fetched or if we need to refresh
        if (!u21Data.fixtures) u21Data.fixtures = await fetchData('u21euro', 'fixtures');
        if (!u21Data.groups) u21Data.groups = await fetchData('u21euro', 'groups');
        if (!u21Data.results) u21Data.results = await fetchData('u21euro', 'results');
        if (!u21Data.knockout) u21Data.knockout = await fetchData('u21euro', 'knockout');

        displayFixtures(u21Data.fixtures, 'u21euro');
        groupStageElement.style.display = ''; // Show group stage section
        displayGroupStandings(u21Data.groups);
        displayU21KnockoutStages(u21Data.knockout);
        displayResults(u21Data.results);
    }

    async function loadClubWorldCupData() {
        tournamentNameElement.textContent = 'Club World Cup';
        clubWorldCupButton.classList.add('active');
        u21EuroButton.classList.remove('active');

        if (!clubWorldCupData.fixtures) clubWorldCupData.fixtures = await fetchData('clubworldcup', 'fixtures');
        if (!clubWorldCupData.structure) clubWorldCupData.structure = await fetchData('clubworldcup', 'structure');
        if (!clubWorldCupData.results) clubWorldCupData.results = await fetchData('clubworldcup', 'results');

        displayFixtures(clubWorldCupData.fixtures, 'clubworldcup');
        groupStageElement.style.display = 'none'; // Hide group stage section for CWC
        displayClubWorldCupStructure(clubWorldCupData.structure);
        displayResults(clubWorldCupData.results);
    }

    u21EuroButton.addEventListener('click', loadU21EuroData);
    clubWorldCupButton.addEventListener('click', loadClubWorldCupData);

    loadU21EuroData(); // Default load
});
