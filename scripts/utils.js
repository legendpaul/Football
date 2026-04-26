#!/usr/bin/env node
// Football Tracker Development and Deployment Utility Scripts
// Provides common development tasks and deployment helpers

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FootballTrackerUtils {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.packageJsonPath = path.join(this.projectRoot, 'netlify', 'functions', 'package.json');
    
    console.log('⚽ Football Tracker Utilities initialized');
    console.log(`📁 Project root: ${this.projectRoot}`);
  }

  // Setup development environment
  async setupDev() {
    console.log('🚀 Setting up development environment...');
    
    try {
      // Check if .env exists
      const envPath = path.join(this.projectRoot, '.env');
      const envExamplePath = path.join(this.projectRoot, '.env.example');
      
      if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
        console.log('📝 Creating .env from .env.example...');
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created - please update with your credentials');
      }
      
      // Install function dependencies
      const functionsDir = path.join(this.projectRoot, 'netlify', 'functions');
      if (fs.existsSync(this.packageJsonPath)) {
        console.log('📦 Installing function dependencies...');
        execSync('npm install', { cwd: functionsDir, stdio: 'inherit' });
      }
      
      // Check for Netlify CLI
      try {
        execSync('netlify --version', { stdio: 'pipe' });
        console.log('✅ Netlify CLI is installed');
      } catch (error) {
        console.log('⚠️ Netlify CLI not found. Install with: npm install -g netlify-cli');
      }
      
      console.log('🎉 Development environment setup complete!');
      console.log('🚀 Run "npm run dev" or "netlify dev" to start development server');
      console.log('⚽ Set FOOTBALL_API_KEY, DATABASE_URL, and other environment variables');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  // Build for production
  async buildProd() {
    console.log('🏗️ Building for production...');
    
    try {
      // Switch to production version of files
      const indexPath = path.join(this.projectRoot, 'index.html');
      const appPath = path.join(this.projectRoot, 'app-web-fixed.js');
      
      // Backup current files
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, path.join(this.projectRoot, 'index-backup.html'));
      }
      if (fs.existsSync(appPath)) {
        fs.copyFileSync(appPath, path.join(this.projectRoot, 'app-web-backup.js'));
      }
      
      // Install production dependencies
      const functionsDir = path.join(this.projectRoot, 'netlify', 'functions');
      if (fs.existsSync(this.packageJsonPath)) {
        console.log('📦 Installing production dependencies...');
        execSync('npm install --production', { cwd: functionsDir, stdio: 'inherit' });
      }
      
      console.log('✅ Production build complete!');
      console.log('🚀 Ready for deployment to Netlify');
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  // Restore development files
  async restoreDev() {
    console.log('🔄 Restoring development files...');
    
    try {
      const indexBackupPath = path.join(this.projectRoot, 'index-backup.html');
      const appBackupPath = path.join(this.projectRoot, 'app-web-backup.js');
      const indexPath = path.join(this.projectRoot, 'index.html');
      const appPath = path.join(this.projectRoot, 'app-web-fixed.js');
      
      if (fs.existsSync(indexBackupPath)) {
        console.log('📄 Restoring original HTML...');
        fs.copyFileSync(indexBackupPath, indexPath);
        fs.unlinkSync(indexBackupPath);
      }
      
      if (fs.existsSync(appBackupPath)) {
        console.log('📄 Restoring original JavaScript...');
        fs.copyFileSync(appBackupPath, appPath);
        fs.unlinkSync(appBackupPath);
      }
      
      console.log('✅ Development files restored!');
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      process.exit(1);
    }
  }

  // Check project health
  async healthCheck() {
    console.log('🏥 Performing project health check...');
    
    const checks = [];
    
    // Check required files
    const requiredFiles = [
      'index.html',
      'app-web-fixed.js',
      'config-web.js',
      'styles.css',
      '.env.example',
      'database/schema.sql',
      'database/connection.js',
      'netlify/functions/package.json'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      const exists = fs.existsSync(filePath);
      checks.push({
        name: `File: ${file}`,
        status: exists ? 'OK' : 'MISSING',
        success: exists
      });
    });
    
    // Check environment file
    const envPath = path.join(this.projectRoot, '.env');
    const hasEnv = fs.existsSync(envPath);
    checks.push({
      name: 'Environment file (.env)',
      status: hasEnv ? 'OK' : 'MISSING - copy from .env.example',
      success: hasEnv
    });
    
    // Check function dependencies
    const nodeModulesPath = path.join(this.projectRoot, 'netlify', 'functions', 'node_modules');
    const hasDeps = fs.existsSync(nodeModulesPath);
    checks.push({
      name: 'Function dependencies',
      status: hasDeps ? 'OK' : 'MISSING - run npm install in netlify/functions',
      success: hasDeps
    });
    
    // Check for Netlify CLI
    let hasNetlifyCli = true;
    try {
      execSync('netlify --version', { stdio: 'pipe' });
    } catch (error) {
      hasNetlifyCli = false;
    }
    checks.push({
      name: 'Netlify CLI',
      status: hasNetlifyCli ? 'OK' : 'NOT INSTALLED - npm install -g netlify-cli',
      success: hasNetlifyCli
    });
    
    // Check football data files
    const dataDir = path.join(this.projectRoot, 'data');
    const hasDataDir = fs.existsSync(dataDir);
    checks.push({
      name: 'Football data directory',
      status: hasDataDir ? 'OK' : 'MISSING - create data/ directory',
      success: hasDataDir
    });
    
    // Display results
    console.log('\n📊 Health Check Results:');
    console.log('========================');
    
    let allGood = true;
    checks.forEach(check => {
      const icon = check.success ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.status}`);
      if (!check.success) allGood = false;
    });
    
    console.log(`\n${allGood ? '🎉' : '⚠️'} Overall status: ${allGood ? 'HEALTHY' : 'NEEDS ATTENTION'}`);
    
    if (!allGood) {
      console.log('\n🔧 Recommended actions:');
      console.log('- Run "node scripts/utils.js setup" to fix common issues');
      console.log('- Set Football API credentials in .env file');
      console.log('- Set DATABASE_URL for Neon PostgreSQL connection');
    }
    
    return allGood;
  }

  // Database utilities
  async dbUtils(action) {
    console.log(`🗄️ Database utilities: ${action}`);
    
    const migratePath = path.join(this.projectRoot, 'database', 'migrate.js');
    
    if (!fs.existsSync(migratePath)) {
      console.error('❌ Migration script not found');
      process.exit(1);
    }
    
    try {
      execSync(`node "${migratePath}" ${action}`, { 
        cwd: this.projectRoot, 
        stdio: 'inherit' 
      });
    } catch (error) {
      console.error(`❌ Database ${action} failed:`, error.message);
      process.exit(1);
    }
  }

  // Clean up temporary files
  async cleanup() {
    console.log('🧹 Cleaning up temporary files...');
    
    const tempFiles = [
      'index-backup.html',
      'app-web-backup.js'
    ];
    
    let cleaned = 0;
    tempFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        cleaned++;
        console.log(`🗑️ Removed: ${file}`);
      }
    });
    
    if (cleaned === 0) {
      console.log('✨ No temporary files to clean');
    } else {
      console.log(`✅ Cleaned ${cleaned} temporary files`);
    }
  }

  // Show project status
  async status() {
    console.log('📊 Football Tracker Project Status');
    console.log('==================================');
    
    // Current version detection
    const indexPath = path.join(this.projectRoot, 'index.html');
    let version = 'Unknown';
    
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      if (content.includes('Football Tracker')) {
        version = 'Football Tracker (Production Ready)';
      } else {
        version = 'Custom Version';
      }
    }
    
    console.log(`⚽ Current Version: ${version}`);
    
    // Environment status
    const envPath = path.join(this.projectRoot, '.env');
    const hasEnv = fs.existsSync(envPath);
    console.log(`🔧 Environment: ${hasEnv ? 'Configured' : 'Not configured'}`);
    
    // Dependencies status
    const nodeModulesPath = path.join(this.projectRoot, 'netlify', 'functions', 'node_modules');
    const hasDeps = fs.existsSync(nodeModulesPath);
    console.log(`📦 Dependencies: ${hasDeps ? 'Installed' : 'Not installed'}`);
    
    // Football data status
    const dataDir = path.join(this.projectRoot, 'data');
    const hasData = fs.existsSync(dataDir);
    if (hasData) {
      const dataFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
      console.log(`⚽ Football Data: ${dataFiles.length} JSON files`);
    } else {
      console.log(`⚽ Football Data: No data directory`);
    }
    
    // Git status (if available)
    try {
      const gitStatus = execSync('git status --porcelain', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      });
      const hasChanges = gitStatus.trim().length > 0;
      console.log(`📂 Git Status: ${hasChanges ? 'Has uncommitted changes' : 'Clean'}`);
    } catch (error) {
      console.log('📂 Git Status: Not a git repository');
    }
  }

  // Initialize football data
  async initData() {
    console.log('⚽ Initializing football data...');
    
    const dataDir = path.join(this.projectRoot, 'data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory');
    }
    
    // Create sample tournament data if it doesn't exist
    const sampleTournaments = [
      {
        name: 'FIFA Club World Cup',
        year: 2025,
        start_date: '2025-06-15',
        end_date: '2025-07-13',
        type: 'international'
      },
      {
        name: 'UEFA Euro U21',
        year: 2025,
        start_date: '2025-06-11',
        end_date: '2025-06-28',
        type: 'international'
      }
    ];
    
    const tournamentsFile = path.join(dataDir, 'tournaments.json');
    if (!fs.existsSync(tournamentsFile)) {
      fs.writeFileSync(tournamentsFile, JSON.stringify(sampleTournaments, null, 2));
      console.log('⚽ Created sample tournaments.json');
    }
    
    console.log('✅ Football data initialization complete');
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const subCommand = process.argv[3];
  const utils = new FootballTrackerUtils();
  
  try {
    switch (command) {
      case 'setup':
        await utils.setupDev();
        break;
        
      case 'build':
        await utils.buildProd();
        break;
        
      case 'restore':
        await utils.restoreDev();
        break;
        
      case 'health':
        const isHealthy = await utils.healthCheck();
        process.exit(isHealthy ? 0 : 1);
        break;
        
      case 'db':
        if (!subCommand) {
          console.log('Available db commands: status, migrate, health');
          process.exit(1);
        }
        await utils.dbUtils(subCommand);
        break;
        
      case 'cleanup':
        await utils.cleanup();
        break;
        
      case 'status':
        await utils.status();
        break;
        
      case 'init-data':
        await utils.initData();
        break;
        
      default:
        console.log(`
⚽ Football Tracker Utilities

Usage: node scripts/utils.js <command> [options]

Commands:
  setup       Setup development environment
  build       Build for production deployment
  restore     Restore development files after build
  health      Check project health
  status      Show project status
  cleanup     Clean temporary files
  init-data   Initialize sample football data
  db <cmd>    Database utilities (status, migrate, health)

Examples:
  node scripts/utils.js setup
  node scripts/utils.js build
  node scripts/utils.js health
  node scripts/utils.js init-data
  node scripts/utils.js db status
  node scripts/utils.js db migrate

Environment Variables:
  FOOTBALL_API_KEY      - Primary football API key
  SPORTSDATA_API_KEY    - Secondary sports data API key
  APIFOOTBALL_KEY       - Free tier API key
  FOOTBALL_PROVIDER     - API provider (primary/secondary/free)
  DATABASE_URL          - Neon PostgreSQL connection string
  NEON_DATABASE_URL     - Alternative Neon connection string
        `);
        break;
    }
    
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = FootballTrackerUtils;

// Run CLI if called directly
if (require.main === module) {
  main();
}
