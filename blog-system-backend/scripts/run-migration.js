const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

const runMigration = async () => {
  try {
    console.log('Running comment enhancements migration...');
    
    const migrationFile = path.join(__dirname, '../database-migrations/add-comment-enhancements.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      await pool.query(statement);
      console.log('✓ Success');
    }
    
    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
};

runMigration();
