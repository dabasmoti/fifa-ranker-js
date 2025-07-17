#!/usr/bin/env node

/**
 * One-time migration script to import existing match data
 * Run with: node scripts/import-match-data.js
 */

import { sql } from '@vercel/postgres';
import { Player } from '../src/entities/Player.js';
import { Season } from '../src/entities/Season.js';
import { Match } from '../src/entities/Match.js';

// Your match data
const matchData = `team1_player1,team1_player2,team2_player1,team2_player2,team1_score,team2_score,date
Moti,Uri,Asaf,Chen,4,2,2025-07-16 21:03:26
Moti,Uri,Asaf,Baki,2,1,2025-07-16 20:44:27
Moti,Uri,Chen,Baki,3,0,2025-07-16 20:26:59
Moti,Uri,Chen,Baki,3,0,2025-07-16 20:26:44
Moti,Asaf,Chen,Baki,0,3,2025-07-16 20:26:21
Uri,Asaf,Chen,Moti,3,1,2025-07-16 19:57:28
Uri,Asaf,Baki,Moti,3,0,2025-07-16 19:45:31
Uri,Asaf,Baki,Chen,3,2,2025-07-16 19:37:14
Moti,Chen,Uri,Asaf,2,5,2025-07-16 18:44:51
Moti,Baki,Asaf,Chen,0,3,2025-07-13 21:33:48
Moti,Baki,Asaf,Chen,3,0,2025-07-13 21:33:26
Moti,Baki,Asaf,Uri,4,3,2025-07-13 21:14:27
Moti,Chen,Uri,Asaf,0,1,2025-07-13 21:01:16
Moti,Chen,Uri,Baki,4,0,2025-07-13 20:42:25
Chen,Asaf,Baki,Uri,4,3,2025-07-13 20:04:39
Chen,Asaf,Baki,Uri,4,1,2025-07-13 19:45:54
Chen,Asaf,Baki,Uri,1,0,2025-07-13 19:45:06
Moti,Asaf,Uri,Baki,0,3,2025-07-13 19:09:52
Moti,Chen,Uri,Baki,2,3,2025-07-13 18:56:19
Moti,Chen,Uri,Asaf,1,0,2025-07-13 18:30:32
Baki,Asaf,Uri,Nir,3,0,2025-07-10 08:49:28
Nir,Uri,Baki,Asaf,4,1,2025-07-10 02:43:36
Baki,Asaf,Chen,Nir,5,4,2025-07-10 02:42:55
Chen,Nir,Uri,Baki,3,1,2025-07-10 02:42:08
Baki,Uri,Asaf,Chen,3,2,2025-07-10 02:41:17
Baki,Uri,Asaf,Nir,3,0,2025-07-10 02:40:53
Baki,Uri,Chen,Nir,4,3,2025-07-10 02:40:19
Chen,Nir,Uri,Asaf,4,2,2025-07-10 02:39:37
Asaf,Uri,Chen,Baki,3,2,2025-07-10 02:38:56
Asaf,Uri,Nir,Baki,2,1,2025-07-10 02:38:13
Baki,Nir,Chen,Asaf,2,0,2025-07-10 02:37:16
Asaf,Chen,Moti,Uri,3,2,2025-07-06 21:00:00
Asaf,Chen,Moti,Uri,3,2,2025-07-06 20:39:59
Baki,Chen,Moti,Uri,0,2,2025-07-06 20:23:02
Asaf,Chen,Moti,Uri,2,3,2025-07-06 20:09:18
Asaf,Chen,Baki,Uri,4,1,2025-07-06 19:48:54
Moti,Asaf,Baki,Uri,1,4,2025-07-06 19:32:34
Moti,Chen,Uri,Baki,1,2,2025-07-06 19:16:05
Moti,Chen,Asaf,Baki,2,2,2025-07-06 18:52:13`;

/**
 * Parse CSV data into structured matches
 */
function parseMatchData(csvData) {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  const matches = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const match = {
      team1_player1: values[0].trim(),
      team1_player2: values[1].trim(),
      team2_player1: values[2].trim(),
      team2_player2: values[3].trim(),
      team1_score: parseInt(values[4]),
      team2_score: parseInt(values[5]),
      match_date: values[6].trim()
    };
    matches.push(match);
  }

  return matches;
}

/**
 * Get all unique player names from match data
 */
