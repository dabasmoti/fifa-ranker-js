import DatabaseService from '@/services/DatabaseService.js';
import { Season } from '@/entities/Season.js';

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

  static async list(sort = '-created_date', limit = null, seasonId = null) {
    try {
      const dbService = new DatabaseService();
      const matches = await dbService.getMatches(sort, limit, seasonId);
      return matches;
    } catch (error) {
      console.error('Error loading matches:', error);
      return [];
    }
  }

  static async create(data) {
    try {
      let seasonId = data.seasonId;
      
      // If no seasonId provided, use the active season or create one
      if (!seasonId) {
        let activeSeason = await Season.getActive();
        
        if (!activeSeason) {
          // If no active season exists, create a new one
          console.log('No active season found, creating new season for match');
          activeSeason = await Season.create({
            name: `Season ${new Date().getFullYear()}`,
            description: 'Auto-created season for new matches',
            start_date: new Date().toISOString().split('T')[0],
            is_active: true
          });
        }
        
        seasonId = activeSeason.id;
      }

      // Verify the season exists and is not locked
      const season = await Season.findById(seasonId);
      if (!season) {
        throw new Error('Selected season does not exist.');
      }
      
      if (season.is_locked) {
        throw new Error('Cannot add matches to locked seasons. Please select an active season.');
      }

      const matchData = {
        league_id: seasonId,
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

  /**
   * Delete all matches (admin function)
   */
  static async deleteAll() {
    try {
      const dbService = new DatabaseService();
      await dbService.executeQuery('matches.deleteAll');
      return true;
    } catch (error) {
      console.error('Error deleting all matches:', error);
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
   * Get matches for a specific season
   */
  static async getBySeason(seasonId, sort = '-created_date') {
    return this.list(sort, null, seasonId);
  }

  /**
   * Get matches for the active season
   */
  static async getActiveSeasonMatches(sort = '-created_date') {
    try {
      const activeSeason = await Season.getActive();
      if (!activeSeason) {
        return [];
      }
      return this.getBySeason(activeSeason.id, sort);
    } catch (error) {
      console.error('Error getting active season matches:', error);
      return [];
    }
  }

  /**
   * Migrate matches from a season to another
   */
  static async migrateToSeason(matchIds, targetSeasonId) {
    try {
      const dbService = new DatabaseService();
      let updatedCount = 0;

      for (const matchId of matchIds) {
        try {
          await dbService.updateMatch(matchId, { league_id: targetSeasonId });
          updatedCount++;
        } catch (error) {
          console.error(`Error migrating match ${matchId}:`, error);
        }
      }

      return updatedCount > 0;
    } catch (error) {
      console.error('Error migrating matches to season:', error);
      throw error;
    }
  }

  /**
   * Get match statistics for a season
   */
  static async getSeasonStats(seasonId) {
    try {
      const matches = await this.getBySeason(seasonId);
      
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
      console.error('Error calculating season stats:', error);
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
  static async exportToJson(seasonId = null, filename = null) {
    try {
      const matches = seasonId ? await this.getBySeason(seasonId) : await this.list();
      
      const exportFilename = filename || 
        (seasonId ? `season_${seasonId}_matches.json` : 'all_matches.json');
      
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
  static async importFromJson(file, seasonId = null) {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const importedMatches = JSON.parse(e.target.result);
            
            // Get active season if no season specified
            let targetSeasonId = seasonId;
            if (!targetSeasonId) {
              const activeSeason = await Season.getActive();
              if (!activeSeason) {
                const defaultSeason = await Season.createDefault();
                targetSeasonId = defaultSeason.id;
              } else {
                targetSeasonId = activeSeason.id;
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
                league_id: targetSeasonId,
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