import DatabaseService from '@/services/DatabaseService.js';

export class Season {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.is_active = data.is_active;
    this.is_locked = data.is_locked;
    this.created_date = data.created_date;
  }

  static async list() {
    try {
      const dbService = new DatabaseService();
      const seasons = await dbService.getLeagues(); // Using existing league methods since same table
      return seasons;
    } catch (error) {
      console.error('Error loading seasons:', error);
      return [];
    }
  }

  static async create(data) {
    try {
      // Deactivate all other seasons if this one is set as active
      if (data.is_active) {
        await this.deactivateAll();
      }
      
      const seasonData = {
        name: data.name,
        description: data.description || '',
        start_date: data.start_date || new Date().toISOString().split('T')[0],
        end_date: data.end_date || null,
        is_active: data.is_active === true || data.is_active === 'true',
        is_locked: false // New seasons are never locked
      };
      
      const dbService = new DatabaseService();
      const newSeason = await dbService.createLeague(seasonData);
      
      return newSeason;
    } catch (error) {
      console.error('Error creating season:', error);
      
      // Handle duplicate name error
      if (error.message.includes('duplicate key value') || error.message.includes('already exists')) {
        throw new Error('A season with this name already exists. Please choose a different name.');
      }
      
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const dbService = new DatabaseService();
      const result = await dbService.executeQuery('leagues.update', { id, ...data });
      return result.data;
    } catch (error) {
      console.error('Error updating season:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      // Check if season has matches before deleting
      const { Match } = await import('@/entities/Match.js');
      const matches = await Match.getByLeague(id);
      
      if (matches.length > 0) {
        throw new Error('Cannot delete season with existing matches. End the season first.');
      }
      
      const dbService = new DatabaseService();
      await dbService.executeQuery('leagues.delete', { id });
      
      return true;
    } catch (error) {
      console.error('Error deleting season:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const seasons = await this.list();
      return seasons.find(season => season.id === parseInt(id));
    } catch (error) {
      console.error('Error finding season:', error);
      return null;
    }
  }

  static async getActive() {
    try {
      const dbService = new DatabaseService();
      const activeSeason = await dbService.getActiveLeague();
      return activeSeason;
    } catch (error) {
      console.error('Error getting active season:', error);
      return null;
    }
  }

  static async setActive(id) {
    try {
      const dbService = new DatabaseService();
      const result = await dbService.executeQuery('leagues.setActive', { id });
      return result.data;
    } catch (error) {
      console.error('Error setting active season:', error);
      throw error;
    }
  }

  static async endSeason(id) {
    try {
      const dbService = new DatabaseService();
      const result = await dbService.executeQuery('leagues.endSeason', { id });
      return result.data;
    } catch (error) {
      console.error('Error ending season:', error);
      throw error;
    }
  }

  static async deactivateAll() {
    try {
      const seasons = await this.list();
      const dbService = new DatabaseService();
      
      for (const season of seasons) {
        if (season.is_active) {
          await dbService.executeQuery('leagues.update', { 
            id: season.id, 
            is_active: false 
          });
        }
      }
    } catch (error) {
      console.error('Error deactivating seasons:', error);
      throw error;
    }
  }

  static async createDefault() {
    try {
      const existingSeasons = await this.list();
      
      // Only create default if no seasons exist
      if (existingSeasons.length === 0) {
        return await this.create({
          name: 'Default Season',
          description: 'Initial season for FIFA matches',
          start_date: new Date().toISOString().split('T')[0],
          is_active: true
        });
      }
      
      // Return active season or first season
      const activeSeason = await this.getActive();
      return activeSeason || existingSeasons[0];
    } catch (error) {
      console.error('Error creating default season:', error);
      throw error;
    }
  }

  // Check if season can be modified (not locked)
  static async canModify(id) {
    try {
      const season = await this.findById(id);
      return season && !season.is_locked;
    } catch (error) {
      console.error('Error checking season modify permission:', error);
      return false;
    }
  }

  // Export season data as CSV-like structure
  static async exportData(seasonId = null) {
    try {
      const { Match } = await import('@/entities/Match.js');
      
      if (seasonId) {
        const matches = await Match.getByLeague(seasonId);
        const season = await this.findById(seasonId);
        
        return {
          season: season,
          matches: matches,
          filename: `season_${season.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
        };
      } else {
        const allSeasons = await this.list();
        const allMatches = await Match.list();
        
        return {
          seasons: allSeasons,
          matches: allMatches,
          filename: `all_seasons_${new Date().toISOString().split('T')[0]}.json`
        };
      }
    } catch (error) {
      console.error('Error exporting season data:', error);
      throw error;
    }
  }
} 