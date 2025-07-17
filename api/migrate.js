import { sql } from '@vercel/postgres';

/**
 * Temporary migration API endpoint
 * Visit: https://fifa-ranker-js.vercel.app/api/migrate
 * DELETE THIS FILE AFTER MIGRATION IS COMPLETE
 */

// Your match data
const matchData = `team1_player1,team1_player2,team2_player1,team2_player2,team1_score,team2_score,date
Moti,Uri,Asaf,Chen,4,2,2025-07-16 21:03:26
Moti,Uri,Asaf,Baki,2,1,2025-07-16 20:44:27
Moti,Uri,Chen,Baki,3,0,2025-07-16 20:26:59
Moti,Uri,Chen,Baki,3,0,2025-07-16 20:26:44
Moti,Asaf,Chen,Baki,0,3,2025-07-16 20:26:21
Uri,Asaf,Chen,Moti,3,1,2025-07-16 19:57:28
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

function parseMatchData(csvData) {
  const lines = csvData.trim().split('\n');
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

async function ensurePlayersExist(playerNames) {
  const results = { created: [], existing: [] };

  for (const playerName of playerNames) {
    try {
      const existingPlayer = await sql`
        SELECT id FROM players WHERE name = ${playerName}
      `;
      
      if (existingPlayer.rows.length > 0) {
        results.existing.push(playerName);
      } else {
        const newPlayer = await sql`
          INSERT INTO players (name, created_date)
          VALUES (${playerName}, NOW())
          RETURNING id, name
        `;
        results.created.push(newPlayer.rows[0]);
      }
    } catch (error) {
      throw new Error(`Failed to create player ${playerName}: ${error.message}`);
    }
  }

  return results;
}

async function ensureMigrationSeason() {
  const activeSeasons = await sql`
    SELECT id, name, description FROM leagues WHERE is_active = true LIMIT 1
  `;
  
  if (activeSeasons.rows.length > 0) {
    return activeSeasons.rows[0];
  }

  const migrationSeason = await sql`
    INSERT INTO leagues (name, description, start_date, is_active, created_date)
    VALUES (
      'Migration Season 2025',
      'Imported data from previous system',
      '2025-07-01',
      true,
      NOW()
    )
    RETURNING id, name, description
  `;

  return migrationSeason.rows[0];
}

async function importMatches(matches, seasonId) {
  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    
    try {
      let matchDate = match.match_date;
      if (matchDate.includes(' ')) {
        matchDate = matchDate.split(' ')[0];
      }

      await sql`
        INSERT INTO matches (
          league_id, team1_player1, team1_player2, team2_player1, team2_player2,
          team1_score, team2_score, match_date, created_date
        )
        VALUES (
          ${seasonId}, ${match.team1_player1}, ${match.team1_player2}, 
          ${match.team2_player1}, ${match.team2_player2},
          ${match.team1_score}, ${match.team2_score}, ${matchDate}, NOW()
        )
      `;

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        match: `${match.team1_player1}+${match.team1_player2} vs ${match.team2_player1}+${match.team2_player2}`,
        error: error.message
      });
    }
  }

  return results;
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connection
    await sql`SELECT 1 as connected`;

    // Parse the match data
    const matches = parseMatchData(matchData);
    
    // Extract and create players
    const playerNames = extractUniquePlayerNames(matches);
    const playerResults = await ensurePlayersExist(playerNames);

    // Set up migration season
    const season = await ensureMigrationSeason();

    // Import matches
    const importResults = await importMatches(matches, season.id);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Migration completed successfully!',
      results: {
        matches: {
          total: matches.length,
          imported: importResults.success,
          failed: importResults.failed,
          errors: importResults.errors
        },
        players: {
          total: playerNames.length,
          created: playerResults.created.length,
          existing: playerResults.existing.length,
          names: playerNames
        },
        season: {
          id: season.id,
          name: season.name,
          description: season.description
        }
      }
    });

  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Migration failed. Check server logs for details.'
    });
  }
} 