function extractUniquePlayerNames(matches) {
  const playerNames = new Set();
  
  matches.forEach(match => {
    playerNames.add(match.team1_player1);
    playerNames.add(match.team1_player2);
    playerNames.add(match.team2_player1);
    playerNames.add(match.team2_player2);
  });

  return Array.from(playerNames).filter(name => name && name.trim());
}

/**
 * Create players if they don't exist
 */
async function ensurePlayersExist(playerNames) {
  console.log('🔍 Checking and creating players...');
  
  const createdPlayers = [];
  const existingPlayers = [];

  for (const playerName of playerNames) {
    try {
      // Try to create the player
      const player = await Player.create({ name: playerName });
      createdPlayers.push(player);
      console.log(`✅ Created player: ${playerName}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        existingPlayers.push(playerName);
        console.log(`📋 Player already exists: ${playerName}`);
      } else {
        console.error(`❌ Failed to create player ${playerName}:`, error.message);
        throw error;
      }
    }
  }

  console.log(`\n📊 Player Summary:`);
  console.log(`   • Created: ${createdPlayers.length} players`);
  console.log(`   • Existing: ${existingPlayers.length} players`);
  console.log(`   • Total: ${playerNames.length} players\n`);
}

/**
 * Find or create migration season
 */
async function ensureMigrationSeason() {
  console.log('🏆 Setting up migration season...');
  
  // First, check if there's an active season
  let activeSeason = await Season.getActive();
  
  if (activeSeason) {
    console.log(`✅ Using existing active season: ${activeSeason.name}`);
    return activeSeason;
  }

  // Create a new season for the migration
  console.log('🆕 No active season found, creating migration season...');
  const migrationSeason = await Season.create({
    name: 'Migration Season 2025',
    description: 'Imported data from previous system',
    start_date: '2025-07-01',
    is_active: true
  });

  console.log(`✅ Created migration season: ${migrationSeason.name}\n`);
  return migrationSeason;
}

/**
 * Import matches into the database
 */
async function importMatches(matches, seasonId) {
  console.log('📥 Importing matches...');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    
    try {
      // Convert date format to YYYY-MM-DD if needed
      let matchDate = match.match_date;
      if (matchDate.includes(' ')) {
        matchDate = matchDate.split(' ')[0]; // Take only the date part
      }

      // Create the match
      await Match.create({
        team1_player1: match.team1_player1,
        team1_player2: match.team1_player2,
        team2_player1: match.team2_player1,
        team2_player2: match.team2_player2,
        team1_score: match.team1_score,
        team2_score: match.team2_score,
        match_date: matchDate,
        seasonId: seasonId
      });

      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`   📈 Progress: ${i + 1}/${matches.length} matches imported`);
      }
      
    } catch (error) {
      errorCount++;
      errors.push({
        match: `${match.team1_player1}+${match.team1_player2} vs ${match.team2_player1}+${match.team2_player2}`,
        error: error.message
      });
      console.error(`❌ Failed to import match ${i + 1}:`, error.message);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   • Successfully imported: ${successCount} matches`);
  console.log(`   • Failed: ${errorCount} matches`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    errors.forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.match}: ${err.error}`);
    });
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting FIFA Ranker data migration...\n');
  
  try {
    // Check database connection
    console.log('🔌 Checking database connection...');
    const dbConnected = await sql`SELECT 1 as connected`;
    if (!dbConnected.rows[0]?.connected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connected\n');

    // Parse the match data
    console.log('📝 Parsing match data...');
    const matches = parseMatchData(matchData);
    console.log(`✅ Parsed ${matches.length} matches\n`);

    // Extract and create players
    const playerNames = extractUniquePlayerNames(matches);
    await ensurePlayersExist(playerNames);

    // Set up migration season
    const season = await ensureMigrationSeason();

    // Import matches
    await importMatches(matches, season.id);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📈 Next steps:');
    console.log('   • Visit your app to see the imported data');
    console.log('   • Check the Rankings page to see player statistics');
    console.log('   • Review the Matches page to verify all data imported correctly');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    console.error('\nTroubleshooting:');
    console.error('   • Make sure your database is running and accessible');
    console.error('   • Check that environment variables are configured correctly');
    console.error('   • Verify the database schema is set up (run setup-database.js first)');
    process.exit(1);
  }
}

// Run the migration
migrate(); 