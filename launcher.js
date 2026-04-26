#!/usr/bin/env node
/**
 * Football Tracker Launcher
 * Simple script to start the project in different modes
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class FootballLauncher {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        console.log('⚽ Football Tracker Launcher');
        console.log('============================');
    }

    checkDependencies() {
        console.log('🔍 Checking dependencies...');
        
        const checks = [];
        
        // Check Node.js
        try {
            const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
            checks.push({ name: 'Node.js', status: 'OK', version: nodeVersion });
        } catch {
            checks.push({ name: 'Node.js', status: 'MISSING', version: null });
        }
        
        // Check Python
        try {
            const pythonVersion = execSync('python --version', { encoding: 'utf8' }).trim();
            checks.push({ name: 'Python', status: 'OK', version: pythonVersion });
        } catch {
            checks.push({ name: 'Python', status: 'MISSING', version: null });
        }
        
        // Check Netlify CLI
        try {
            const netlifyVersion = execSync('netlify --version', { encoding: 'utf8' }).trim();
            checks.push({ name: 'Netlify CLI', status: 'OK', version: netlifyVersion });
        } catch {
            checks.push({ name: 'Netlify CLI', status: 'OPTIONAL', version: null });
        }
        
        // Display results
        checks.forEach(check => {
            const icon = check.status === 'OK' ? '✅' : check.status === 'MISSING' ? '❌' : '⚠️';
            const versionStr = check.version ? ` (${check.version})` : '';
            console.log(`${icon} ${check.name}${versionStr}`);
        });
        
        const missingDeps = checks.filter(check => check.status === 'MISSING');
        if (missingDeps.length > 0) {
            console.log('\n❌ Missing dependencies. Please install:');
            missingDeps.forEach(dep => {
                if (dep.name === 'Node.js') {
                    console.log('   - Node.js: https://nodejs.org/');
                } else if (dep.name === 'Python') {
                    console.log('   - Python: https://python.org/');
                }
            });
            return false;
        }
        
        console.log('✅ All dependencies available\n');
        return true;
    }

    async startLiveVersion() {
        console.log('🔴 Starting Live Data Version...');
        console.log('Features: Auto-refresh every 30 seconds, real-time data from multiple sources');
        console.log('URL: http://localhost:8000/index-live.html\n');
        
        try {
            // Check if Python dependencies are available
            console.log('📦 Checking Python dependencies...');
            try {
                execSync('python -c "import requests, bs4"', { encoding: 'utf8' });
                console.log('✅ Python dependencies available');
            } catch {
                console.log('⚠️ Some Python dependencies missing. Install with:');
                console.log('   pip install -r requirements.txt');
            }
            
            // Start the server
            console.log('🚀 Starting development server...');
            console.log('📁 Serving from:', this.projectRoot);
            console.log('🌐 Open: http://localhost:8000/index-live.html');
            console.log('📄 Original version: http://localhost:8000/index.html');
            console.log('\nPress Ctrl+C to stop\n');
            
            const server = spawn('python', ['-m', 'http.server', '8000'], {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
            
            // Handle shutdown
            process.on('SIGINT', () => {
                console.log('\n🛑 Shutting down server...');
                server.kill();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('❌ Failed to start server:', error.message);
            console.log('\n💡 Alternative: Open index-live.html directly in your browser');
        }
    }

    async startOriginalVersion() {
        console.log('📊 Starting Original Version...');
        console.log('Features: Static data, Neon DB integration');
        console.log('URL: http://localhost:8000/index.html\n');
        
        try {
            console.log('🚀 Starting development server...');
            console.log('🌐 Open: http://localhost:8000/index.html');
            console.log('🔴 Live version: http://localhost:8000/index-live.html');
            console.log('\nPress Ctrl+C to stop\n');
            
            const server = spawn('python', ['-m', 'http.server', '8000'], {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
            
            process.on('SIGINT', () => {
                console.log('\n🛑 Shutting down server...');
                server.kill();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('❌ Failed to start server:', error.message);
        }
    }

    async startNetlifyDev() {
        console.log('🌐 Starting Netlify Development Server...');
        console.log('Features: Serverless functions, production simulation');
        
        try {
            console.log('🚀 Starting Netlify dev server...');
            const server = spawn('netlify', ['dev'], {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
            
            process.on('SIGINT', () => {
                console.log('\n🛑 Shutting down Netlify dev server...');
                server.kill();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('❌ Failed to start Netlify dev server:', error.message);
            console.log('💡 Make sure Netlify CLI is installed: npm install -g netlify-cli');
        }
    }

    async startDataScraper() {
        console.log('🕷️ Starting Data Scraper...');
        
        try {
            console.log('🐍 Running Python scraper...');
            execSync('python advanced_scraper.py', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
            
            console.log('✅ Scraping completed');
            
        } catch (error) {
            console.error('❌ Scraping failed:', error.message);
            console.log('💡 Make sure Python dependencies are installed: pip install -r requirements.txt');
        }
    }

    async startCronScraper() {
        console.log('⏰ Starting Cron Scraper (Continuous)...');
        console.log('Will scrape data every 30 seconds during tournament hours');
        
        try {
            const scraper = spawn('node', ['scripts/cron-scraper.js', 'start'], {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
            
            process.on('SIGINT', () => {
                console.log('\n🛑 Stopping cron scraper...');
                scraper.kill();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('❌ Failed to start cron scraper:', error.message);
        }
    }

    async runTests() {
        console.log('🧪 Running Live Data Tests...');
        
        try {
            execSync('node scripts/test-live-data.js all', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
            
        } catch (error) {
            console.error('❌ Tests failed:', error.message);
        }
    }

    async showStatus() {
        console.log('📊 Project Status\n');
        
        try {
            execSync('node scripts/utils.js status', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
            
        } catch (error) {
            console.error('❌ Failed to get status:', error.message);
        }
    }

    displayMenu() {
        console.log('🎯 Available Commands:');
        console.log('======================');
        console.log('1. live        - Start live data version (recommended)');
        console.log('2. original    - Start original static version');
        console.log('3. netlify     - Start Netlify development server');
        console.log('4. scrape      - Run data scraper once');
        console.log('5. cron        - Start continuous data scraper');
        console.log('6. test        - Run live data tests');
        console.log('7. status      - Show project status');
        console.log('8. setup       - Setup development environment');
        console.log('9. help        - Show this menu');
        console.log('\nExamples:');
        console.log('  node launcher.js live');
        console.log('  node launcher.js scrape');
        console.log('  node launcher.js test');
    }

    async setup() {
        console.log('🛠️ Setting up development environment...');
        
        try {
            // Run setup utility
            execSync('node scripts/utils.js setup', {
                cwd: this.projectRoot,
                stdio: 'inherit'
            });
            
            // Install Python dependencies if requirements.txt exists
            const requirementsPath = path.join(this.projectRoot, 'requirements.txt');
            if (fs.existsSync(requirementsPath)) {
                console.log('\n📦 Installing Python dependencies...');
                try {
                    execSync('pip install -r requirements.txt', {
                        cwd: this.projectRoot,
                        stdio: 'inherit'
                    });
                    console.log('✅ Python dependencies installed');
                } catch (error) {
                    console.log('⚠️ Failed to install Python dependencies automatically');
                    console.log('   Run manually: pip install -r requirements.txt');
                }
            }
            
            console.log('\n🎉 Setup completed!');
            console.log('▶️ Run "node launcher.js live" to start the live data version');
            
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
        }
    }

    async run(command) {
        if (!this.checkDependencies()) {
            return;
        }

        switch (command) {
            case 'live':
                await this.startLiveVersion();
                break;
                
            case 'original':
                await this.startOriginalVersion();
                break;
                
            case 'netlify':
                await this.startNetlifyDev();
                break;
                
            case 'scrape':
                await this.startDataScraper();
                break;
                
            case 'cron':
                await this.startCronScraper();
                break;
                
            case 'test':
                await this.runTests();
                break;
                
            case 'status':
                await this.showStatus();
                break;
                
            case 'setup':
                await this.setup();
                break;
                
            case 'help':
            case undefined:
                this.displayMenu();
                break;
                
            default:
                console.log(`❌ Unknown command: ${command}`);
                console.log('Run "node launcher.js help" for available commands');
                break;
        }
    }
}

// Run the launcher
async function main() {
    const command = process.argv[2];
    const launcher = new FootballLauncher();
    
    try {
        await launcher.run(command);
    } catch (error) {
        console.error('❌ Launcher error:', error);
        process.exit(1);
    }
}

// Export for use as module
module.exports = FootballLauncher;

// Run if called directly
if (require.main === module) {
    main();
}
