#!/usr/bin/env node

import { sql } from '@vercel/postgres';

const createTables = async () => {
  try {
    console.log('🔧 Setting up database tables...');

    // Create players table
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('✅ Players table created');

    // Create leagues table (repurposed as seasons)
    await sql`
      CREATE TABLE IF NOT EXISTS leagues (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Add new columns to existing leagues table if they don't exist
    try {
      await sql`ALTER TABLE leagues ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE`;
      await sql`ALTER TABLE leagues ADD COLUMN IF NOT EXISTS end_date DATE`;
      await sql`ALTER TABLE leagues ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE`;
    } catch (error) {
      // Columns might already exist, continue
      console.log('Note: Some columns may already exist in leagues table');
    }
    
    console.log('✅ Leagues table created');

    // Create matches table
    await sql`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
        team1_player1 VARCHAR(255) NOT NULL,
        team1_player2 VARCHAR(255),
        team2_player1 VARCHAR(255) NOT NULL,
        team2_player2 VARCHAR(255),
        team1_score INTEGER DEFAULT 0,
        team2_score INTEGER DEFAULT 0,
        match_date DATE NOT NULL,
        created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('✅ Matches table created');

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_matches_league_id ON matches(league_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_matches_created_date ON matches(created_date);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_leagues_is_active ON leagues(is_active);
    `;
    console.log('✅ Database indexes created');

    // Create default league if none exists
    const existingLeagues = await sql`SELECT COUNT(*) as count FROM leagues`;
    if (existingLeagues.rows[0].count === '0') {
      await sql`
        INSERT INTO leagues (name, description, start_date, is_active, is_locked)
        VALUES ('Default Season', 'Default season for FIFA matches', CURRENT_DATE, true, false)
      `;
      console.log('✅ Default season created');
    }

    console.log('🎉 Database setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

createTables(); 