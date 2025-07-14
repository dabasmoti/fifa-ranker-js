import { CsvService } from '@/services/CsvService.js';
import { League } from '@/entities/League.js';

export class Match {
  static CSV_FILENAME = 'matches.csv';
  static CSV_HEADERS = ['id', 'league_id', 'team1_player1', 'team1_player2', 'team2_player1', 'team2_player2', 'team1_score', 'team2_score', 'match_date', 'created_date'];

  constructor(data) {
    this.id = data.id;
    this.league_id = data.league_id;
    this.team1_player1 = data.team1_player1;
    this.team1_player2 = data.team1_player2;
    this.team2_player1 = data.team2_player1;
    this.team2_player2 = data.team2_player2;
    this.team1_score = data.team1_score;
    this.team2_score = data.team2_score;
    this.match_date = data.match_date;
    this.created_date = data.created_date;
  }

  static async list(sort = '-created_date', limit = null, leagueId = null) {
    try {
      let matches = await CsvService.readCsv(this.CSV_FILENAME, this.CSV_HEADERS);
      
      // Convert string numbers back to integers for scores
      matches = matches.map(match => ({
        ...match,
        team1_score: parseInt(match.team1_score) || 0,
        team2_score: parseInt(match.team2_score) || 0
      }));
      
      // Filter by league if specified
      if (leagueId) {
        matches = matches.filter(match => match.league_id === leagueId);
      }
      
      // Sort matches by created_date (newest first by default)
      if (sort === '-created_date') {
        matches.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      } else if (sort === 'created_date') {
        matches.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      } else if (sort === '-match_date') {
        matches.sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
      } else if (sort === 'match_date') {
        matches.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
      }
      
      // Apply limit if specified
      if (limit && typeof limit === 'number') {
        matches = matches.slice(0, limit);
      }
      
      return matches;
    } catch (error) {
      console.error('Error loading matches:', error);
      return [];
    }
  }

  static async create(data) {
    try {
      // Get active league if no league_id provided
      let leagueId = data.league_id;
      if (!leagueId) {
        const activeLeague = await League.getActive();
        if (!activeLeague) {
          // Create a default league if none exists
          const defaultLeague = await League.createDefault();
          leagueId = defaultLeague.id;
        } else {
          leagueId = activeLeague.id;
        }
      }

      const matches = await this.list();
      const newMatch = {
        id: Date.now().toString(),
        league_id: leagueId,
        team1_player1: data.team1_player1,
        team1_player2: data.team1_player2,
        team2_player1: data.team2_player1,
        team2_player2: data.team2_player2,
        team1_score: data.team1_score,
        team2_score: data.team2_score,
        match_date: data.match_date || new Date().toISOString().split('T')[0],
        created_date: new Date().toISOString()
      };
      
      matches.push(newMatch);
      await CsvService.writeCsv(this.CSV_FILENAME, matches, this.CSV_HEADERS);
      
      return newMatch;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const matches = await this.list();
      const matchIndex = matches.findIndex(match => match.id === id);
      
      if (matchIndex === -1) {
        throw new Error('Match not found');
      }

      const updatedMatch = {
        ...matches[matchIndex],
        team1_player1: data.team1_player1 || matches[matchIndex].team1_player1,
        team1_player2: data.team1_player2 || matches[matchIndex].team1_player2,
        team2_player1: data.team2_player1 || matches[matchIndex].team2_player1,
        team2_player2: data.team2_player2 || matches[matchIndex].team2_player2,
        team1_score: data.team1_score !== undefined ? data.team1_score : matches[matchIndex].team1_score,
        team2_score: data.team2_score !== undefined ? data.team2_score : matches[matchIndex].team2_score,
        match_date: data.match_date || matches[matchIndex].match_date,
        league_id: data.league_id || matches[matchIndex].league_id,
        updated_date: new Date().toISOString()
      };

      matches[matchIndex] = updatedMatch;
      await CsvService.writeCsv(this.CSV_FILENAME, matches, this.CSV_HEADERS);
      
      return updatedMatch;
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const matches = await this.list();
      const matchToDelete = matches.find(match => match.id === id);
      
      if (!matchToDelete) {
        throw new Error('Match not found');
      }

      const filteredMatches = matches.filter(match => match.id !== id);
      await CsvService.writeCsv(this.CSV_FILENAME, filteredMatches, this.CSV_HEADERS);
      
      return true;
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const matches = await this.list();
      const match = matches.find(match => match.id === id);
      return match || null;
    } catch (error) {
      console.error('Error finding match:', error);
      return null;
    }
  }

