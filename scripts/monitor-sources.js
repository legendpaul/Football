#!/usr/bin/env node
/**
 * Live Data Source Monitor
 * Monitors data sources for availability and data quality
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class DataSourceMonitor {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.logFile = path.join(this.projectRoot, 'monitor.log');
        this.alertThresholds = {
            responseTime: 10000,    // 10 seconds
            successRate: 80,        // 80% success rate
            dataAge: 300000,        // 5 minutes
            consecutiveFailures: 3   // 3 consecutive failures
        };
        
        this.sourceStats = new Map();
        this.isMonitoring = false;
        
        console.log('📊 Live Data Source Monitor initialized');
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}\n`;
        
        console.log(`[${level}] ${message}`);
        
        try {
            fs.appendFileSync(this.logFile, logMessage);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    async checkDataSource(name, url, timeout = 10000) {
        const startTime = Date.now();
        
        try {
            const response = await axios.get(url, {
                timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                validateStatus: () => true // Accept any status code
            });
            
            const responseTime = Date.now() - startTime;
            const success = response.status >= 200 && response.status < 500;
            
            return {
                success,
                responseTime,
                statusCode: response.status,
                contentLength: response.data ? response.data.length : 0,
                error: null
            };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            return {
                success: false,
                responseTime,
                statusCode: null,
                contentLength: 0,
                error: error.message
            };
        }
    }

    async checkCorsProxy(proxyUrl, testUrl = 'https://httpbin.org/status/200') {
        const fullUrl = proxyUrl + encodeURIComponent(testUrl);
        return await this.checkDataSource(`CORS-${proxyUrl}`, fullUrl, 5000);
    }

    updateSourceStats(sourceName, result) {
        if (!this.sourceStats.has(sourceName)) {
            this.sourceStats.set(sourceName, {
                totalRequests: 0,
                successfulRequests: 0,
                averageResponseTime: 0,
                consecutiveFailures: 0,
                lastSuccess: null,
                lastFailure: null,
                status: 'unknown'
            });
        }
        
        const stats = this.sourceStats.get(sourceName);
        
        stats.totalRequests++;
        
        if (result.success) {
            stats.successfulRequests++;
            stats.consecutiveFailures = 0;
            stats.lastSuccess = new Date().toISOString();
            stats.status = 'healthy';
        } else {
            stats.consecutiveFailures++;
            stats.lastFailure = new Date().toISOString();
            
            if (stats.consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
                stats.status = 'critical';
                this.log(`🚨 ALERT: ${sourceName} has ${stats.consecutiveFailures} consecutive failures`, 'ALERT');
            } else {
                stats.status = 'warning';
            }
        }
        
        // Update average response time
        const successRate = stats.successfulRequests / stats.totalRequests;
        stats.averageResponseTime = (stats.averageResponseTime * (stats.totalRequests - 1) + result.responseTime) / stats.totalRequests;
        
        // Log slow responses
        if (result.responseTime > this.alertThresholds.responseTime) {
            this.log(`⚠️ Slow response from ${sourceName}: ${result.responseTime}ms`, 'WARN');
        }
        
        // Log low success rate
        if (successRate < (this.alertThresholds.successRate / 100) && stats.totalRequests >= 5) {
            this.log(`⚠️ Low success rate for ${sourceName}: ${(successRate * 100).toFixed(1)}%`, 'WARN');
        }
        
        this.sourceStats.set(sourceName, stats);
    }

    async monitorUefaSources() {
        const sources = [
            'https://www.uefa.com/under21/fixtures-results/',
            'https://www.uefa.com/under21/standings/',
            'https://www.flashscore.com/football/europe/euro-u21/',
            'https://www.espn.com/soccer/uefa-u21/fixtures'
        ];
        
        const results = [];
        
        for (const url of sources) {
            const sourceName = `UEFA-${new URL(url).hostname}`;
            const result = await this.checkDataSource(sourceName, url);
            
            this.updateSourceStats(sourceName, result);
            results.push({ sourceName, ...result });
            
            this.log(`${sourceName}: ${result.success ? '✅' : '❌'} ${result.responseTime}ms (${result.statusCode || 'ERROR'})`);
        }
        
        return results;
    }

    async monitorFifaSources() {
        const sources = [
            'https://www.fifa.com/en/tournaments/mens/club-world-cup/usa-2025/scores-and-fixtures',
            'https://www.flashscore.com/football/world/fifa-club-world-cup/',
            'https://www.espn.com/soccer/club-world-cup/fixtures'
        ];
        
        const results = [];
        
        for (const url of sources) {
            const sourceName = `FIFA-${new URL(url).hostname}`;
            const result = await this.checkDataSource(sourceName, url);
            
            this.updateSourceStats(sourceName, result);
            results.push({ sourceName, ...result });
            
            this.log(`${sourceName}: ${result.success ? '✅' : '❌'} ${result.responseTime}ms (${result.statusCode || 'ERROR'})`);
        }
        
        return results;
    }

    async monitorCorsProxies() {
        const proxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?'
        ];
        
        const results = [];
        
        for (const proxy of proxies) {
            const result = await this.checkCorsProxy(proxy);
            const sourceName = `CORS-${new URL(proxy).hostname}`;
            
            this.updateSourceStats(sourceName, result);
            results.push({ sourceName, ...result });
            
            this.log(`${sourceName}: ${result.success ? '✅' : '❌'} ${result.responseTime}ms`);
        }
        
        return results;
    }

    async checkDataFreshness() {
        const dataDir = path.join(this.projectRoot, 'data');
        const results = [];
        
        if (!fs.existsSync(dataDir)) {
            this.log('❌ Data directory not found', 'ERROR');
            return results;
        }
        
        const dataFiles = [
            'u21_euro_fixtures.json',
            'club_world_cup_fixtures.json',
            'last_update.json'
        ];
        
        for (const filename of dataFiles) {
            const filePath = path.join(dataDir, filename);
            
            if (fs.existsSync(filePath)) {
                try {
                    const stats = fs.statSync(filePath);
                    const age = Date.now() - stats.mtime.getTime();
                    const isFresh = age < this.alertThresholds.dataAge;
                    
                    results.push({
                        file: filename,
                        age: age,
                        fresh: isFresh,
                        size: stats.size
                    });
                    
                    const ageMinutes = Math.round(age / 60000);
                    const status = isFresh ? '✅' : '⚠️';
                    this.log(`${status} ${filename}: ${ageMinutes}m old (${stats.size} bytes)`);
                    
                    if (!isFresh) {
                        this.log(`⚠️ Data file ${filename} is stale (${ageMinutes} minutes old)`, 'WARN');
                    }
                    
                    // Check if file is valid JSON
                    const content = fs.readFileSync(filePath, 'utf8');
                    JSON.parse(content);
                    
                } catch (error) {
                    this.log(`❌ Error checking ${filename}: ${error.message}`, 'ERROR');
                    results.push({
                        file: filename,
                        age: null,
                        fresh: false,
                        error: error.message
                    });
                }
            } else {
                this.log(`❌ Data file missing: ${filename}`, 'ERROR');
                results.push({
                    file: filename,
                    age: null,
                    fresh: false,
                    missing: true
                });
            }
        }
        
        return results;
    }

    async checkScraperHealth() {
        this.log('🔍 Checking scraper health...');
        
        const results = {
            liveScraperJs: false,
            pythonScraper: false,
            cronScraper: false
        };
        
        // Check JavaScript live scraper
        try {
            const LiveFootballScraper = require(path.join(this.projectRoot, 'live-scraper.js'));
            const scraper = new LiveFootballScraper();
            
            // Test mock data generation
            const mockData = scraper.getMockUefaU21Data();
            results.liveScraperJs = mockData && mockData.fixtures && mockData.fixtures.length > 0;
            
            this.log(`${results.liveScraperJs ? '✅' : '❌'} JavaScript live scraper: ${results.liveScraperJs ? 'Working' : 'Failed'}`);
            
        } catch (error) {
            this.log(`❌ JavaScript live scraper error: ${error.message}`, 'ERROR');
        }
        
        // Check Python scraper
        try {
            const { execSync } = require('child_process');
            const scraperPath = path.join(this.projectRoot, 'advanced_scraper.py');
            
            if (fs.existsSync(scraperPath)) {
                // Just check if Python can import required modules
                execSync('python -c "import requests, json, re; print(\'OK\')"', {
                    cwd: this.projectRoot,
                    timeout: 5000
                });
                
                results.pythonScraper = true;
                this.log('✅ Python scraper: Dependencies available');
            } else {
                this.log('❌ Python scraper: Script not found', 'ERROR');
            }
            
        } catch (error) {
            this.log(`❌ Python scraper error: ${error.message}`, 'ERROR');
        }
        
        // Check if cron scraper is running
        try {
            const cronLogPath = path.join(this.projectRoot, 'cron-scraper.log');
            if (fs.existsSync(cronLogPath)) {
                const stats = fs.statSync(cronLogPath);
                const age = Date.now() - stats.mtime.getTime();
                const recentActivity = age < 300000; // 5 minutes
                
                results.cronScraper = recentActivity;
                this.log(`${recentActivity ? '✅' : '⚠️'} Cron scraper: ${recentActivity ? 'Active' : 'No recent activity'}`);
            } else {
                this.log('⚠️ Cron scraper: No log file found');
            }
            
        } catch (error) {
            this.log(`❌ Cron scraper check error: ${error.message}`, 'ERROR');
        }
        
        return results;
    }

    generateHealthReport() {
        console.log('\n📊 Data Source Health Report');
        console.log('============================');
        
        if (this.sourceStats.size === 0) {
            console.log('No monitoring data available yet.');
            return;
        }
        
        const healthyCount = Array.from(this.sourceStats.values()).filter(stats => stats.status === 'healthy').length;
        const warningCount = Array.from(this.sourceStats.values()).filter(stats => stats.status === 'warning').length;
        const criticalCount = Array.from(this.sourceStats.values()).filter(stats => stats.status === 'critical').length;
        
        console.log(`📈 Sources Status:`);
        console.log(`   ✅ Healthy: ${healthyCount}`);
        console.log(`   ⚠️ Warning: ${warningCount}`);
        console.log(`   🚨 Critical: ${criticalCount}`);
        
        console.log('\n📋 Source Details:');
        
        for (const [sourceName, stats] of this.sourceStats.entries()) {
            const successRate = ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1);
            const avgResponseTime = Math.round(stats.averageResponseTime);
            
            const statusIcon = {
                'healthy': '✅',
                'warning': '⚠️',
                'critical': '🚨',
                'unknown': '❓'
            }[stats.status];
            
            console.log(`${statusIcon} ${sourceName}:`);
            console.log(`   Success Rate: ${successRate}% (${stats.successfulRequests}/${stats.totalRequests})`);
            console.log(`   Avg Response: ${avgResponseTime}ms`);
            console.log(`   Consecutive Failures: ${stats.consecutiveFailures}`);
            
            if (stats.lastSuccess) {
                console.log(`   Last Success: ${new Date(stats.lastSuccess).toLocaleString()}`);
            }
            
            if (stats.lastFailure) {
                console.log(`   Last Failure: ${new Date(stats.lastFailure).toLocaleString()}`);
            }
            
            console.log('');
        }
    }

    async runFullMonitoring() {
        this.log('🚀 Starting full monitoring cycle...');
        
        const results = {
            timestamp: new Date().toISOString(),
            uefa: await this.monitorUefaSources(),
            fifa: await this.monitorFifaSources(),
            corsProxies: await this.monitorCorsProxies(),
            dataFreshness: await this.checkDataFreshness(),
            scraperHealth: await this.checkScraperHealth()
        };
        
        this.log('✅ Full monitoring cycle completed');
        
        return results;
    }

    async startContinuousMonitoring(intervalMinutes = 5) {
        this.log(`🔄 Starting continuous monitoring (every ${intervalMinutes} minutes)...`);
        this.isMonitoring = true;
        
        const runMonitoring = async () => {
            if (!this.isMonitoring) return;
            
            try {
                await this.runFullMonitoring();
                this.generateHealthReport();
            } catch (error) {
                this.log(`❌ Monitoring cycle error: ${error.message}`, 'ERROR');
            }
            
            if (this.isMonitoring) {
                setTimeout(runMonitoring, intervalMinutes * 60 * 1000);
            }
        };
        
        // Run initial monitoring
        await runMonitoring();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.log('🛑 Stopping continuous monitoring...');
            this.isMonitoring = false;
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            this.log('🛑 Stopping continuous monitoring...');
            this.isMonitoring = false;
            process.exit(0);
        });
    }

    stopMonitoring() {
        this.isMonitoring = false;
        this.log('🛑 Monitoring stopped');
    }

    async exportReport(format = 'json') {
        const report = {
            timestamp: new Date().toISOString(),
            sourceStats: Object.fromEntries(this.sourceStats),
            summary: {
                totalSources: this.sourceStats.size,
                healthySources: Array.from(this.sourceStats.values()).filter(s => s.status === 'healthy').length,
                warningSources: Array.from(this.sourceStats.values()).filter(s => s.status === 'warning').length,
                criticalSources: Array.from(this.sourceStats.values()).filter(s => s.status === 'critical').length
            }
        };
        
        const filename = `monitor-report-${new Date().toISOString().split('T')[0]}.${format}`;
        const filepath = path.join(this.projectRoot, filename);
        
        if (format === 'json') {
            fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        } else if (format === 'csv') {
            const csv = this.convertToCSV(report);
            fs.writeFileSync(filepath, csv);
        }
        
        this.log(`📄 Report exported to ${filename}`);
        return filepath;
    }

    convertToCSV(report) {
        const headers = ['Source', 'Status', 'Success Rate', 'Avg Response Time', 'Total Requests', 'Consecutive Failures'];
        const rows = [headers.join(',')];
        
        for (const [sourceName, stats] of Object.entries(report.sourceStats)) {
            const successRate = ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1);
            const row = [
                sourceName,
                stats.status,
                `${successRate}%`,
                `${Math.round(stats.averageResponseTime)}ms`,
                stats.totalRequests,
                stats.consecutiveFailures
            ];
            rows.push(row.join(','));
        }
        
        return rows.join('\n');
    }
}

// CLI Interface
async function main() {
    const command = process.argv[2];
    const monitor = new DataSourceMonitor();
    
    try {
        switch (command) {
            case 'run':
            case undefined:
                await monitor.runFullMonitoring();
                monitor.generateHealthReport();
                break;
                
            case 'continuous':
                const interval = parseInt(process.argv[3]) || 5;
                await monitor.startContinuousMonitoring(interval);
                break;
                
            case 'uefa':
                await monitor.monitorUefaSources();
                break;
                
            case 'fifa':
                await monitor.monitorFifaSources();
                break;
                
            case 'cors':
                await monitor.monitorCorsProxies();
                break;
                
            case 'data':
                await monitor.checkDataFreshness();
                break;
                
            case 'scraper':
                await monitor.checkScraperHealth();
                break;
                
            case 'report':
                const format = process.argv[3] || 'json';
                await monitor.runFullMonitoring();
                const reportPath = await monitor.exportReport(format);
                console.log(`Report saved to: ${reportPath}`);
                break;
                
            case 'health':
                monitor.generateHealthReport();
                break;
                
            default:
                console.log(`
📊 Live Data Source Monitor

Usage: node scripts/monitor-sources.js <command> [options]

Commands:
  run           Run one-time monitoring of all sources (default)
  continuous    Start continuous monitoring (specify interval in minutes)
  uefa          Monitor only UEFA sources
  fifa          Monitor only FIFA sources
  cors          Monitor only CORS proxies
  data          Check data file freshness
  scraper       Check scraper health
  report        Generate and export detailed report (json|csv)
  health        Show current health status

Examples:
  node scripts/monitor-sources.js run
  node scripts/monitor-sources.js continuous 5
  node scripts/monitor-sources.js report json
  node scripts/monitor-sources.js uefa

The monitor will:
- Check response times and availability
- Track success rates over time
- Alert on consecutive failures
- Monitor data file freshness
- Check scraper functionality

Log file: monitor.log
                `);
                break;
        }
    } catch (error) {
        console.error('❌ Monitor error:', error);
        process.exit(1);
    }
}

// Export for use as module
module.exports = DataSourceMonitor;

// Run CLI if called directly
if (require.main === module) {
    main();
}
