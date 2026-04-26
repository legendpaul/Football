#!/usr/bin/env node
/**
 * Cron Scraper for Live Football Data
 * Automatically scrapes data at regular intervals and saves to JSON files
 */

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { execSync } = require('child_process');

class CronScraper {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.dataDir = path.join(this.projectRoot, 'data');
        this.logFile = path.join(this.projectRoot, 'cron-scraper.log');
        this.isRunning = false;
        
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        this.log('🔄 Cron Scraper initialized');
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        
        console.log(message);
        
        try {
            fs.appendFileSync(this.logFile, logMessage);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    async runPythonScraper() {
        this.log('🐍 Running Python scraper...');
        
        try {
            const scraperPath = path.join(this.projectRoot, 'advanced_scraper.py');
            
            if (!fs.existsSync(scraperPath)) {
                throw new Error('Python scraper not found');
            }

            // Run Python scraper
            const output = execSync(`python "${scraperPath}"`, {
                cwd: this.projectRoot,
                encoding: 'utf8',
                timeout: 60000 // 1 minute timeout
            });

            this.log('✅ Python scraper completed successfully');
            this.log(`📊 Output: ${output.trim()}`);
            
            return true;
        } catch (error) {
            this.log(`❌ Python scraper failed: ${error.message}`);
            return false;
        }
    }

    async runJavaScriptScraper() {
        this.log('🌐 Running JavaScript scraper fallback...');
        
        try {
            // Use the live scraper as fallback
            const LiveFootballScraper = require('../live-scraper.js');
            const scraper = new LiveFootballScraper();
            
            // Scrape UEFA U21 data
            const uefaData = await scraper.getUefaU21Data();
            await this.saveData('u21_euro_fixtures.json', uefaData.fixtures);
            await this.saveData('u21_euro_results.json', uefaData.results);
            await this.saveData('u21_euro_groups.json', uefaData.groups);
            await this.saveData('u21_euro_knockout.json', uefaData.knockout);
            
            // Scrape FIFA Club World Cup data
            const fifaData = await scraper.getFifaClubWorldCupData();
            await this.saveData('club_world_cup_fixtures.json', fifaData.fixtures);
            await this.saveData('club_world_cup_results.json', fifaData.results);
            await this.saveData('club_world_cup_structure.json', fifaData.structure);
            
            this.log('✅ JavaScript scraper completed successfully');
            return true;
        } catch (error) {
            this.log(`❌ JavaScript scraper failed: ${error.message}`);
            return false;
        }
    }

    async saveData(filename, data) {
        try {
            const filePath = path.join(this.dataDir, filename);
            const jsonData = JSON.stringify(data, null, 2);
            
            fs.writeFileSync(filePath, jsonData, 'utf8');
            this.log(`💾 Saved ${filename} (${jsonData.length} characters)`);
        } catch (error) {
            this.log(`❌ Failed to save ${filename}: ${error.message}`);
        }
    }

    async runScraping() {
        if (this.isRunning) {
            this.log('⏳ Scraping already in progress, skipping...');
            return;
        }

        this.isRunning = true;
        this.log('🚀 Starting scheduled data scraping...');

        try {
            // Try Python scraper first
            const pythonSuccess = await this.runPythonScraper();
            
            if (!pythonSuccess) {
                this.log('🔄 Python scraper failed, trying JavaScript fallback...');
                await this.runJavaScriptScraper();
            }

            // Update timestamp file
            const timestampFile = path.join(this.dataDir, 'last_update.json');
            const timestamp = {
                lastUpdate: new Date().toISOString(),
                method: pythonSuccess ? 'python' : 'javascript',
                success: true
            };
            
            fs.writeFileSync(timestampFile, JSON.stringify(timestamp, null, 2));
            
            this.log('🎉 Scheduled scraping completed successfully');
        } catch (error) {
            this.log(`❌ Scheduled scraping failed: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    setupCronJobs() {
        this.log('⏰ Setting up cron jobs...');

        // Every 30 seconds during tournament hours (9 AM to 11 PM UK time)
        cron.schedule('*/30 * 9-23 * * *', () => {
            this.runScraping();
        });

        // Every 2 minutes during off-hours
        cron.schedule('*/2 * 0-8,23 * * *', () => {
            this.runScraping();
        });

        // Health check every hour
        cron.schedule('0 * * * *', () => {
            this.healthCheck();
        });

        // Cleanup old logs daily
        cron.schedule('0 2 * * *', () => {
            this.cleanupLogs();
        });

        this.log('✅ Cron jobs configured:');
        this.log('   - Every 30 seconds (9 AM - 11 PM UK time)');
        this.log('   - Every 2 minutes (off-hours)');
        this.log('   - Health check every hour');
        this.log('   - Log cleanup daily at 2 AM');
    }

    healthCheck() {
        this.log('🏥 Performing health check...');

        try {
            // Check if data files exist and are recent
            const requiredFiles = [
                'u21_euro_fixtures.json',
                'club_world_cup_fixtures.json',
                'last_update.json'
            ];

            let healthScore = 0;
            const maxAge = 5 * 60 * 1000; // 5 minutes

            requiredFiles.forEach(filename => {
                const filePath = path.join(this.dataDir, filename);
                
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    const age = Date.now() - stats.mtime.getTime();
                    
                    if (age < maxAge) {
                        healthScore++;
                        this.log(`✅ ${filename} is up to date (${Math.round(age / 1000)}s old)`);
                    } else {
                        this.log(`⚠️ ${filename} is stale (${Math.round(age / 60000)}m old)`);
                    }
                } else {
                    this.log(`❌ ${filename} is missing`);
                }
            });

            const healthPercentage = (healthScore / requiredFiles.length) * 100;
            this.log(`📊 Health score: ${healthScore}/${requiredFiles.length} (${healthPercentage}%)`);

            if (healthPercentage < 70) {
                this.log('🚨 Health check failed - triggering immediate scraping');
                this.runScraping();
            }
        } catch (error) {
            this.log(`❌ Health check failed: ${error.message}`);
        }
    }

    cleanupLogs() {
        this.log('🧹 Cleaning up old logs...');

        try {
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                const sizeInMB = stats.size / (1024 * 1024);
                
                if (sizeInMB > 10) { // If log file is larger than 10MB
                    // Keep only the last 1000 lines
                    const content = fs.readFileSync(this.logFile, 'utf8');
                    const lines = content.split('\n');
                    const lastLines = lines.slice(-1000).join('\n');
                    
                    fs.writeFileSync(this.logFile, lastLines);
                    this.log(`🗑️ Trimmed log file (was ${sizeInMB.toFixed(2)}MB)`);
                }
            }
        } catch (error) {
            this.log(`❌ Log cleanup failed: ${error.message}`);
        }
    }

    async testScraping() {
        this.log('🧪 Running test scraping...');
        await this.runScraping();
    }

    start() {
        this.log('🎬 Starting Cron Scraper service...');
        this.setupCronJobs();
        
        // Run initial scraping
        this.runScraping();
        
        this.log('🚀 Cron Scraper service is running');
        this.log('📝 Log file: ' + this.logFile);
        this.log('📁 Data directory: ' + this.dataDir);
        
        // Keep the process running
        process.on('SIGINT', () => {
            this.log('🛑 Received SIGINT, shutting down gracefully...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            this.log('🛑 Received SIGTERM, shutting down gracefully...');
            process.exit(0);
        });
    }

    stop() {
        this.log('🛑 Stopping Cron Scraper service...');
        process.exit(0);
    }
}

// CLI Interface
async function main() {
    const command = process.argv[2];
    const scraper = new CronScraper();

    switch (command) {
        case 'start':
            scraper.start();
            break;
            
        case 'test':
            await scraper.testScraping();
            break;
            
        case 'health':
            scraper.healthCheck();
            break;
            
        case 'cleanup':
            scraper.cleanupLogs();
            break;
            
        case 'stop':
            scraper.stop();
            break;
            
        default:
            console.log(`
🔄 Football Data Cron Scraper

Usage: node scripts/cron-scraper.js <command>

Commands:
  start     Start the cron scraper service (runs continuously)
  test      Run a single scraping test
  health    Check health of data files
  cleanup   Clean up old log files
  stop      Stop the service

Examples:
  node scripts/cron-scraper.js start
  node scripts/cron-scraper.js test
  node scripts/cron-scraper.js health

The scraper will:
- Run every 30 seconds during tournament hours (9 AM - 11 PM UK)
- Run every 2 minutes during off-hours
- Perform health checks every hour
- Clean up logs daily

Log file: cron-scraper.log
Data saved to: data/ directory
            `);
            break;
    }
}

// Export for use as module
module.exports = CronScraper;

// Run CLI if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Cron scraper error:', error);
        process.exit(1);
    });
}
