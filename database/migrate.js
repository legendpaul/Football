// Database Migration Runner for Football Tracker
// Handles applying and tracking database schema changes

const fs = require('fs');
const path = require('path');

// Get database connection
let db;
try {
  db = require('./connection');
} catch (error) {
  console.error('❌ Could not load database connection module:', error.message);
  process.exit(1);
}

class MigrationRunner {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations');
    console.log('🗄️ Migration Runner initialized');
    console.log(`📁 Migrations directory: ${this.migrationsDir}`);
  }

  // Get all migration files in order
  getMigrationFiles() {
    try {
      if (!fs.existsSync(this.migrationsDir)) {
        console.log('📁 No migrations directory found');
        return [];
      }

      const files = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort to ensure proper order

      console.log(`📄 Found ${files.length} migration files:`, files);
      return files;
    } catch (error) {
      console.error('❌ Error reading migrations directory:', error);
      throw error;
    }
  }

  // Get applied migrations from database
  async getAppliedMigrations() {
    try {
      const result = await db.query(
        'SELECT version FROM schema_migrations ORDER BY applied_at ASC'
      );
      const applied = result.rows.map(row => row.version);
      console.log(`✅ Applied migrations: ${applied.length}`, applied);
      return applied;
    } catch (error) {
      console.log('⚠️ Schema migrations table not found, creating it...');
      
      // Create migrations table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Schema migrations table created');
      return [];
    }
  }

  // Get pending migrations
  async getPendingMigrations() {
    const migrationFiles = this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    
    const pending = migrationFiles.filter(file => {
      const version = path.basename(file, '.sql');
      return !appliedMigrations.includes(version);
    });

    console.log(`⏳ Pending migrations: ${pending.length}`, pending);
    return pending;
  }

  // Apply a single migration
  async applyMigration(migrationFile) {
    const version = path.basename(migrationFile, '.sql');
    const migrationPath = path.join(this.migrationsDir, migrationFile);
    
    try {
      console.log(`📥 Applying migration: ${version}`);
      
      // Read migration SQL
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      // Execute migration in a transaction
      await db.transaction(async (client) => {
        // Execute the migration SQL
        await client.query(sql);
        
        // Record the migration as applied
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
          [version]
        );
      });
      
      console.log(`✅ Migration applied successfully: ${version}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error applying migration ${version}:`, error);
      throw error;
    }
  }

  // Apply all pending migrations
  async applyPendingMigrations() {
    try {
      console.log('🚀 Starting migration process...');
      
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations, database is up to date');
        return;
      }
      
      console.log(`📊 Applying ${pendingMigrations.length} pending migrations...`);
      
      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }
      
      console.log('🎉 All migrations applied successfully!');
      
    } catch (error) {
      console.error('❌ Migration process failed:', error);
      throw error;
    }
  }

  // Show migration status
  async showStatus() {
    try {
      console.log('\n📊 Migration Status:');
      console.log('==================');
      
      const migrationFiles = this.getMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (migrationFiles.length === 0) {
        console.log('No migration files found');
        return;
      }
      
      migrationFiles.forEach(file => {
        const version = path.basename(file, '.sql');
        const isApplied = appliedMigrations.includes(version);
        const status = isApplied ? '✅ Applied' : '⏳ Pending';
        console.log(`${status} - ${version}`);
      });
      
      const pendingCount = migrationFiles.length - appliedMigrations.length;
      console.log(`\nSummary: ${appliedMigrations.length} applied, ${pendingCount} pending`);
      
    } catch (error) {
      console.error('❌ Error showing migration status:', error);
      throw error;
    }
  }

  // Rollback last migration (if rollback SQL is provided)
  async rollbackLastMigration() {
    try {
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (appliedMigrations.length === 0) {
        console.log('⚠️ No migrations to rollback');
        return;
      }
      
      const lastMigration = appliedMigrations[appliedMigrations.length - 1];
      console.log(`🔄 Rolling back migration: ${lastMigration}`);
      
      // Look for rollback file
      const rollbackFile = path.join(this.migrationsDir, `${lastMigration}.rollback.sql`);
      
      if (!fs.existsSync(rollbackFile)) {
        console.error(`❌ No rollback file found: ${rollbackFile}`);
        throw new Error('Rollback file not found');
      }
      
      const rollbackSql = fs.readFileSync(rollbackFile, 'utf8');
      
      // Execute rollback in a transaction
      await db.transaction(async (client) => {
        await client.query(rollbackSql);
        await client.query(
          'DELETE FROM schema_migrations WHERE version = $1',
          [lastMigration]
        );
      });
      
      console.log(`✅ Migration rolled back successfully: ${lastMigration}`);
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  // Database health check
  async healthCheck() {
    try {
      console.log('🏥 Performing database health check...');
      
      const health = await db.healthCheck();
      
      if (health.success) {
        console.log('✅ Database connection: OK');
        console.log(`📊 Database version: ${health.dbVersion}`);
        console.log(`⏰ Timestamp: ${health.timestamp}`);
        
        if (health.poolStats) {
          console.log(`🔗 Connection pool: ${health.poolStats.totalCount} total, ${health.poolStats.idleCount} idle`);
        }
      } else {
        console.error('❌ Database connection: FAILED');
        console.error(`Error: ${health.error}`);
      }
      
      return health.success;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const migrationRunner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'status':
        await migrationRunner.showStatus();
        break;
        
      case 'migrate':
        await migrationRunner.applyPendingMigrations();
        break;
        
      case 'rollback':
        await migrationRunner.rollbackLastMigration();
        break;
        
      case 'health':
        const isHealthy = await migrationRunner.healthCheck();
        process.exit(isHealthy ? 0 : 1);
        break;
        
      default:
        console.log(`
⚽ Football Tracker Database Migration Runner

Usage: node database/migrate.js <command>

Commands:
  status    Show migration status
  migrate   Apply pending migrations
  rollback  Rollback last migration
  health    Check database health

Examples:
  node database/migrate.js status
  node database/migrate.js migrate
  node database/migrate.js health
        `);
        break;
    }
    
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = MigrationRunner;

// Run CLI if called directly
if (require.main === module) {
  main();
}
