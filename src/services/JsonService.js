import VercelBlobService from './VercelBlobService.js';

/**
 * Service for handling JSON data operations with Vercel Blob storage only
 * No local storage fallbacks - pure cloud storage
 */
class JsonService {
  constructor() {
    this.blobService = new VercelBlobService();
    this.filenames = {
      players: 'fifa-players.json',
      matches: 'fifa-matches.json', 
      leagues: 'fifa-leagues.json'
    };
  }

  /**
   * Check if Vercel Blob API is available
   * @returns {Promise<boolean>}
   */
  async checkApiAvailability() {
    try {
      const response = await fetch('/api/blob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' })
      });
      
      const isAvailable = response.status !== 404;
      
      if (!isAvailable) {
        console.error('❌ Vercel Blob API not available. Please use "vercel dev" for development.');
        throw new Error('Vercel Blob API not available. Please run with "vercel dev".');
      }
      
      console.log('✅ Vercel Blob API is available');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to connect to Vercel Blob API:', error.message);
      throw new Error('Vercel Blob API not available. Please run with "vercel dev".');
    }
  }

  /**
   * Save data to Vercel Blob
   */
  async saveToBlob(type, data) {
    await this.checkApiAvailability();

    try {
      const filename = this.filenames[type];
      if (!filename) {
        throw new Error(`Unknown data type: ${type}`);
      }

      // Save to Vercel Blob as JSON
      const blob = await this.blobService.saveFile(filename, data);
      
      console.log(`✅ ${type} data saved to Vercel Blob (${data.length || 'unknown'} records)`);
      
      return { success: true, url: blob.url, storage: 'vercel-blob' };
      
    } catch (error) {
      console.error(`❌ Failed to save ${type} to Vercel Blob:`, error);
      throw error;
    }
  }

  /**
   * Load data from Vercel Blob
   */
  async loadFromBlob(type) {
    await this.checkApiAvailability();

    try {
      const filename = this.filenames[type];
      if (!filename) {
        throw new Error(`Unknown data type: ${type}`);
      }

      // Load from Vercel Blob
      const data = await this.blobService.loadFile(filename);
      
      if (!data) {
        console.log(`📭 No ${type} data found in Vercel Blob - starting with empty array`);
        return [];
      }

      // Ensure data is an array
      const arrayData = Array.isArray(data) ? data : [];
      console.log(`✅ Loaded ${arrayData.length} ${type} records from Vercel Blob`);
      
      return arrayData;
      
    } catch (error) {
      console.error(`❌ Failed to load ${type} from Vercel Blob:`, error);
      throw error;
    }
  }

  /**
   * Save players data
   */
  async savePlayers(players) {
    return await this.saveToBlob('players', players);
  }

  /**
   * Load players data
   */
  async loadPlayers() {
    return await this.loadFromBlob('players');
  }

  /**
   * Save matches data
   */
  async saveMatches(matches) {
    return await this.saveToBlob('matches', matches);
  }

  /**
   * Load matches data
   */
  async loadMatches() {
    return await this.loadFromBlob('matches');
  }

  /**
   * Save leagues data
   */
  async saveLeagues(leagues) {
    return await this.saveToBlob('leagues', leagues);
  }

  /**
   * Load leagues data
   */
  async loadLeagues() {
    return await this.loadFromBlob('leagues');
  }

  /**
   * Sync all data to Vercel Blob
   */
  async syncAll(data) {
    try {
      console.log('🔄 Starting data sync to Vercel Blob...');
      
      const results = [];
      
      if (data.players) {
        const playersResult = await this.savePlayers(data.players);
        results.push({ type: 'players', ...playersResult });
      }
      
      if (data.matches) {
        const matchesResult = await this.saveMatches(data.matches);
        results.push({ type: 'matches', ...matchesResult });
      }
      
      if (data.leagues) {
        const leaguesResult = await this.saveLeagues(data.leagues);
        results.push({ type: 'leagues', ...leaguesResult });
      }
      
      console.log('✅ Data sync completed');
      return { success: true, results };
      
    } catch (error) {
      console.error('❌ Data sync failed:', error);
      throw error;
    }
  }

  /**
   * Load all data from Vercel Blob
   */
  async loadAll() {
    try {
      console.log('📁 Loading all data from Vercel Blob...');
      
      const [players, matches, leagues] = await Promise.all([
        this.loadPlayers(),
        this.loadMatches(), 
        this.loadLeagues()
      ]);
      
      console.log('✅ All data loaded from Vercel Blob');
      return { players, matches, leagues };
      
    } catch (error) {
      console.error('❌ Failed to load all data:', error);
      throw error;
    }
  }

  /**
   * Export data in JSON format
   */
  async exportData(type) {
    const data = await this.loadFromBlob(type);
    const jsonString = JSON.stringify(data, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`📄 ${type} data exported as JSON`);
  }

  /**
   * Import data from JSON string
   */
  async importData(type, jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const arrayData = Array.isArray(data) ? data : [];
      
      await this.saveToBlob(type, arrayData);
      console.log(`📄 ${type} data imported from JSON (${arrayData.length} records)`);
      
      return arrayData;
    } catch (error) {
      console.error(`❌ Failed to import ${type} data:`, error);
      throw new Error(`Invalid JSON format for ${type} data`);
    }
  }

  /**
   * Clear all data from Vercel Blob
   */
  async clearAll() {
    try {
      console.log('🗑️ Clearing all data from Vercel Blob...');
      
      await Promise.all([
        this.savePlayers([]),
        this.saveMatches([]),
        this.saveLeagues([])
      ]);
      
      console.log('✅ All data cleared from Vercel Blob');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      throw error;
    }
  }
}

export default JsonService; 