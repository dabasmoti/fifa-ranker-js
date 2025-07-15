import { VercelBlobService } from './VercelBlobService.js';

export class CsvService {
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
   * Read CSV data from Vercel Blob storage only
   */
  static async readCsv(filename, headers) {
    try {
      if (!VercelBlobService.isConfigured()) {
        console.log(`❌ Vercel Blob not configured - cannot load ${filename}`);
        return [];
      }

      console.log(`📥 Loading ${filename} from Vercel Blob...`);
      
      let csvString = null;
      if (filename === 'players.csv') {
        csvString = await VercelBlobService.loadPlayers();
      } else if (filename === 'matches.csv') {
        csvString = await VercelBlobService.loadMatches();
      } else if (filename === 'leagues.csv') {
        csvString = await VercelBlobService.loadLeagues();
      }
      
      if (!csvString) {
        console.log(`📭 No data found for ${filename} in Vercel Blob`);
        return [];
      }
      
      console.log(`✅ Loaded ${filename} from Vercel Blob (${csvString.length} chars)`);
      return this.csvToObjects(csvString, headers);
      
    } catch (error) {
      console.error(`❌ Error reading CSV file ${filename} from Vercel Blob:`, error);
      return [];
    }
  }
  
  /**
   * Write CSV data to Vercel Blob storage only
   */
  static async writeCsv(filename, objects, headers) {
    try {
      if (!VercelBlobService.isConfigured()) {
        console.log(`❌ Vercel Blob not configured - cannot save ${filename}`);
        throw new Error('Vercel Blob not configured. This app only works when deployed on Vercel.');
      }

      const csvString = this.objectsToCsv(objects, headers);
      console.log(`💾 Saving ${filename} to Vercel Blob...`);
      
      let result;
      if (filename === 'players.csv') {
        result = await VercelBlobService.savePlayers(csvString);
      } else if (filename === 'matches.csv') {
        result = await VercelBlobService.saveMatches(csvString);
      } else if (filename === 'leagues.csv') {
        result = await VercelBlobService.saveLeagues(csvString);
      }
      
      if (!result?.success) {
        throw new Error(`Failed to save ${filename} to Vercel Blob: ${result?.error || 'Unknown error'}`);
      }
      
      console.log(`✅ Successfully saved ${filename} to Vercel Blob`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error writing CSV file ${filename} to Vercel Blob:`, error);
      throw error;
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
   * Get all available files in Vercel Blob storage
   */
  static async listFiles() {
    try {
      if (!VercelBlobService.isConfigured()) {
        console.log('❌ Vercel Blob not configured - cannot list files');
        return [];
      }
      
      return await VercelBlobService.listFiles();
    } catch (error) {
      console.error('❌ Error listing files from Vercel Blob:', error);
      return [];
    }
  }

  /**
   * Delete a CSV file from Vercel Blob storage
   */
  static async deleteFile(filename) {
    try {
      if (!VercelBlobService.isConfigured()) {
        console.log(`❌ Vercel Blob not configured - cannot delete ${filename}`);
        return false;
      }
      
      return await VercelBlobService.deleteFile(filename);
    } catch (error) {
      console.error(`❌ Error deleting file ${filename} from Vercel Blob:`, error);
      return false;
    }
  }
} 