import { CsvService } from '@/services/CsvService.js';

export class League {
  static CSV_FILENAME = 'leagues.csv';
  static CSV_HEADERS = ['id', 'name', 'description', 'start_date', 'end_date', 'is_active', 'created_date'];

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.is_active = data.is_active;
    this.created_date = data.created_date;
  }

  static async list() {
    try {
      const leagues = await CsvService.readCsv(this.CSV_FILENAME, this.CSV_HEADERS);
      return leagues.map(data => ({
        ...data,
        is_active: data.is_active === 'true'
      }));
    } catch (error) {
      console.error('Error loading leagues:', error);
      return [];
    }
  }

  static async create(data) {
    try {
      const leagues = await this.list();
      
      // Deactivate all other leagues if this one is set as active
      if (data.is_active) {
        leagues.forEach(league => {
          league.is_active = false;
        });
      }
      
      const newLeague = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description || '',
        start_date: data.start_date || new Date().toISOString().split('T')[0],
        end_date: data.end_date || '',
        is_active: data.is_active === true || data.is_active === 'true',
        created_date: new Date().toISOString()
      };
      
      leagues.push(newLeague);
      await CsvService.writeCsv(this.CSV_FILENAME, leagues, this.CSV_HEADERS);
      
      return newLeague;
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const leagues = await this.list();
      const leagueIndex = leagues.findIndex(league => league.id === id);
      
      if (leagueIndex === -1) {
        throw new Error('League not found');
      }

      // If setting this league as active, deactivate all others
      if (data.is_active) {
        leagues.forEach(league => {
          league.is_active = false;
        });
      }

      const updatedLeague = {
        ...leagues[leagueIndex],
        name: data.name || leagues[leagueIndex].name,
        description: data.description !== undefined ? data.description : leagues[leagueIndex].description,
        start_date: data.start_date || leagues[leagueIndex].start_date,
        end_date: data.end_date !== undefined ? data.end_date : leagues[leagueIndex].end_date,
        is_active: data.is_active !== undefined ? (data.is_active === true || data.is_active === 'true') : leagues[leagueIndex].is_active,
        updated_date: new Date().toISOString()
      };

      leagues[leagueIndex] = updatedLeague;
      await CsvService.writeCsv(this.CSV_FILENAME, leagues, this.CSV_HEADERS);
      
      return updatedLeague;
    } catch (error) {
      console.error('Error updating league:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const leagues = await this.list();
      const leagueToDelete = leagues.find(league => league.id === id);
      
      if (!leagueToDelete) {
        throw new Error('League not found');
      }

      // Don't allow deleting the active league if it has matches
      if (leagueToDelete.is_active) {
        const { Match } = await import('@/entities/Match.js');
        const matches = await Match.list();
        const leagueMatches = matches.filter(match => match.league_id === id);
        
        if (leagueMatches.length > 0) {
          throw new Error('Cannot delete active league with existing matches. End the league first.');
        }
      }
      
      const filteredLeagues = leagues.filter(league => league.id !== id);
      await CsvService.writeCsv(this.CSV_FILENAME, filteredLeagues, this.CSV_HEADERS);
      
      return true;
    } catch (error) {
      console.error('Error deleting league:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const leagues = await this.list();
      return leagues.find(league => league.id === id) || null;
    } catch (error) {
      console.error('Error finding league:', error);
      return null;
    }
  }

  static async getActive() {
    try {
      const leagues = await this.list();
      return leagues.find(league => league.is_active) || null;
    } catch (error) {
      console.error('Error finding active league:', error);
      return null;
    }
  }

  static async setActive(id) {
    try {
      const leagues = await this.list();
      
      // Deactivate all leagues
      leagues.forEach(league => {
        league.is_active = false;
      });
      
      // Activate the specified league
      const targetLeague = leagues.find(league => league.id === id);
      if (!targetLeague) {
        throw new Error('League not found');
      }
      
      targetLeague.is_active = true;
      await CsvService.writeCsv(this.CSV_FILENAME, leagues, this.CSV_HEADERS);
      
      return targetLeague;
    } catch (error) {
      console.error('Error setting active league:', error);
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
        end_date: endDate || new Date().toISOString().split('T')[0],
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
      
      return existingLeagues.find(l => l.is_active) || existingLeagues[0];
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
        Match.list(),
        Player.list()
      ]);
      
      const leagueMatches = matches.filter(match => match.league_id === leagueId);
      
      // Get unique players who played in this league
      const leaguePlayerNames = new Set();
      leagueMatches.forEach(match => {
        leaguePlayerNames.add(match.team1_player1);
        leaguePlayerNames.add(match.team1_player2);
        leaguePlayerNames.add(match.team2_player1);
        leaguePlayerNames.add(match.team2_player2);
      });
      
      return {
        total_matches: leagueMatches.length,
        total_players: leaguePlayerNames.size,
        date_range: leagueMatches.length > 0 ? {
          start: Math.min(...leagueMatches.map(m => new Date(m.match_date))),
          end: Math.max(...leagueMatches.map(m => new Date(m.match_date)))
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
      const matches = await Match.list();
      const leagueMatches = matches.filter(match => match.league_id === leagueId);
      
      if (!league) {
        throw new Error('League not found');
      }
      
      // Export matches for this league
      const filename = `${league.name.replace(/[^a-zA-Z0-9]/g, '_')}_matches.csv`;
      CsvService.downloadCsv(filename, leagueMatches, Match.CSV_HEADERS);
      
      return filename;
    } catch (error) {
      console.error('Error exporting league data:', error);
      throw error;
    }
  }
} 