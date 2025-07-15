export class VercelKvService {
  static KEYS = {
    PLAYERS: 'fifa-players',
    MATCHES: 'fifa-matches', 
    LEAGUES: 'fifa-leagues'
  };

  /**
   * Get KV instance (only works in production/server environment)
   */
  static async getKv() {
    try {
      // Only try to import in server environment or production
      if (typeof window === 'undefined' && process.env.KV_REST_API_URL) {
        const { kv } = await import('@vercel/kv');
        return kv;
      }
      return null;
    } catch (error) {
      console.log('Vercel KV not available:', error.message);
      return null;
    }
  }

  /**
   * Check if running in production with KV configured
   */
  static async isConfigured() {
    const kv = await this.getKv();
    return kv && process.env.KV_REST_API_URL;
  }

  /**
   * Save players data to Vercel KV
   */
  static async savePlayers(players) {
    try {
      const kv = await this.getKv();
      if (!kv) {
        console.log('KV not available, skipping save');
        return false;
      }

      await kv.set(this.KEYS.PLAYERS, JSON.stringify(players));
      console.log('Players saved to Vercel KV');
      return true;
    } catch (error) {
      console.error('Error saving players to KV:', error);
      return false;
    }
  }

  /**
   * Save matches data to Vercel KV
   */
  static async saveMatches(matches) {
    try {
      const kv = await this.getKv();
      if (!kv) {
        console.log('KV not available, skipping save');
        return false;
      }

      await kv.set(this.KEYS.MATCHES, JSON.stringify(matches));
      console.log('Matches saved to Vercel KV');
      return true;
    } catch (error) {
      console.error('Error saving matches to KV:', error);
      return false;
    }
  }

  /**
   * Save leagues data to Vercel KV
   */
  static async saveLeagues(leagues) {
    try {
      const kv = await this.getKv();
      if (!kv) {
        console.log('KV not available, skipping save');
        return false;
      }

      await kv.set(this.KEYS.LEAGUES, JSON.stringify(leagues));
      console.log('Leagues saved to Vercel KV');
      return true;
    } catch (error) {
      console.error('Error saving leagues to KV:', error);
      return false;
    }
  }

  /**
   * Load players data from Vercel KV
   */
  static async loadPlayers() {
    try {
      const kv = await this.getKv();
      if (!kv) {
        return null;
      }

      const data = await kv.get(this.KEYS.PLAYERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading players from KV:', error);
      return null;
    }
  }

  /**
   * Load matches data from Vercel KV
   */
  static async loadMatches() {
    try {
      const kv = await this.getKv();
      if (!kv) {
        return null;
      }

      const data = await kv.get(this.KEYS.MATCHES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading matches from KV:', error);
      return null;
    }
  }

  /**
   * Load leagues data from Vercel KV
   */
  static async loadLeagues() {
    try {
      const kv = await this.getKv();
      if (!kv) {
        return null;
      }

      const data = await kv.get(this.KEYS.LEAGUES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading leagues from KV:', error);
      return null;
    }
  }

  /**
   * Save all data to Vercel KV
   */
  static async saveAllData(players, matches, leagues) {
    const results = {
      players: await this.savePlayers(players),
      matches: await this.saveMatches(matches),
      leagues: await this.saveLeagues(leagues)
    };

    return results;
  }

  /**
   * Load all data from Vercel KV
   */
  static async loadAllData() {
    const [players, matches, leagues] = await Promise.all([
      this.loadPlayers(),
      this.loadMatches(),
      this.loadLeagues()
    ]);

    return { players, matches, leagues };
  }

  /**
   * Sync localStorage data to Vercel KV
   */
  static async syncFromLocalStorage() {
    try {
      const kv = await this.getKv();
      if (!kv) {
        console.log('KV not configured for sync');
        return false;
      }

      // Get data from localStorage
      const playersData = localStorage.getItem('fifa-csv-players.csv');
      const matchesData = localStorage.getItem('fifa-csv-matches.csv');
      const leaguesData = localStorage.getItem('fifa-csv-leagues.csv');

      // Parse CSV data to JSON (simplified - you may need to enhance this)
      const players = playersData ? this.parseCsvToJson(playersData, ['id', 'name', 'created_date']) : [];
      const matches = matchesData ? this.parseCsvToJson(matchesData, [
        'id', 'league_id', 'team1_player1', 'team1_player2', 'team2_player1', 'team2_player2',
        'team1_score', 'team2_score', 'match_date', 'created_date'
      ]) : [];
      const leagues = leaguesData ? this.parseCsvToJson(leaguesData, [
        'id', 'name', 'description', 'start_date', 'end_date', 'is_active', 'created_date'
      ]) : [];

      await this.saveAllData(players, matches, leagues);
      console.log('Successfully synced localStorage to Vercel KV');
      return true;
    } catch (error) {
      console.error('Error syncing to KV:', error);
      return false;
    }
  }

  /**
   * Simple CSV to JSON parser
   */
  static parseCsvToJson(csvString, headers) {
    if (!csvString) return [];
    
    const lines = csvString.trim().split('\n');
    if (lines.length <= 1) return [];
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    return dataLines.map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  }

  /**
   * Get sync status
   */
  static async getSyncStatus() {
    const kv = await this.getKv();
    if (!kv) {
      return {
        configured: false,
        message: 'Vercel KV not configured'
      };
    }

    try {
      const kvData = await this.loadAllData();
      const localPlayers = JSON.parse(localStorage.getItem('fifa-csv-players.csv') || '[]');
      const localMatches = JSON.parse(localStorage.getItem('fifa-csv-matches.csv') || '[]');
      const localLeagues = JSON.parse(localStorage.getItem('fifa-csv-leagues.csv') || '[]');

      return {
        configured: true,
        players: {
          local: Array.isArray(localPlayers) ? localPlayers.length : 0,
          kv: kvData.players ? kvData.players.length : 0
        },
        matches: {
          local: Array.isArray(localMatches) ? localMatches.length : 0,
          kv: kvData.matches ? kvData.matches.length : 0
        },
        leagues: {
          local: Array.isArray(localLeagues) ? localLeagues.length : 0,
          kv: kvData.leagues ? kvData.leagues.length : 0
        }
      };
    } catch (error) {
      return {
        configured: true,
        error: error.message
      };
    }
  }
} 