"""
Reliable Football API Client - Python Implementation
Server-side alternative to JavaScript client
Uses multiple API sources with proper error handling
"""

import requests
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
import concurrent.futures
from functools import wraps
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ReliableFootballAPIPython:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/html, */*',
            'Accept-Language': 'en-US,en;q=0.9'
        })
        
        self.cache = {}
        self.cache_timeout = 300  # 5 minutes
        self.request_timeout = 15
        self.max_retries = 3
        
        # API Configuration
        self.api_config = {
            'football_data': {
                'base_url': 'https://api.football-data.org/v4',
                'headers': {'X-Auth-Token': os.getenv('FOOTBALL_DATA_API_KEY', '')},
                'rate_limit': 10  # requests per minute for free tier
            },
            'sports_db': {
                'base_url': 'https://www.thesportsdb.com/api/v1/json',
                'free_tier': True
            },
            'espn': {
                'base_url': 'https://site.api.espn.com/apis/site/v2/sports/soccer',
                'public_endpoints': True
            }
        }
        
        logger.info("🚀 Reliable Football API Python client initialized")

    def cache_result(self, timeout_seconds=300):
        """Decorator for caching API results"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Create cache key from function name and arguments
                cache_key = f"{func.__name__}_{hash(str(args) + str(kwargs))}"
                
                # Check cache
                if cache_key in self.cache:
                    cached_time, cached_data = self.cache[cache_key]
                    if time.time() - cached_time < timeout_seconds:
                        logger.info(f"📋 Using cached data for {func.__name__}")
                        return cached_data
                
                # Execute function and cache result
                result = func(*args, **kwargs)
                self.cache[cache_key] = (time.time(), result)
                return result
            return wrapper
        return decorator

    @cache_result(timeout_seconds=300)
    def get_uefa_u21_data(self) -> Dict:
        """Get UEFA U21 Championship data from multiple sources"""
        logger.info("🔍 Fetching UEFA U21 Euro 2025 data...")
        
        # Try multiple data sources
        data_sources = [
            self._get_from_football_data_org,
            self._get_from_sports_db,
            self._get_from_espn_soccer,
            self._get_fallback_european_data
        ]
        
        for source_func in data_sources:
            try:
                data = source_func('uefa-u21')
                if data and (data.get('fixtures') or data.get('results')):
                    logger.info(f"✅ Got data from {source_func.__name__}")
                    return data
            except Exception as e:
                logger.warning(f"❌ {source_func.__name__} failed: {e}")
                continue
        
        # Return empty data if all sources fail
        return self._get_empty_tournament_data('UEFA U21 Euro 2025')

    @cache_result(timeout_seconds=300)
    def get_fifa_club_world_cup_data(self) -> Dict:
        """Get FIFA Club World Cup data from multiple sources"""
        logger.info("🔍 Fetching FIFA Club World Cup 2025 data...")
        
        data_sources = [
            self._get_from_football_data_org,
            self._get_from_sports_db,
            self._get_from_espn_soccer,
            self._get_fallback_club_data
        ]
        
        for source_func in data_sources:
            try:
                data = source_func('fifa-cwc')
                if data and (data.get('fixtures') or data.get('results')):
                    logger.info(f"✅ Got data from {source_func.__name__}")
                    return data
            except Exception as e:
                logger.warning(f"❌ {source_func.__name__} failed: {e}")
                continue
        
        return self._get_empty_tournament_data('FIFA Club World Cup 2025')

    def _get_from_football_data_org(self, competition: str) -> Optional[Dict]:
        """Fetch data from Football-Data.org API"""
        try:
            logger.info("🌐 Trying Football-Data.org API...")
            
            # Competition mapping
            competition_ids = {
                'uefa-u21': 'competitions/european-championship-u21',
                'fifa-cwc': 'competitions/fifa-club-world-cup',
                'champions-league': 'competitions/CL',
                'europa-league': 'competitions/EL'
            }
            
            endpoint = competition_ids.get(competition, competition_ids['champions-league'])
            url = f"{self.api_config['football_data']['base_url']}/{endpoint}/matches"
            
            headers = {}
            if self.api_config['football_data']['headers']['X-Auth-Token']:
                headers = self.api_config['football_data']['headers']
            
            response = self.session.get(url, headers=headers, timeout=self.request_timeout)
            response.raise_for_status()
            
            data = response.json()
            return self._parse_football_data_response(data)
            
        except requests.RequestException as e:
            logger.error(f"Football-Data.org API error: {e}")
            return None

    def _get_from_sports_db(self, competition: str) -> Optional[Dict]:
        """Fetch data from TheSportsDB API"""
        try:
            logger.info("🏆 Trying TheSportsDB API...")
            
            # Try multiple endpoints
            endpoints = [
                f"{self.api_config['sports_db']['base_url']}/1/eventsseason.php?id=4328&s=2025",  # UEFA
                f"{self.api_config['sports_db']['base_url']}/1/eventsnext.php?id=133604",  # FIFA
                f"{self.api_config['sports_db']['base_url']}/1/eventsround.php?id=4328&r=1&s=2025"
            ]
            
            for url in endpoints:
                try:
                    response = self.session.get(url, timeout=self.request_timeout)
                    response.raise_for_status()
                    
                    data = response.json()
                    parsed_data = self._parse_sports_db_response(data)
                    
                    if parsed_data and (parsed_data.get('fixtures') or parsed_data.get('results')):
                        return parsed_data
                except requests.RequestException:
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"SportsDB API error: {e}")
            return None

    def _get_from_espn_soccer(self, competition: str) -> Optional[Dict]:
        """Fetch data from ESPN Soccer API"""
        try:
            logger.info("📺 Trying ESPN Soccer API...")
            
            # Try different competition endpoints
            endpoints = [
                f"{self.api_config['espn']['base_url']}/uefa.euro/scoreboard",
                f"{self.api_config['espn']['base_url']}/uefa.champions.league/scoreboard",
                f"{self.api_config['espn']['base_url']}/fifa.world/scoreboard"
            ]
            
            for url in endpoints:
                try:
                    response = self.session.get(url, timeout=self.request_timeout)
                    response.raise_for_status()
                    
                    data = response.json()
                    parsed_data = self._parse_espn_response(data)
                    
                    if parsed_data and (parsed_data.get('fixtures') or parsed_data.get('results')):
                        return parsed_data
                except requests.RequestException:
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"ESPN API error: {e}")
            return None

    def _get_fallback_european_data(self, competition: str) -> Dict:
        """Get current European competition data as fallback"""
        logger.info("🔄 Using European football fallback data...")
        
        try:
            # Try Champions League or Europa League as fallback
            data = self._get_from_football_data_org('champions-league')
            if data:
                data['fallback'] = True
                data['source'] = 'Champions League (fallback)'
                return data
        except Exception:
            pass
        
        return self._get_sample_european_data()

    def _get_fallback_club_data(self, competition: str) -> Dict:
        """Get current club competition data as fallback"""
        logger.info("🔄 Using club football fallback data...")
        
        try:
            data = self._get_from_football_data_org('champions-league')
            if data:
                data['fallback'] = True
                data['source'] = 'Champions League (fallback)'
                return data
        except Exception:
            pass
        
        return self._get_sample_club_data()

    def _parse_football_data_response(self, data: Dict) -> Dict:
        """Parse Football-Data.org API response"""
        fixtures = []
        results = []
        
        matches = data.get('matches', [])
        
        for match in matches:
            match_data = {
                'teams': f"{match.get('homeTeam', {}).get('name', 'TBD')} vs {match.get('awayTeam', {}).get('name', 'TBD')}",
                'datetime_utc': match.get('utcDate', ''),
                'uk_time': self._convert_utc_to_uk(match.get('utcDate', ''))
            }
            
            if match.get('status') == 'FINISHED' and match.get('score', {}).get('fullTime'):
                score = match['score']['fullTime']
                results.append({
                    **match_data,
                    'score': f"{score.get('homeTeam', 0)}-{score.get('awayTeam', 0)}",
                    'date': self._format_date(match.get('utcDate', ''))
                })
            else:
                fixtures.append(match_data)
        
        return {
            'fixtures': fixtures,
            'results': results,
            'live': [],
            'groups': [],
            'knockout': {}
        }

    def _parse_sports_db_response(self, data: Dict) -> Dict:
        """Parse TheSportsDB API response"""
        fixtures = []
        results = []
        
        events = data.get('events', [])
        
        for event in events:
            match_data = {
                'teams': f"{event.get('strHomeTeam', 'TBD')} vs {event.get('strAwayTeam', 'TBD')}",
                'datetime_utc': f"{event.get('dateEvent', '')} {event.get('strTime', '18:00')}",
                'uk_time': self._convert_utc_to_uk(f"{event.get('dateEvent', '')} {event.get('strTime', '18:00')}")
            }
            
            home_score = event.get('intHomeScore')
            away_score = event.get('intAwayScore')
            
            if home_score is not None and away_score is not None:
                results.append({
                    **match_data,
                    'score': f"{home_score}-{away_score}",
                    'date': event.get('dateEvent', '')
                })
            else:
                fixtures.append(match_data)
        
        return {
            'fixtures': fixtures,
            'results': results,
            'live': [],
            'groups': [],
            'knockout': {}
        }

    def _parse_espn_response(self, data: Dict) -> Dict:
        """Parse ESPN API response"""
        fixtures = []
        results = []
        
        events = data.get('events', [])
        
        for event in events:
            competitions = event.get('competitions', [])
            if not competitions:
                continue
                
            competition = competitions[0]
            competitors = competition.get('competitors', [])
            
            if len(competitors) >= 2:
                home_team = next((c for c in competitors if c.get('homeAway') == 'home'), {})
                away_team = next((c for c in competitors if c.get('homeAway') == 'away'), {})
                
                match_data = {
                    'teams': f"{home_team.get('team', {}).get('displayName', 'TBD')} vs {away_team.get('team', {}).get('displayName', 'TBD')}",
                    'datetime_utc': event.get('date', ''),
                    'uk_time': self._convert_utc_to_uk(event.get('date', ''))
                }
                
                status = competition.get('status', {})
                if status.get('type', {}).get('completed'):
                    home_score = home_team.get('score', 0)
                    away_score = away_team.get('score', 0)
                    results.append({
                        **match_data,
                        'score': f"{home_score}-{away_score}",
                        'date': self._format_date(event.get('date', ''))
                    })
                else:
                    fixtures.append(match_data)
        
        return {
            'fixtures': fixtures,
            'results': results,
            'live': [],
            'groups': [],
            'knockout': {}
        }

    def _convert_utc_to_uk(self, utc_time_str: str) -> str:
        """Convert UTC time to UK BST (UTC+1 in June 2025)"""
        try:
            if not utc_time_str:
                return '18:00'
            
            # Parse the UTC time
            if 'T' in utc_time_str:
                dt = datetime.fromisoformat(utc_time_str.replace('Z', ''))
            else:
                dt = datetime.strptime(utc_time_str, '%Y-%m-%d %H:%M')
            
            # Add 1 hour for BST
            uk_dt = dt + timedelta(hours=1)
            return uk_dt.strftime('%H:%M')
            
        except (ValueError, TypeError):
            return '18:00'

    def _format_date(self, date_str: str) -> str:
        """Format date string for display"""
        try:
            if not date_str:
                return datetime.now().strftime('%Y-%m-%d')
            
            if 'T' in date_str:
                dt = datetime.fromisoformat(date_str.replace('Z', ''))
            else:
                dt = datetime.strptime(date_str, '%Y-%m-%d')
            
            return dt.strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            return datetime.now().strftime('%Y-%m-%d')

    def _get_sample_european_data(self) -> Dict:
        """Generate sample European football data"""
        return {
            'fixtures': [
                {
                    'teams': 'Spain vs Germany',
                    'datetime_utc': '2025-06-30 19:00:00',
                    'uk_time': '20:00'
                },
                {
                    'teams': 'France vs Portugal',
                    'datetime_utc': '2025-07-01 19:00:00',
                    'uk_time': '20:00'
                }
            ],
            'results': [
                {
                    'teams': 'Italy vs Netherlands',
                    'score': '2-1',
                    'date': '2025-06-28'
                }
            ],
            'live': [],
            'groups': [],
            'knockout': {},
            'fallback': True,
            'source': 'Sample European data'
        }

    def _get_sample_club_data(self) -> Dict:
        """Generate sample club football data"""
        return {
            'fixtures': [
                {
                    'teams': 'Real Madrid vs Manchester City',
                    'datetime_utc': '2025-06-30 18:00:00',
                    'uk_time': '19:00'
                },
                {
                    'teams': 'PSG vs Bayern Munich',
                    'datetime_utc': '2025-07-01 18:00:00',
                    'uk_time': '19:00'
                }
            ],
            'results': [
                {
                    'teams': 'Chelsea vs Barcelona',
                    'score': '1-2',
                    'date': '2025-06-28'
                }
            ],
            'live': [],
            'structure': {
                'info': 'FIFA Club World Cup 2025',
                'rounds': []
            },
            'fallback': True,
            'source': 'Sample club data'
        }

    def _get_empty_tournament_data(self, tournament_name: str) -> Dict:
        """Return empty tournament data structure"""
        return {
            'fixtures': [],
            'results': [],
            'live': [],
            'groups': [],
            'knockout': {},
            'structure': {},
            'message': f'No data available for {tournament_name}',
            'timestamp': datetime.now().isoformat()
        }

    def clear_cache(self):
        """Clear the internal cache"""
        self.cache.clear()
        logger.info("🗑️ Cache cleared")

    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        return {
            'cache_size': len(self.cache),
            'cache_timeout': self.cache_timeout,
            'cache_keys': list(self.cache.keys())
        }

# Flask web server implementation
def create_flask_app():
    """Create a Flask app to serve the API"""
    try:
        from flask import Flask, jsonify, request
        from flask_cors import CORS
    except ImportError:
        logger.error("Flask not installed. Run: pip install flask flask-cors")
        return None
    
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Initialize API client
    api_client = ReliableFootballAPIPython()
    
    @app.route('/api/uefa-u21', methods=['GET'])
    def get_uefa_u21():
        """Get UEFA U21 Euro data"""
        try:
            data = api_client.get_uefa_u21_data()
            return jsonify(data)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/fifa-cwc', methods=['GET'])
    def get_fifa_cwc():
        """Get FIFA Club World Cup data"""
        try:
            data = api_client.get_fifa_club_world_cup_data()
            return jsonify(data)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/cache/clear', methods=['POST'])
    def clear_cache():
        """Clear the API cache"""
        api_client.clear_cache()
        return jsonify({'message': 'Cache cleared'})
    
    @app.route('/api/cache/stats', methods=['GET'])
    def cache_stats():
        """Get cache statistics"""
        stats = api_client.get_cache_stats()
        return jsonify(stats)
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'cache_size': len(api_client.cache)
        })
    
    return app

# Command line interface
def main():
    """Command line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Reliable Football API Client')
    parser.add_argument('--tournament', choices=['uefa', 'fifa'], 
                       help='Tournament to fetch data for')
    parser.add_argument('--server', action='store_true', 
                       help='Start Flask web server')
    parser.add_argument('--port', type=int, default=5000, 
                       help='Port for Flask server (default: 5000)')
    
    args = parser.parse_args()
    
    if args.server:
        # Start Flask server
        app = create_flask_app()
        if app:
            logger.info(f"🚀 Starting Flask server on port {args.port}")
            app.run(host='0.0.0.0', port=args.port, debug=True)
        else:
            logger.error("Failed to create Flask app")
        return
    
    # Command line data fetching
    api_client = ReliableFootballAPIPython()
    
    if args.tournament == 'uefa':
        data = api_client.get_uefa_u21_data()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    elif args.tournament == 'fifa':
        data = api_client.get_fifa_club_world_cup_data()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        # Fetch both tournaments
        print("UEFA U21 Euro 2025:")
        uefa_data = api_client.get_uefa_u21_data()
        print(json.dumps(uefa_data, indent=2, ensure_ascii=False))
        
        print("\nFIFA Club World Cup 2025:")
        fifa_data = api_client.get_fifa_club_world_cup_data()
        print(json.dumps(fifa_data, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
