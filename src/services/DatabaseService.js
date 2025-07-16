import { sql } from '@vercel/postgres';

/**
 * Service for handling database operations with Neon PostgreSQL
 * Replaces the previous JSON-based storage with a proper database
 */
class DatabaseService {
  constructor() {
    this.isServerSide = typeof window === 'undefined';
  }

  /**
   * Check if database is available
   */
  async checkConnection() {
    try {
      if (!this.isServerSide) {
        // For client-side, check via API route
        const response = await fetch('/api/database', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ping' })
        });
        return response.ok;
      } else {
        // For server-side, check directly
        const result = await sql`SELECT 1 as ping`;
        return result.rows.length > 0;
      }
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  /**
   * Execute a database operation via API route (client-side) or directly (server-side)
   */
  async executeQuery(action, params = {}) {
    if (!this.isServerSide) {
      // Client-side: use API route
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Database operation failed');
      }

      return await response.json();
    } else {
      // Server-side: execute directly
      return await this.executeServerQuery(action, params);
    }
  }

  /**
   * Server-side database operations
   */
  async executeServerQuery(action, params) {
    switch (action) {
      case 'ping':
        const result = await sql`SELECT 1 as ping`;
        return { success: true, data: result.rows };

      // Players operations
      case 'players.list':
        const players = await sql`
          SELECT id, name, created_date 
          FROM players 
          ORDER BY created_date DESC
        `;
        return { success: true, data: players.rows };

      case 'players.create':
        const { name } = params;
        const newPlayer = await sql`
          INSERT INTO players (name) 
          VALUES (${name}) 
          RETURNING id, name, created_date
        `;
        return { success: true, data: newPlayer.rows[0] };

      case 'players.update':
        const { id, name: newName } = params;
        const updatedPlayer = await sql`
          UPDATE players 
          SET name = ${newName} 
          WHERE id = ${id} 
          RETURNING id, name, created_date
        `;
        return { success: true, data: updatedPlayer.rows[0] };

      case 'players.delete':
        await sql`DELETE FROM players WHERE id = ${params.id}`;
        return { success: true };

      // Leagues operations
      case 'leagues.list':
        const leagues = await sql`
          SELECT id, name, description, is_active, created_date 
          FROM leagues 
          ORDER BY is_active DESC, created_date DESC
        `;
        return { success: true, data: leagues.rows };

      case 'leagues.create':
        const { name: leagueName, description, is_active } = params;
        
        // If this league should be active, deactivate others
        if (is_active) {
          await sql`UPDATE leagues SET is_active = false`;
        }
        
        const newLeague = await sql`
          INSERT INTO leagues (name, description, is_active) 
          VALUES (${leagueName}, ${description}, ${is_active}) 
          RETURNING id, name, description, is_active, created_date
        `;
        return { success: true, data: newLeague.rows[0] };

      case 'leagues.getActive':
        const activeLeague = await sql`
          SELECT id, name, description, is_active, created_date 
          FROM leagues 
          WHERE is_active = true 
          LIMIT 1
        `;
        return { success: true, data: activeLeague.rows[0] || null };

      case 'leagues.setActive':
        // Deactivate all leagues first
        await sql`UPDATE leagues SET is_active = false`;
        // Activate the specified league
        const activatedLeague = await sql`
          UPDATE leagues 
          SET is_active = true 
          WHERE id = ${params.id} 
          RETURNING id, name, description, is_active, created_date
        `;
        return { success: true, data: activatedLeague.rows[0] };

      // Matches operations
      case 'matches.list':
        const { sort = '-created_date', limit, leagueId } = params;
        
        let query = `
          SELECT id, league_id, team1_player1, team1_player2, 
                 team2_player1, team2_player2, team1_score, team2_score, 
                 match_date, created_date 
          FROM matches
        `;
        
        const queryParams = [];
        if (leagueId) {
          query += ` WHERE league_id = $${queryParams.length + 1}`;
          queryParams.push(leagueId);
        }
        
        // Add sorting
        if (sort === '-created_date') {
          query += ` ORDER BY created_date DESC`;
        } else if (sort === 'created_date') {
          query += ` ORDER BY created_date ASC`;
        } else if (sort === '-match_date') {
          query += ` ORDER BY match_date DESC`;
        } else if (sort === 'match_date') {
          query += ` ORDER BY match_date ASC`;
        }
        
        // Add limit
        if (limit) {
          query += ` LIMIT $${queryParams.length + 1}`;
          queryParams.push(limit);
        }
        
        const matches = await sql.query(query, queryParams);
        return { success: true, data: matches.rows };

      case 'matches.create':
        const matchData = params;
        const newMatch = await sql`
          INSERT INTO matches (
            league_id, team1_player1, team1_player2, team2_player1, team2_player2,
            team1_score, team2_score, match_date
          ) VALUES (
            ${matchData.league_id}, ${matchData.team1_player1}, ${matchData.team1_player2}, 
            ${matchData.team2_player1}, ${matchData.team2_player2}, ${matchData.team1_score}, 
            ${matchData.team2_score}, ${matchData.match_date}
          ) 
          RETURNING id, league_id, team1_player1, team1_player2, team2_player1, team2_player2,
                    team1_score, team2_score, match_date, created_date
        `;
        return { success: true, data: newMatch.rows[0] };

      case 'matches.update':
        const { id: matchId, ...updateData } = params;
        const updatedMatch = await sql`
          UPDATE matches 
          SET team1_player1 = ${updateData.team1_player1}, 
              team1_player2 = ${updateData.team1_player2},
              team2_player1 = ${updateData.team2_player1}, 
              team2_player2 = ${updateData.team2_player2},
              team1_score = ${updateData.team1_score}, 
              team2_score = ${updateData.team2_score},
              match_date = ${updateData.match_date}
          WHERE id = ${matchId} 
          RETURNING id, league_id, team1_player1, team1_player2, team2_player1, team2_player2,
                    team1_score, team2_score, match_date, created_date
        `;
        return { success: true, data: updatedMatch.rows[0] };

      case 'matches.delete':
        await sql`DELETE FROM matches WHERE id = ${params.id}`;
        return { success: true };

      default:
        throw new Error(`Unknown database action: ${action}`);
    }
  }

  // Convenience methods for each entity type
  async getPlayers() {
    const result = await this.executeQuery('players.list');
    return result.data;
  }

  async createPlayer(name) {
    const result = await this.executeQuery('players.create', { name });
    return result.data;
  }

  async updatePlayer(id, name) {
    const result = await this.executeQuery('players.update', { id, name });
    return result.data;
  }

  async deletePlayer(id) {
    await this.executeQuery('players.delete', { id });
  }

  async getLeagues() {
    const result = await this.executeQuery('leagues.list');
    return result.data;
  }

  async createLeague(name, description = '', is_active = false) {
    const result = await this.executeQuery('leagues.create', { name, description, is_active });
    return result.data;
  }

  async getActiveLeague() {
    const result = await this.executeQuery('leagues.getActive');
    return result.data;
  }

  async setActiveLeague(id) {
    const result = await this.executeQuery('leagues.setActive', { id });
    return result.data;
  }

  async getMatches(options = {}) {
    const result = await this.executeQuery('matches.list', options);
    return result.data;
  }

  async createMatch(matchData) {
    const result = await this.executeQuery('matches.create', matchData);
    return result.data;
  }

  async updateMatch(id, matchData) {
    const result = await this.executeQuery('matches.update', { id, ...matchData });
    return result.data;
  }

  async deleteMatch(id) {
    await this.executeQuery('matches.delete', { id });
  }
}

export default DatabaseService; 