  /**
   * Get matches for a specific league
   */
  static async getByLeague(leagueId, sort = '-created_date') {
    return this.list(sort, null, leagueId);
  }

  /**
   * Get matches for the active league
   */
  static async getActiveLeagueMatches(sort = '-created_date') {
    try {
      const activeLeague = await League.getActive();
      if (!activeLeague) {
        return [];
      }
      return this.getByLeague(activeLeague.id, sort);
    } catch (error) {
      console.error('Error getting active league matches:', error);
      return [];
    }
  }

  /**
   * Migrate matches from a league to another
   */
  static async migrateToLeague(matchIds, targetLeagueId) {
    try {
      const matches = await this.list();
      let updated = false;

      matches.forEach(match => {
        if (matchIds.includes(match.id)) {
          match.league_id = targetLeagueId;
          updated = true;
        }
      });

      if (updated) {
        await CsvService.writeCsv(this.CSV_FILENAME, matches, this.CSV_HEADERS);
      }

      return updated;
    } catch (error) {
      console.error('Error migrating matches to league:', error);
      throw error;
    }
  }

  /**
   * Get match statistics for a league
   */
  static async getLeagueStats(leagueId) {
    try {
      const matches = await this.getByLeague(leagueId);
      
      const stats = {
        total_matches: matches.length,
        total_goals: matches.reduce((sum, match) => sum + match.team1_score + match.team2_score, 0),
        avg_goals_per_match: 0,
        highest_scoring_match: null,
        date_range: null
      };

      if (matches.length > 0) {
        stats.avg_goals_per_match = (stats.total_goals / matches.length).toFixed(2);
        
        // Find highest scoring match
        stats.highest_scoring_match = matches.reduce((highest, match) => {
          const totalGoals = match.team1_score + match.team2_score;
          const highestGoals = highest ? highest.team1_score + highest.team2_score : 0;
          return totalGoals > highestGoals ? match : highest;
        }, null);

        // Get date range
        const dates = matches.map(m => new Date(m.match_date)).sort((a, b) => a - b);
        stats.date_range = {
          start: dates[0],
          end: dates[dates.length - 1]
        };
      }

      return stats;
    } catch (error) {
      console.error('Error calculating league stats:', error);
      return {
        total_matches: 0,
        total_goals: 0,
        avg_goals_per_match: 0,
        highest_scoring_match: null,
        date_range: null
      };
    }
  }

  /**
   * Export matches to CSV
   */
  static async exportToCsv(leagueId = null, filename = null) {
    try {
      const matches = leagueId ? await this.getByLeague(leagueId) : await this.list();
      
      const exportFilename = filename || 
        (leagueId ? `league_${leagueId}_matches.csv` : 'all_matches.csv');
      
      CsvService.downloadCsv(exportFilename, matches, this.CSV_HEADERS);
      
      return exportFilename;
    } catch (error) {
      console.error('Error exporting matches:', error);
      throw error;
    }
  }

  /**
   * Import matches from CSV file
   */
  static async importFromCsv(file, leagueId = null) {
    try {
      const importedMatches = await CsvService.importCsv(file, this.CSV_HEADERS);
      const currentMatches = await this.list();
      
      // Get active league if no league specified
      let targetLeagueId = leagueId;
      if (!targetLeagueId) {
        const activeLeague = await League.getActive();
        if (!activeLeague) {
          const defaultLeague = await League.createDefault();
          targetLeagueId = defaultLeague.id;
        } else {
          targetLeagueId = activeLeague.id;
        }
      }

      // Process imported matches
      const processedMatches = importedMatches.map(match => ({
        ...match,
        id: match.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        league_id: targetLeagueId,
        team1_score: parseInt(match.team1_score) || 0,
        team2_score: parseInt(match.team2_score) || 0,
        created_date: match.created_date || new Date().toISOString()
      }));

      // Merge with existing matches (avoid duplicates by ID)
      const existingIds = new Set(currentMatches.map(m => m.id));
      const newMatches = processedMatches.filter(m => !existingIds.has(m.id));
      
      const allMatches = [...currentMatches, ...newMatches];
      await CsvService.writeCsv(this.CSV_FILENAME, allMatches, this.CSV_HEADERS);
      
      return {
        imported: newMatches.length,
        skipped: processedMatches.length - newMatches.length,
        total: allMatches.length
      };
    } catch (error) {
      console.error('Error importing matches:', error);
      throw error;
    }
  }
} 