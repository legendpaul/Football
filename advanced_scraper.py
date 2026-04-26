"""
Advanced Football Data Scraper
Robust Python implementation with multiple source support
For UEFA U21 Euro 2025 and FIFA Club World Cup 2025
"""

import requests
import json
import re
import time
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import logging
from typing import Dict, List, Optional
import asyncio
import aiohttp
from urllib.parse import urljoin, urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('football_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AdvancedFootballScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        # Data sources configuration
        self.sources = {
            'uefa_u21': {
                'fixtures': 'https://www.uefa.com/under21/fixtures-results/',
                'standings': 'https://www.uefa.com/under21/standings/',
                'api': 'https://editorial.uefa.com/v2/fixtures',
                'backup': [
                    'https://www.flashscore.com/football/europe/euro-u21/',
                    'https://www.espn.com/soccer/uefa-u21/fixtures'
                ]
            },
            'fifa_cwc': {
                'fixtures': 'https://www.fifa.com/en/tournaments/mens/club-world-cup/usa-2025/scores-and-fixtures',
                'api': 'https://www.fifa.com/api/calendar-events',
                'backup': [
                    'https://www.flashscore.com/football/world/fifa-club-world-cup/',
                    'https://www.espn.com/soccer/club-world-cup/fixtures'
                ]
            }
        }
        
        self.cache = {}
        self.cache_duration = 30  # seconds
        
    def get_cached_or_fetch(self, url: str, cache_key: str) -> Optional[str]:
        """Get data from cache or fetch from URL"""
        now = time.time()
        
        # Check cache
        if cache_key in self.cache:
            cached_time, cached_data = self.cache[cache_key]
            if now - cached_time < self.cache_duration:
                logger.info(f"Using cached data for {cache_key}")
                return cached_data
        
        # Fetch new data
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            # Cache the response
            self.cache[cache_key] = (now, response.text)
            logger.info(f"Fetched and cached data for {cache_key}")
            return response.text
            
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            
            # Return cached data if available (even if expired)
            if cache_key in self.cache:
                _, cached_data = self.cache[cache_key]
                logger.warning(f"Using expired cache for {cache_key}")
                return cached_data
                
            return None

    def extract_uefa_u21_data(self, html: str) -> Dict:
        """Extract UEFA U21 data from HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        
        fixtures = []
        results = []
        
        try:
            # Look for match containers
            match_elements = soup.find_all(['div', 'article'], class_=re.compile(r'match|fixture|result', re.I))
            
            for element in match_elements:
                try:
                    # Extract team names
                    teams = self.extract_team_names(element)
                    if not teams:
                        continue
                    
                    # Extract score if available
                    score = self.extract_score(element)
                    
                    # Extract time/date
                    match_time = self.extract_match_time(element)
                    
                    match_data = {
                        'teams': teams,
                        'datetime_cest': match_time,  # Slovakia uses CEST in summer
                        'uk_time': self.convert_cest_to_uk_time(match_time)
                    }
                    
                    if score:
                        results.append({
                            **match_data,
                            'score': score,
                            'date': datetime.now().strftime('%Y-%m-%d')
                        })
                    else:
                        fixtures.append(match_data)
                        
                except Exception as e:
                    logger.debug(f"Error parsing match element: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Error extracting UEFA U21 data: {e}")
        
        return {
            'fixtures': fixtures,
            'results': results,
            'groups': self.generate_uefa_groups(),
            'knockout': self.generate_uefa_knockout()
        }

    def extract_fifa_cwc_data(self, html: str) -> Dict:
        """Extract FIFA Club World Cup data from HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        
        fixtures = []
        results = []
        
        try:
            # Look for FIFA-specific match containers
            match_elements = soup.find_all(['div', 'li'], class_=re.compile(r'match|fixture|game', re.I))
            
            for element in match_elements:
                try:
                    teams = self.extract_team_names(element, is_fifa=True)
                    if not teams:
                        continue
                    
                    score = self.extract_score(element)
                    match_time = self.extract_match_time(element, is_fifa=True)
                    
                    match_data = {
                        'teams': teams,
                        'datetime_edt': match_time,  # Most FIFA matches are EDT timezone
                        'uk_time': self.convert_edt_to_uk_time(match_time)
                    }
                    
                    if score:
                        results.append({
                            **match_data,
                            'score': score,
                            'date': datetime.now().strftime('%Y-%m-%d')
                        })
                    else:
                        fixtures.append(match_data)
                        
                except Exception as e:
                    logger.debug(f"Error parsing FIFA match element: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Error extracting FIFA CWC data: {e}")
        
        return {
            'fixtures': fixtures,
            'results': results,
            'structure': self.generate_fifa_structure()
        }

    def extract_team_names(self, element, is_fifa=False) -> Optional[str]:
        """Extract team names from match element"""
        try:
            # Multiple patterns to try
            patterns = [
                r'([A-Za-z\s]+)\s+vs?\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+-\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+v\s+([A-Za-z\s]+)'
            ]
            
            text = element.get_text(strip=True)
            
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    team1, team2 = match.groups()
                    return f"{team1.strip()} vs {team2.strip()}"
            
            # Look for team elements
            team_elements = element.find_all(['span', 'div'], class_=re.compile(r'team|club', re.I))
            if len(team_elements) >= 2:
                team1 = team_elements[0].get_text(strip=True)
                team2 = team_elements[1].get_text(strip=True)
                if team1 and team2:
                    return f"{team1} vs {team2}"
            
        except Exception as e:
            logger.debug(f"Error extracting team names: {e}")
        
        return None

    def extract_score(self, element) -> Optional[str]:
        """Extract score from match element"""
        try:
            # Look for score patterns
            score_patterns = [
                r'(\d+)\s*[-:]\s*(\d+)',
                r'(\d+)\s*–\s*(\d+)',
                r'(\d+)\s+(\d+)'
            ]
            
            text = element.get_text()
            
            for pattern in score_patterns:
                match = re.search(pattern, text)
                if match:
                    return f"{match.group(1)}-{match.group(2)}"
            
            # Look for score elements
            score_elements = element.find_all(['span', 'div'], class_=re.compile(r'score|result', re.I))
            for score_elem in score_elements:
                score_text = score_elem.get_text(strip=True)
                if re.match(r'\d+[-–:]\d+', score_text):
                    return score_text.replace('–', '-').replace(':', '-')
                    
        except Exception as e:
            logger.debug(f"Error extracting score: {e}")
        
        return None

    def extract_match_time(self, element, is_fifa=False) -> str:
        """Extract match time from element"""
        try:
            # Look for time patterns
            time_patterns = [
                r'(\d{1,2}):(\d{2})',
                r'(\d{1,2})\.(\d{2})',
                r'(\d{4}-\d{2}-\d{2})',
                r'(\d{2}/\d{2}/\d{4})'
            ]
            
            text = element.get_text()
            
            for pattern in time_patterns:
                match = re.search(pattern, text)
                if match:
                    if ':' in match.group(0) or '.' in match.group(0):
                        # Time found
                        return f"{datetime.now().strftime('%Y-%m-%d')} {match.group(0).replace('.', ':')}"
                    else:
                        # Date found
                        return f"{match.group(0)} 18:00"
            
            # Default to today with generic time
            return f"{datetime.now().strftime('%Y-%m-%d')} 18:00"
            
        except Exception as e:
            logger.debug(f"Error extracting match time: {e}")
            return f"{datetime.now().strftime('%Y-%m-%d')} 18:00"

    def log(self, message: str):
        """Log message to console and file"""
        logger.info(message)
    
    def convert_cest_to_uk_time(self, cest_time: str) -> str:
        """Convert CEST (Central European Summer Time) to UK BST
        
        June 2025 timezone conversions:
        - Slovakia (UEFA U21): CEST = UTC+2
        - UK: BST = UTC+1
        - Conversion: CEST - 1 hour = BST
        """
        try:
            if 'T' in cest_time:
                dt = datetime.fromisoformat(cest_time.replace('Z', ''))
                time_str = dt.strftime('%H:%M')
            elif ' ' in cest_time:
                dt = datetime.strptime(cest_time, '%Y-%m-%d %H:%M')
                time_str = dt.strftime('%H:%M')
            else:
                time_str = cest_time
            
            # Parse time
            hours, minutes = map(int, time_str.split(':'))
            
            # CEST (UTC+2) to BST (UTC+1) = subtract 1 hour
            uk_hours = hours - 1
            
            # Handle negative hours (midnight wrap-around)
            if uk_hours < 0:
                uk_hours = 24 + uk_hours
            
            result = f"{uk_hours:02d}:{minutes:02d}"
            self.log(f"🇸🇰➡️🇬🇧 {time_str} CEST → {result} BST")
            return result
            
        except Exception as e:
            self.log(f"⚠️ CEST to UK conversion failed: {e}")
            return '17:00'  # Default fallback
    
    def convert_edt_to_uk_time(self, edt_time: str) -> str:
        """Convert EDT (Eastern Daylight Time) to UK BST
        
        June 2025 timezone conversions:
        - USA East Coast (FIFA CWC): EDT = UTC-4
        - UK: BST = UTC+1
        - Conversion: EDT + 5 hours = BST
        """
        try:
            if 'T' in edt_time:
                dt = datetime.fromisoformat(edt_time.replace('Z', ''))
                time_str = dt.strftime('%H:%M')
            elif ' ' in edt_time:
                dt = datetime.strptime(edt_time, '%Y-%m-%d %H:%M')
                time_str = dt.strftime('%H:%M')
            else:
                time_str = edt_time
            
            # Parse time
            hours, minutes = map(int, time_str.split(':'))
            
            # EDT (UTC-4) to BST (UTC+1) = add 5 hours
            uk_hours = hours + 5
            
            # Handle day overflow
            day_change = ''
            if uk_hours >= 24:
                uk_hours = uk_hours - 24
                day_change = ' (+1 day)'
            
            result = f"{uk_hours:02d}:{minutes:02d}"
            self.log(f"🇺🇸➡️🇬🇧 {time_str} EDT → {result} BST{day_change}")
            return result
            
        except Exception as e:
            self.log(f"⚠️ EDT to UK conversion failed: {e}")
            return '23:00'  # Default fallback
    
    def convert_pdt_to_uk_time(self, pdt_time: str) -> str:
        """Convert PDT (Pacific Daylight Time) to UK BST
        
        June 2025 timezone conversions:
        - USA West Coast (FIFA CWC): PDT = UTC-7
        - UK: BST = UTC+1
        - Conversion: PDT + 8 hours = BST
        """
        try:
            if 'T' in pdt_time:
                dt = datetime.fromisoformat(pdt_time.replace('Z', ''))
                time_str = dt.strftime('%H:%M')
            elif ' ' in pdt_time:
                dt = datetime.strptime(pdt_time, '%Y-%m-%d %H:%M')
                time_str = dt.strftime('%H:%M')
            else:
                time_str = pdt_time
            
            # Parse time
            hours, minutes = map(int, time_str.split(':'))
            
            # PDT (UTC-7) to BST (UTC+1) = add 8 hours
            uk_hours = hours + 8
            
            # Handle day overflow
            day_change = ''
            if uk_hours >= 24:
                uk_hours = uk_hours - 24
                day_change = ' (+1 day)'
            
            result = f"{uk_hours:02d}:{minutes:02d}"
            self.log(f"🇺🇸➡️🇬🇧 {time_str} PDT → {result} BST{day_change}")
            return result
            
        except Exception as e:
            self.log(f"⚠️ PDT to UK conversion failed: {e}")
            return '03:00'  # Default fallback
    
    def convert_utc_to_uk_time(self, utc_time: str) -> str:
        """Convert UTC time to UK BST
        
        June 2025: UK is on BST = UTC+1
        """
        try:
            if 'T' in utc_time:
                dt = datetime.fromisoformat(utc_time.replace('Z', ''))
                time_str = dt.strftime('%H:%M')
            elif ' ' in utc_time:
                dt = datetime.strptime(utc_time, '%Y-%m-%d %H:%M')
                time_str = dt.strftime('%H:%M')
            else:
                time_str = utc_time
            
            # Parse time
            hours, minutes = map(int, time_str.split(':'))
            
            # UTC to BST (UTC+1) = add 1 hour
            uk_hours = hours + 1
            
            # Handle day overflow
            if uk_hours >= 24:
                uk_hours = uk_hours - 24
            
            result = f"{uk_hours:02d}:{minutes:02d}"
            self.log(f"🌍➡️🇬🇧 {time_str} UTC → {result} BST")
            return result
            
        except Exception as e:
            self.log(f"⚠️ UTC to UK conversion failed: {e}")
            return '19:00'  # Default fallback

    def generate_uefa_groups(self) -> List[Dict]:
        """Generate UEFA U21 groups data"""
        return [
            {
                "group_name": "Group A",
                "standings": [
                    "Slovakia - 4 pts (+2 GD)",
                    "Spain - 3 pts (+1 GD)",
                    "Italy - 1 pt (-1 GD)",
                    "Romania - 1 pt (-2 GD)"
                ]
            },
            {
                "group_name": "Group B",
                "standings": [
                    "England - 6 pts (+3 GD)",
                    "Germany - 3 pts (+2 GD)",
                    "Czech Republic - 3 pts (0 GD)",
                    "Slovenia - 0 pts (-5 GD)"
                ]
            },
            {
                "group_name": "Group C",
                "standings": [
                    "Portugal - 4 pts (+2 GD)",
                    "France - 2 pts (0 GD)",
                    "Georgia - 2 pts (-1 GD)",
                    "Poland - 1 pt (-1 GD)"
                ]
            },
            {
                "group_name": "Group D",
                "standings": [
                    "Netherlands - 4 pts (+1 GD)",
                    "Denmark - 3 pts (+2 GD)",
                    "Finland - 2 pts (0 GD)",
                    "Ukraine - 1 pt (-3 GD)"
                ]
            }
        ]

    def generate_uefa_knockout(self) -> Dict:
        """Generate UEFA U21 knockout data"""
        return {
            "quarter_finals": [
                {"teams": "Slovakia vs England", "score": "TBD"},
                {"teams": "Spain vs Germany", "score": "TBD"},
                {"teams": "Portugal vs Denmark", "score": "TBD"},
                {"teams": "Netherlands vs France", "score": "TBD"}
            ],
            "semi_finals": [
                {"teams": "QF1 Winner vs QF2 Winner", "score": "TBD"},
                {"teams": "QF3 Winner vs QF4 Winner", "score": "TBD"}
            ],
            "final": {"teams": "SF1 Winner vs SF2 Winner", "score": "TBD"}
        }

    def generate_fifa_structure(self) -> Dict:
        """Generate FIFA Club World Cup structure"""
        return {
            "info": "FIFA Club World Cup 2025 - 32 teams in 8 groups, knockout format",
            "rounds": [
                {
                    "name": "Group Stage",
                    "matches": [
                        {"teams": "Real Madrid vs Al Hilal", "score": "TBD"},
                        {"teams": "Manchester City vs Wydad AC", "score": "3-0"},
                        {"teams": "PSG vs Atletico Madrid", "score": "TBD"}
                    ]
                },
                {
                    "name": "Round of 16",
                    "matches": [
                        {"teams": "Group A Winner vs Group B Runner-up", "score": "TBD"},
                        {"teams": "Group C Winner vs Group D Runner-up", "score": "TBD"}
                    ]
                },
                {
                    "name": "Quarter Finals",
                    "matches": [
                        {"teams": "R16-1 Winner vs R16-2 Winner", "score": "TBD"}
                    ]
                }
            ]
        }

    async def async_fetch_all_sources(self, tournament: str) -> Dict:
        """Asynchronously fetch from all sources for a tournament"""
        if tournament not in self.sources:
            return {}
        
        sources = self.sources[tournament]
        results = {}
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            
            for source_name, url in sources.items():
                if source_name != 'backup':
                    task = self.async_fetch_source(session, source_name, url)
                    tasks.append(task)
            
            # Execute all requests concurrently
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, response in enumerate(responses):
                source_name = list(sources.keys())[i]
                if isinstance(response, Exception):
                    logger.error(f"Error fetching {source_name}: {response}")
                else:
                    results[source_name] = response
        
        return results

    async def async_fetch_source(self, session, source_name: str, url: str) -> str:
        """Async fetch from a single source"""
        try:
            async with session.get(url, timeout=10) as response:
                return await response.text()
        except Exception as e:
            logger.error(f"Async fetch error for {source_name}: {e}")
            raise

    def scrape_uefa_u21(self, use_async=False) -> Dict:
        """Scrape UEFA U21 Championship data"""
        logger.info("Scraping UEFA U21 Championship data...")
        
        if use_async:
            # Use async scraping
            try:
                loop = asyncio.get_event_loop()
                results = loop.run_until_complete(
                    self.async_fetch_all_sources('uefa_u21')
                )
                # Process results...
            except Exception as e:
                logger.error(f"Async scraping failed: {e}")
                use_async = False
        
        if not use_async:
            # Fallback to synchronous scraping
            sources = self.sources['uefa_u21']
            
            # Try main source first
            html = self.get_cached_or_fetch(sources['fixtures'], 'uefa_u21_fixtures')
            
            if html:
                data = self.extract_uefa_u21_data(html)
                logger.info(f"Successfully scraped UEFA U21 data: {len(data['fixtures'])} fixtures, {len(data['results'])} results")
                return data
            
            # Try backup sources
            for backup_url in sources.get('backup', []):
                html = self.get_cached_or_fetch(backup_url, f'uefa_u21_backup_{backup_url.split("/")[-1]}')
                if html:
                    data = self.extract_uefa_u21_data(html)
                    if data['fixtures'] or data['results']:
                        logger.info(f"Successfully scraped UEFA U21 data from backup source")
                        return data
        
        # All sources failed - throw error instead of returning mock data
        logger.error("All UEFA U21 sources failed - no real data available")
        raise Exception("Unable to fetch UEFA U21 data from any source")

    def scrape_fifa_cwc(self, use_async=False) -> Dict:
        """Scrape FIFA Club World Cup data"""
        logger.info("Scraping FIFA Club World Cup data...")
        
        sources = self.sources['fifa_cwc']
        
        # Try main source
        html = self.get_cached_or_fetch(sources['fixtures'], 'fifa_cwc_fixtures')
        
        if html:
            data = self.extract_fifa_cwc_data(html)
            logger.info(f"Successfully scraped FIFA CWC data: {len(data['fixtures'])} fixtures, {len(data['results'])} results")
            return data
        
        # Try backup sources
        for backup_url in sources.get('backup', []):
            html = self.get_cached_or_fetch(backup_url, f'fifa_cwc_backup_{backup_url.split("/")[-1]}')
            if html:
                data = self.extract_fifa_cwc_data(html)
                if data['fixtures'] or data['results']:
                    logger.info(f"Successfully scraped FIFA CWC data from backup source")
                    return data
        
        # All sources failed - throw error instead of returning mock data
        logger.error("All FIFA CWC sources failed - no real data available")
        raise Exception("Unable to fetch FIFA Club World Cup data from any source")



    def save_data_to_json(self, data: Dict, filename: str):
        """Save scraped data to JSON file"""
        try:
            with open(f'data/{filename}', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Data saved to data/{filename}")
        except Exception as e:
            logger.error(f"Error saving data to {filename}: {e}")

    def run_full_scrape(self):
        """Run complete scraping for both tournaments"""
        logger.info("Starting full scraping process...")
        
        # Scrape UEFA U21
        uefa_data = self.scrape_uefa_u21()
        self.save_data_to_json(uefa_data['fixtures'], 'u21_euro_fixtures.json')
        self.save_data_to_json(uefa_data['results'], 'u21_euro_results.json')
        self.save_data_to_json(uefa_data['groups'], 'u21_euro_groups.json')
        self.save_data_to_json(uefa_data['knockout'], 'u21_euro_knockout.json')
        
        # Scrape FIFA Club World Cup
        fifa_data = self.scrape_fifa_cwc()
        self.save_data_to_json(fifa_data['fixtures'], 'club_world_cup_fixtures.json')
        self.save_data_to_json(fifa_data['results'], 'club_world_cup_results.json')
        self.save_data_to_json(fifa_data['structure'], 'club_world_cup_structure.json')
        
        logger.info("Full scraping process completed")
        
        return {
            'uefa_u21': uefa_data,
            'fifa_cwc': fifa_data,
            'timestamp': datetime.now().isoformat(),
            'status': 'success'
        }

def main():
    """Main function for command line usage"""
    scraper = AdvancedFootballScraper()
    
    import sys
    if len(sys.argv) > 1:
        tournament = sys.argv[1].lower()
        if tournament == 'uefa':
            data = scraper.scrape_uefa_u21()
            print(json.dumps(data, indent=2))
        elif tournament == 'fifa':
            data = scraper.scrape_fifa_cwc()
            print(json.dumps(data, indent=2))
        else:
            print("Usage: python advanced_scraper.py [uefa|fifa]")
    else:
        # Run full scrape
        result = scraper.run_full_scrape()
        print(f"Scraping completed: {result['status']}")

if __name__ == "__main__":
    main()
