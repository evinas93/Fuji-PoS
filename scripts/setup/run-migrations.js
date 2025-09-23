// Migration runner script for Supabase
const fs = require('fs');
const path = require('path');

function readMigrationFile(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  return fs.readFileSync(filePath, 'utf8');
}

function displayMigrationInstructions() {
  console.log('🗄️ Database Migration Instructions\n');
  
  const migrations = [
    '001_initial_schema.sql',
    '002_functions_and_triggers.sql', 
    '003_sample_data.sql',
    '004_menu_search_function.sql'
  ];

  console.log('📋 Follow these steps in your Supabase SQL Editor:\n');

  migrations.forEach((filename, index) => {
    console.log(`Step ${index + 1}: Run ${filename}`);
    console.log('─'.repeat(50));
    
    try {
      const content = readMigrationFile(filename);
      console.log('SQL Content:');
      console.log(content);
      console.log('\n' + '='.repeat(80) + '\n');
    } catch (error) {
      console.log(`❌ Could not read ${filename}: ${error.message}\n`);
    }
  });

  console.log('📝 Instructions:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Click "SQL Editor" in the left sidebar');
  console.log('3. Copy and paste each migration above');
  console.log('4. Click "Run" to execute each migration');
  console.log('5. Run them in order: 001 → 002 → 003 → 004');
  console.log('6. After all migrations, run: node scripts/setup-database.js');
}

displayMigrationInstructions();
