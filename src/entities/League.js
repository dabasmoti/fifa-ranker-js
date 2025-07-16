import DatabaseService from '@/services/DatabaseService.js';

export class League {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.is_active = data.is_active;
    this.created_date = data.created_date;
  }

  static async list() {
    try {
      const dbService = new DatabaseService();
      const leagues = await dbService.getLeagues();
      return leagues;
    } catch (error) {
      console.error('Error loading leagues:', error);
      return [];
    }
  }

  static async create(data) {
    try {
      // Deactivate all other leagues if this one is set as active
      if (data.is_active) {
        await this.deactivateAll();
      }
      
      const leagueData = {
        name: data.name,
        description: data.description || '',
        is_active: data.is_active === true || data.is_active === 'true'
      };
      
      const dbService = new DatabaseService();
      const newLeague = await dbService.createLeague(leagueData);
      
      return newLeague;
    } catch (error) {
      console.error('Error creating league:', error);
      
      // Handle duplicate name error
      if (error.message.includes('duplicate key value') || error.message.includes('already exists')) {
        throw new Error('A league with this name already exists. Please choose a different name.');
      }
      
      throw error;
    }
  }

  static async update(id, data) {
    try {
      // If setting this league as active, deactivate all others
      if (data.is_active) {
        await this.deactivateAll();
      }

      const updateData = {
        name: data.name,
        description: data.description,
        is_active: data.is_active !== undefined ? (data.is_active === true || data.is_active === 'true') : undefined
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const dbService = new DatabaseService();
      const updatedLeague = await dbService.updateLeague(id, updateData);
      
      if (!updatedLeague) {
        throw new Error('League not found');
      }
      
      return updatedLeague;
    } catch (error) {
      console.error('Error updating league:', error);
      
      // Handle duplicate name error
      if (error.message.includes('duplicate key value') || error.message.includes('already exists')) {
        throw new Error('A league with this name already exists. Please choose a different name.');
      }
      
      throw error;
    }
  }

  static async delete(id) {
    try {
      const league = await this.findById(id);
      if (!league) {
        throw new Error('League not found');
      }

      // Don't allow deleting the active league if it has matches
      if (league.is_active) {
        const { Match } = await import('@/entities/Match.js');
        const matches = await Match.getByLeague(id);
        
        if (matches.length > 0) {
          throw new Error('Cannot delete active league with existing matches. End the league first.');
        }
      }
      
      const dbService = new DatabaseService();
      await dbService.deleteLeague(id);
      
      return true;
    } catch (error) {
      console.error('Error deleting league:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const leagues = await this.list();
      return leagues.find(league => league.id === parseInt(id)) || null;
    } catch (error) {
      console.error('Error finding league:', error);
      return null;
    }
  }

  static async getActive() {
    try {
      const dbService = new DatabaseService();
      const activeLeague = await dbService.getActiveLeague();
      return activeLeague;
    } catch (error) {
      console.error('Error finding active league:', error);
      return null;
    }
  }

  static async setActive(id) {
    try {
      const dbService = new DatabaseService();
      const activeLeague = await dbService.setActiveLeague(id);
      
      if (!activeLeague) {
        throw new Error('League not found');
      }
      
      return activeLeague;
    } catch (error) {
      console.error('Error setting active league:', error);
      throw error;
    }
  }

  static async deactivateAll() {
    try {
      const leagues = await this.list();
      const dbService = new DatabaseService();
      
      for (const league of leagues) {
        if (league.is_active) {
          await dbService.updateLeague(league.id, { is_active: false });
        }
      }
    } catch (error) {
      console.error('Error deactivating leagues:', error);
      throw error;
    }
  }

  static async endLeague(id, endDate = null) {
    try {
      const league = await this.findById(id);
      if (!league) {
        throw new Error('League not found');
      }

      const updatedLeague = await this.update(id, {
        is_active: false
      });

      return updatedLeague;
    } catch (error) {
      console.error('Error ending league:', error);
      throw error;
    }
  }

  static async createDefault() {
    try {
      const existingLeagues = await this.list();
      
      // Only create default if no leagues exist
      if (existingLeagues.length === 0) {
        return await this.create({
          name: 'Default League',
          description: 'Initial league for FIFA matches',
          is_active: true
        });
      }
      
      // Return active league or first league
      const activeLeague = await this.getActive();
      return activeLeague || existingLeagues[0];
    } catch (error) {
      console.error('Error creating default league:', error);
      throw error;
    }
  }

  /**
   * Get league statistics
   */
  static async getStats(leagueId) {
    try {
      const { Match } = await import('@/entities/Match.js');
      const { Player } = await import('@/entities/Player.js');
      
      const [matches, players] = await Promise.all([
        Match.getByLeague(leagueId),
        Player.list()
      ]);
      
      // Get unique players who played in this league
      const leaguePlayerNames = new Set();
      matches.forEach(match => {
        leaguePlayerNames.add(match.team1_player1);
        leaguePlayerNames.add(match.team1_player2);
        leaguePlayerNames.add(match.team2_player1);
        leaguePlayerNames.add(match.team2_player2);
      });
      
      return {
        total_matches: matches.length,
        total_players: leaguePlayerNames.size,
        date_range: matches.length > 0 ? {
          start: Math.min(...matches.map(m => new Date(m.match_date))),
          end: Math.max(...matches.map(m => new Date(m.match_date)))
        } : null
      };
    } catch (error) {
      console.error('Error calculating league stats:', error);
      return {
        total_matches: 0,
        total_players: 0,
        date_range: null
      };
    }
  }

  /**
   * Export league data including matches and player stats
   */
  static async exportLeagueData(leagueId) {
    try {
      const { Match } = await import('@/entities/Match.js');
      const league = await this.findById(leagueId);
      const leagueMatches = await Match.getByLeague(leagueId);
      
      if (!league) {
        throw new Error('League not found');
      }
      
      // Create download link
      const filename = `${league.name.replace(/[^a-zA-Z0-9]/g, '_')}_matches.json`;
      const dataStr = JSON.stringify(leagueMatches, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      return filename;
    } catch (error) {
      console.error('Error exporting league data:', error);
      throw error;
    }
  }
} 