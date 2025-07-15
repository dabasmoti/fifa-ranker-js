import { VercelBlobService } from './VercelBlobService.js';

export class CsvService {
  static DATA_DIR = '/data';
  
  /**
   * Convert array of objects to CSV string
   */
  static objectsToCsv(objects, headers) {
    if (!objects || objects.length === 0) {
      return headers.join(',') + '\n';
    }
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    objects.forEach(obj => {
      const row = headers.map(header => {
        const value = obj[header] || '';
        // Escape commas and quotes in CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n') + '\n';
  }

  /**
   * Convert CSV string to array of objects
   */
  static csvToObjects(csvString, headers) {
    if (!csvString || csvString.trim() === '') {
      return [];
    }
    
    const lines = csvString.trim().split('\n');
    
    if (lines.length === 0) {
      return [];
    }
    
    // Skip header row (first line)
    const dataLines = lines.slice(1);
    
    return dataLines.map(line => {
      const values = this.parseCsvLine(line);
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      return obj;
    });
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  static parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last field
    result.push(current);
    
    return result;
  }

  /**
   * Read CSV data from localStorage (and try Vercel Blob if available)
   */
  static async readCsv(filename, headers) {
    try {
      const storageKey = `fifa-csv-${filename}`;
      let csvString = null;
      
      // Always try to load from Vercel Blob first if configured
      if (VercelBlobService.isConfigured()) {
        try {
          console.log(`Attempting to load ${filename} from Vercel Blob...`);
          if (filename === 'players.csv') {
            csvString = await VercelBlobService.loadPlayers();
          } else if (filename === 'matches.csv') {
            csvString = await VercelBlobService.loadMatches();
          } else if (filename === 'leagues.csv') {
            csvString = await VercelBlobService.loadLeagues();
          }
          
          if (csvString) {
            console.log(`✅ Loaded ${filename} from Vercel Blob, updating local cache.`);
            localStorage.setItem(storageKey, csvString);
          } else {
            console.log(`No data for ${filename} in Vercel Blob.`);
          }
        } catch (error) {
          console.warn(`Could not load ${filename} from Vercel Blob:`, error.message);
        }
      } else {
        console.log(`Vercel Blob not configured, skipping cloud load for ${filename}`);
      }
      
      // If Vercel Blob failed or wasn't configured, try localStorage as a fallback
      if (!csvString) {
        console.log(`Falling back to localStorage for ${filename}.`);
        csvString = localStorage.getItem(storageKey);
      }
      
      if (!csvString) {
        console.log(`No data found for ${filename} in Vercel Blob or localStorage.`);
        return [];
      }
      
      return this.csvToObjects(csvString, headers);
    } catch (error) {
      console.error(`Error reading CSV file ${filename}:`, error);
      return [];
    }
  }
  
  /**
   * Write CSV data to localStorage and Vercel Blob
   */
  static async writeCsv(filename, objects, headers) {
    try {
      const csvString = this.objectsToCsv(objects, headers);
      
      // Save to localStorage
      const storageKey = `fifa-csv-${filename}`;
      localStorage.setItem(storageKey, csvString);
      
      // Save to Vercel Blob if configured
      if (VercelBlobService.isConfigured()) {
        try {
          if (filename === 'players.csv') {
            await VercelBlobService.savePlayers(csvString);
            console.log(`✅ Automatically saved players to Vercel Blob`);
          } else if (filename === 'matches.csv') {
            await VercelBlobService.saveMatches(csvString);
            console.log(`✅ Automatically saved matches to Vercel Blob`);
          } else if (filename === 'leagues.csv') {
            await VercelBlobService.saveLeagues(csvString);
            console.log(`✅ Automatically saved leagues to Vercel Blob`);
          }
        } catch (error) {
          console.warn(`Failed to save ${filename} to Vercel Blob:`, error.message);
          // Don't throw error, localStorage backup exists
        }
      } else {
        console.log(`Vercel Blob not configured, skipping cloud save for ${filename}`);
      }
      
      // Also create a downloadable backup
      this.createDownloadableBackup(filename, csvString);
      
      return true;
    } catch (error) {
      console.error(`Error writing CSV file ${filename}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a downloadable backup of the CSV data
   */
  static createDownloadableBackup(filename, csvString) {
    try {
      // Store backup with timestamp
      const timestamp = new Date().toISOString();
      const backupKey = `fifa-backup-${filename}-${timestamp}`;
      localStorage.setItem(backupKey, csvString);
      
      // Keep only last 5 backups per file
      const allKeys = Object.keys(localStorage);
      const backupKeys = allKeys
        .filter(key => key.startsWith(`fifa-backup-${filename}-`))
        .sort()
        .reverse();
        
      // Remove old backups (keep only 5 most recent)
      backupKeys.slice(5).forEach(key => {
        localStorage.removeItem(key);
      });
      
    } catch (error) {
      console.warn(`Could not create backup for ${filename}:`, error);
    }
  }

  /**
   * Download CSV file to user's computer
   */
  static downloadCsv(filename, objects, headers) {
    try {
      const csvString = this.objectsToCsv(objects, headers);
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
      }
    } catch (error) {
      console.error(`Error downloading CSV file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Import CSV from uploaded file
   */
  static async importCsv(file, headers) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvString = e.target.result;
          const objects = this.csvToObjects(csvString, headers);
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

  /**
   * Get list of available backups for a file
   */
  static getBackupList(filename) {
    try {
      const allKeys = Object.keys(localStorage);
      const backupKeys = allKeys
        .filter(key => key.startsWith(`fifa-backup-${filename}-`))
        .sort()
        .reverse();
        
      return backupKeys.map(key => {
        const timestamp = key.replace(`fifa-backup-${filename}-`, '');
        return {
          key,
          timestamp,
          date: new Date(timestamp)
        };
      });
    } catch (error) {
      console.error(`Error getting backup list for ${filename}:`, error);
      return [];
    }
  }

  /**
   * Restore data from a backup
   */
  static async restoreFromBackup(filename, backupKey) {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('Backup not found');
      }
      
      const storageKey = `fifa-csv-${filename}`;
      localStorage.setItem(storageKey, backupData);
      
      return true;
    } catch (error) {
      console.error(`Error restoring from backup:`, error);
      throw error;
    }
  }
} 