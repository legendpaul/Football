# Football Tracker - Live Data Integration 🔴 LIVE

## Version 3.0 - Enhanced with Real-Time Data Scraping

This project now includes **live data scraping** that automatically fetches real-time match data from multiple sources every 30 seconds.

### 🎯 Features

- **🔴 Live Data**: Auto-refreshes every 30 seconds
- **🏆 Multiple Tournaments**: UEFA U21 Euro 2025 & FIFA Club World Cup 2025
- **⚽ Real-Time Sources**: UEFA.com, FIFA.com, Flashscore, and more
- **⭐ Favorite Teams**: Track your preferred teams across tournaments
- **📱 Responsive Design**: Works on all devices
- **🔧 Debug Tools**: Monitor data fetching and processing

### 🚀 Quick Start

#### Option 1: Use Live Data Version (Recommended)
```bash
# Open the live data version
open index-live.html
```

#### Option 2: Use Original Static Version
```bash
# Open the original version with static data
open index.html
```

### 📁 File Structure

```
Football/
├── index-live.html          # 🔴 LIVE DATA VERSION (main entry point)
├── index.html               # Original static version
├── live-scraper.js          # Live data scraping engine
├── app-live.js              # Enhanced application with live features
├── styles-live.css          # Enhanced styles for live data
├── app-web-fixed.js         # Original application
├── styles.css               # Original styles
└── data/                    # Static fallback data
    ├── u21_euro_fixtures.json
    ├── club_world_cup_fixtures.json
    └── ...
```

### 🌐 Data Sources

The live scraper fetches data from multiple reliable sources:

1. **UEFA.com** - Official UEFA U21 Championship data
2. **FIFA.com** - Official FIFA Club World Cup data  
3. **Flashscore** - Real-time scores and statistics
4. **Google Sports** - Backup data source

### ⚙️ Configuration

#### Auto-Refresh Settings
- **Interval**: 30 seconds (configurable in `app-live.js`)
- **Silent Refresh**: Updates data without disrupting user experience
- **Manual Refresh**: Users can manually trigger updates

#### Tournament Support
- **UEFA U21 Euro 2025** (Slovakia, June 11-28, 2025)
- **FIFA Club World Cup 2025** (USA, June 14 - July 13, 2025)

### 🔧 Technical Details

#### CORS Handling
The scraper uses multiple CORS proxy services to handle cross-origin requests:
- `cors-anywhere.herokuapp.com`
- `api.allorigins.win`
- `corsproxy.io`

#### Error Handling
- **Fallback Data**: Uses mock data when scraping fails
- **Proxy Rotation**: Automatically switches proxies on failure
- **Cache System**: 30-second cache to reduce API calls

#### Data Processing
1. **Fetch**: Retrieve HTML from sports websites
2. **Parse**: Extract match data using regex patterns
3. **Filter**: Apply favorite team filters
4. **Display**: Update UI with processed data

### 🛠️ Development

#### Local Testing
```bash
# Serve the files locally (Python)
python -m http.server 8000

# Or use Node.js
npx http-server

# Then open http://localhost:8000/index-live.html
```

#### Adding New Data Sources
1. Add URL to `live-scraper.js`
2. Create parsing function for the HTML structure
3. Update the scraper rotation logic

#### Customizing Refresh Interval
```javascript
// In app-live.js, modify this line:
this.REFRESH_INTERVAL = 30000; // 30 seconds (change as needed)
```

### 📊 Live Data Debug

The application includes comprehensive debugging tools:

1. **Live Requests** - Monitor API calls and responses
2. **API Response** - View raw data from sources
3. **Processed Data** - See how data is filtered and processed
4. **Console Logs** - Real-time application logs

### 🎨 UI Features

#### Live Indicators
- **🔴 LIVE** badges for active matches
- **Pulsing dots** to show auto-refresh status
- **Manual refresh** button for instant updates

#### Enhanced Match Display
- **Favorite star** (⭐) for preferred teams
- **Live scores** with real-time updates
- **Time zones** automatically converted to UK time
- **Match status** (Upcoming, Live, Finished)

### 🔐 Production Deployment

#### Netlify Configuration
The project includes Netlify functions for database integration:

```bash
# Deploy to Netlify
npm run build
npm run deploy
```

#### Environment Variables
- `DATABASE_URL` - Neon PostgreSQL connection string
- `CORS_PROXY` - Custom CORS proxy URL (optional)

### 📱 Mobile Support

The live data system is fully responsive:
- **Touch-friendly** refresh controls
- **Optimized layouts** for small screens
- **Fast loading** with progressive enhancement

### 🚨 Known Limitations

1. **CORS Restrictions**: Some sports websites block scraping
2. **Rate Limiting**: May be temporarily blocked by source websites
3. **Data Accuracy**: Dependent on source website structure
4. **Browser Support**: Requires modern browsers with ES6+ support

### 🔄 Fallback Strategy

When live data fails:
1. Use cached data (if available)
2. Fall back to static JSON files
3. Display mock data with clear indicators
4. Retry with different proxy/source

### 📈 Performance

- **Caching**: 30-second cache reduces server load
- **Lazy Loading**: Only fetch data when needed
- **Progressive Enhancement**: Works without JavaScript
- **Optimized Parsing**: Efficient regex patterns

### 🤝 Contributing

To add support for new tournaments:

1. Add parsing logic in `live-scraper.js`
2. Update tournament dropdown in HTML
3. Add mock data for fallback
4. Test with multiple data sources

### 📝 License

MIT License - Feel free to use and modify as needed.

---

## 🎯 Usage Examples

### Basic Usage
1. Open `index-live.html` in your browser
2. Select a tournament (UEFA U21 or FIFA Club World Cup)
3. Click "Get Live Data" to start auto-refresh
4. View live scores, fixtures, and results

### Adding Favorite Teams
1. Enter team name in the input field
2. Click "Add Favorite" or press Enter
3. Matches featuring your teams will be highlighted with ⭐
4. Data will be filtered to show only your favorites

### Viewing Different Data Types
- **Fixtures**: Upcoming matches with times
- **Results**: Completed matches with scores  
- **Live**: Currently active matches
- **Tournament**: Group tables and knockout brackets

### Debugging Data Issues
1. Scroll to "Live Data Debug Information"
2. Click through the tabs to see:
   - API request details
   - Raw response data
   - Processed/filtered results
   - Console logs and errors

---

**Enjoy real-time football data with automatic updates every 30 seconds! ⚽🔴**
