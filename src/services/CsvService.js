import { GitHubService } from './GitHubService.js';

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
    if (!csvString || !csvString.trim()) {
      return [];
    }
    
    const lines = csvString.trim().split('\n');
    if (lines.length <= 1) {
      return [];
    }
    
    // Skip header row
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
   * Parse a CSV line handling quoted values
   */
  static parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
  
  /**
   * Read CSV data from GitHub or localStorage (fallback)
   */
  static async readCsv(filename, headers) {
    try {
      // Try GitHub first if configured
      if (GitHubService.isConfigured()) {
        try {
          const file = await GitHubService.getFile(filename);
          if (file.content) {
            return GitHubService.csvToArray(file.content, headers);
          }
        } catch (error) {
          console.warn(`Failed to read ${filename} from GitHub, falling back to localStorage:`, error.message);
        }
      }
      
      // Fallback to localStorage
      const storageKey = `fifa-csv-${filename}`;
      const csvData = localStorage.getItem(storageKey);
      
      if (!csvData) {
        // Return empty array if file doesn't exist
        return [];
      }
      
      return this.csvToObjects(csvData, headers);
    } catch (error) {
      console.error(`Error reading CSV file ${filename}:`, error);
      return [];
    }
  }
  
  /**
   * Write CSV data to GitHub and localStorage (backup)
   */
  static async writeCsv(filename, objects, headers) {
    try {
      const csvString = this.objectsToCsv(objects, headers);
      
      // Always save to localStorage as backup
      const storageKey = `fifa-csv-${filename}`;
      localStorage.setItem(storageKey, csvString);
      
      // Try to save to GitHub if configured
      if (GitHubService.isConfigured()) {
        try {
          await GitHubService.saveFile(filename, csvString, `Update ${filename} from FIFA Ranker`);
          console.log(`Successfully saved ${filename} to GitHub`);
        } catch (error) {
          console.warn(`Failed to save ${filename} to GitHub:`, error.message);
          // Don't throw error, localStorage backup exists
        }
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
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const backupKey = `fifa-backup-${filename}-${timestamp}`;
      
      // Keep only last 5 backups per file
      const allKeys = Object.keys(localStorage);
      const backupKeys = allKeys
        .filter(key => key.startsWith(`fifa-backup-${filename}-`))
        .sort()
        .reverse();
        
      // Remove old backups
      backupKeys.slice(5).forEach(key => {
        localStorage.removeItem(key);
      });
      
      localStorage.setItem(backupKey, csvString);
    } catch (error) {
      console.warn('Could not create backup:', error);
    }
  }
  
  /**
   * Export data as downloadable CSV file
   */
  static downloadCsv(filename, objects, headers) {
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
  }
  
  /**
   * Import data from uploaded CSV file
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
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  /**
   * Get list of all CSV files (backups) for a given filename
   */
  static getBackupList(filename) {
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys
      .filter(key => key.startsWith(`fifa-backup-${filename}-`))
      .sort()
      .reverse();
      
    return backupKeys.map(key => {
      const timestamp = key.replace(`fifa-backup-${filename}-`, '');
      return {
        key,
        timestamp: timestamp.replace(/-/g, ':'),
        filename: `${filename}-${timestamp}.csv`
      };
    });
  }
  
  /**
   * Restore from backup
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
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }
} 