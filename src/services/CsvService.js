import VercelBlobService from './VercelBlobService.js';

/**
 * Service for handling CSV operations with automatic Vercel Blob sync
 * Handles both local development and production environments
 */
class CsvService {
  constructor() {
    this.filenames = {
      players: 'fifa-players.csv',
      matches: 'fifa-matches.csv', 
      leagues: 'fifa-leagues.csv'
    };
  }

  /**
   * Convert array of objects to CSV string
   */
  arrayToCSV(data, headers) {
    if (!data || data.length === 0) {
      return headers.join(',') + '\n';
    }

    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  /**
   * Parse CSV string to array of objects
   */
  csvToArray(csvData, headers) {
    if (!csvData || csvData.trim() === '') {
      return [];
    }

    const lines = csvData.trim().split('\n');
    
    // Skip header row if it exists
    const dataLines = lines.length > 1 && lines[0] === headers.join(',') 
      ? lines.slice(1) 
      : lines;

    return dataLines.map(line => {
      const values = this.parseCSVLine(line);
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      return obj;
    });
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current);
    return values;
  }

  /**
   * Save data to Vercel Blob with automatic sync
   */
  async saveToBlob(type, data, headers) {
    try {
      const filename = this.filenames[type];
      if (!filename) {
        throw new Error(`Unknown data type: ${type}`);
      }

      // Check if Vercel Blob is available
      if (!VercelBlobService.isAvailable()) {
        console.warn(`⚠️ Vercel Blob not available - cannot save ${filename}`);
        return { success: false, error: 'Vercel Blob not configured' };
      }

      // Convert data to CSV
      const csvData = this.arrayToCSV(data, headers);
      
      // Save to Vercel Blob
      const blob = await VercelBlobService.saveFile(filename, csvData);
      
      console.log(`✅ ${type} data saved to Vercel Blob`);
      return { success: true, url: blob.url };
      
    } catch (error) {
      console.error(`❌ Failed to save ${type} to Vercel Blob:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load data from Vercel Blob
   */
  async loadFromBlob(type, headers) {
    try {
      const filename = this.filenames[type];
      if (!filename) {
        throw new Error(`Unknown data type: ${type}`);
      }

      // Check if Vercel Blob is available
      if (!VercelBlobService.isAvailable()) {
        console.warn(`⚠️ Vercel Blob not available - cannot load ${filename}`);
        return [];
      }

      // Load from Vercel Blob
      const csvData = await VercelBlobService.loadFile(filename);
      
      if (!csvData) {
        console.log(`📭 No ${type} data found in Vercel Blob`);
        return [];
      }

      // Parse CSV data
      const data = this.csvToArray(csvData, headers);
      console.log(`✅ Loaded ${data.length} ${type} records from Vercel Blob`);
      
      return data;
      
    } catch (error) {
      console.error(`❌ Failed to load ${type} from Vercel Blob:`, error);
      return [];
    }
  }

  /**
   * Save players data
   */
  async savePlayers(players) {
    const headers = ['id', 'name', 'rating', 'position', 'nationality', 'club'];
    return await this.saveToBlob('players', players, headers);
  }

  /**
   * Load players data
   */
  async loadPlayers() {
    const headers = ['id', 'name', 'rating', 'position', 'nationality', 'club'];
    return await this.loadFromBlob('players', headers);
  }

  /**
   * Save matches data with automatic blob sync
   */
  async saveMatches(matches) {
    const headers = ['id', 'date', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'result', 'seasonId'];
    return await this.saveToBlob('matches', matches, headers);
  }

  /**
   * Load matches data
   */
  async loadMatches() {
    const headers = ['id', 'date', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'result', 'seasonId'];
    return await this.loadFromBlob('matches', headers);
  }

  /**
   * Save leagues data
   */
  async saveLeagues(leagues) {
    const headers = ['id', 'name', 'country', 'season'];
    return await this.saveToBlob('leagues', leagues, headers);
  }

  /**
   * Load leagues data
   */
  async loadLeagues() {
    const headers = ['id', 'name', 'country', 'season'];
    return await this.loadFromBlob('leagues', headers);
  }

  /**
   * Get service status
   */
  getStatus() {
    return VercelBlobService.getStatus();
  }

  /**
   * Sync all data to Vercel Blob
   */
  async syncAll(data) {
    try {
      console.log('🔄 Starting data sync to Vercel Blob...');
      
      const results = {
        players: { success: false },
        matches: { success: false },
        leagues: { success: false }
      };

      // Save players
      if (data.players && data.players.length > 0) {
        results.players = await this.savePlayers(data.players);
      }

      // Save matches  
      if (data.matches && data.matches.length > 0) {
        results.matches = await this.saveMatches(data.matches);
      }

      // Save leagues
      if (data.leagues && data.leagues.length > 0) {
        results.leagues = await this.saveLeagues(data.leagues);
      }

      const successCount = Object.values(results).filter(r => r.success).length;
      console.log(`✅ Sync completed: ${successCount}/3 files synced successfully`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Failed to sync data:', error);
      return {
        players: { success: false, error: error.message },
        matches: { success: false, error: error.message },
        leagues: { success: false, error: error.message }
      };
    }
  }

  /**
   * Load all data from Vercel Blob
   */
  async loadAll() {
    try {
      console.log('📥 Loading all data from Vercel Blob...');
      
      const [players, matches, leagues] = await Promise.all([
        this.loadPlayers(),
        this.loadMatches(), 
        this.loadLeagues()
      ]);

      console.log(`✅ Loaded data: ${players.length} players, ${matches.length} matches, ${leagues.length} leagues`);
      
      return { players, matches, leagues };
      
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      return { players: [], matches: [], leagues: [] };
    }
  }

  // Compatibility methods for existing entity classes
  
  /**
   * Read CSV data (compatibility method)
   */
  async readCsv(filename, headers) {
    // Map filename to type
    let type;
    if (filename.includes('players')) type = 'players';
    else if (filename.includes('matches')) type = 'matches';
    else if (filename.includes('leagues')) type = 'leagues';
    else {
      console.warn(`Unknown filename: ${filename}`);
      return [];
    }

    return await this.loadFromBlob(type, headers);
  }

  /**
   * Write CSV data (compatibility method)
   */
  async writeCsv(filename, objects, headers) {
    // Map filename to type
    let type;
    if (filename.includes('players')) type = 'players';
    else if (filename.includes('matches')) type = 'matches';
    else if (filename.includes('leagues')) type = 'leagues';
    else {
      console.warn(`Unknown filename: ${filename}`);
      return false;
    }

    const result = await this.saveToBlob(type, objects, headers);
    return result.success;
  }

  /**
   * Download CSV file to user's computer (compatibility method)
   */
  downloadCsv(filename, objects, headers) {
    try {
      const csvString = this.arrayToCSV(objects, headers);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error(`Error downloading CSV file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Import CSV from uploaded file (compatibility method)
   */
  async importCsv(file, headers) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvString = e.target.result;
          const objects = this.csvToArray(csvString, headers);
          resolve(objects);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
}

export default new CsvService(); 