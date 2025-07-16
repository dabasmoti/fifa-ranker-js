import DatabaseService from '@/services/DatabaseService.js';
import { League } from '@/entities/League.js';

export class Match {
  constructor(data) {
    this.id = data.id;
    this.league_id = data.league_id;
    this.team1_player1 = data.team1_player1;
    this.team1_player2 = data.team1_player2;
    this.team2_player1 = data.team2_player1;
    this.team2_player2 = data.team2_player2;
    this.team1_score = parseInt(data.team1_score) || 0;
    this.team2_score = parseInt(data.team2_score) || 0;
    this.match_date = data.match_date;
    this.created_date = data.created_date;
  }

  static async list(sort = '-created_date', limit = null, leagueId = null) {
    try {
      const dbService = new DatabaseService();
      const matches = await dbService.getMatches({ sort, limit, leagueId });
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

      const matchData = {
        league_id: leagueId,
        team1_player1: data.team1_player1,
        team1_player2: data.team1_player2,
        team2_player1: data.team2_player1,
        team2_player2: data.team2_player2,
        team1_score: parseInt(data.team1_score) || 0,
        team2_score: parseInt(data.team2_score) || 0,
        match_date: data.match_date || new Date().toISOString().split('T')[0]
      };
      
      const dbService = new DatabaseService();
      const newMatch = await dbService.createMatch(matchData);
      
      return newMatch;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const matchData = {
        team1_player1: data.team1_player1,
        team1_player2: data.team1_player2,
        team2_player1: data.team2_player1,
        team2_player2: data.team2_player2,
        team1_score: parseInt(data.team1_score) || 0,
        team2_score: parseInt(data.team2_score) || 0,
        match_date: data.match_date
      };
      
      const dbService = new DatabaseService();
      const updatedMatch = await dbService.updateMatch(id, matchData);
      
      if (!updatedMatch) {
        throw new Error('Match not found');
      }
      
      return updatedMatch;
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const dbService = new DatabaseService();
      await dbService.deleteMatch(id);
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
      const dbService = new DatabaseService();
      let updatedCount = 0;

      for (const matchId of matchIds) {
        try {
          await dbService.updateMatch(matchId, { league_id: targetLeagueId });
          updatedCount++;
        } catch (error) {
          console.error(`Error migrating match ${matchId}:`, error);
        }
      }

      return updatedCount > 0;
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
   * Export matches to JSON
   */
  static async exportToJson(leagueId = null, filename = null) {
    try {
      const matches = leagueId ? await this.getByLeague(leagueId) : await this.list();
      
      const exportFilename = filename || 
        (leagueId ? `league_${leagueId}_matches.json` : 'all_matches.json');
      
      // Create download link
      const dataStr = JSON.stringify(matches, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = exportFilename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      return exportFilename;
    } catch (error) {
      console.error('Error exporting matches:', error);
      throw error;
    }
  }

  /**
   * Import matches from JSON file
   */
  static async importFromJson(file, leagueId = null) {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const importedMatches = JSON.parse(e.target.result);
            
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

            const dbService = new DatabaseService();
            const currentMatches = await this.list();
            const existingIds = new Set(currentMatches.map(m => m.id));
            
            let importedCount = 0;
            let skippedCount = 0;

            for (const match of importedMatches) {
              if (existingIds.has(match.id)) {
                skippedCount++;
                continue;
              }

              const matchData = {
                league_id: targetLeagueId,
                team1_player1: match.team1_player1,
                team1_player2: match.team1_player2,
                team2_player1: match.team2_player1,
                team2_player2: match.team2_player2,
                team1_score: parseInt(match.team1_score) || 0,
                team2_score: parseInt(match.team2_score) || 0,
                match_date: match.match_date || new Date().toISOString().split('T')[0]
              };

              try {
                await dbService.createMatch(matchData);
                importedCount++;
              } catch (error) {
                console.error('Error importing match:', error);
                skippedCount++;
              }
            }
            
            resolve({
              imported: importedCount,
              skipped: skippedCount,
              total: currentMatches.length + importedCount
            });
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    } catch (error) {
      console.error('Error importing matches:', error);
      throw error;
    }
  }
} 