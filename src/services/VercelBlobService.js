// Mock implementation for local development
class LocalBlobMock {
  static STORAGE_PREFIX = 'vercel-blob-mock-';

  static async saveFile(filename, content) {
    try {
      console.log(`🔧 [LOCAL MOCK] Saving ${filename}...`);
      localStorage.setItem(this.STORAGE_PREFIX + filename, content);
      console.log(`✅ [LOCAL MOCK] ${filename} saved to localStorage`);
      return { success: true, url: `mock://${filename}` };
    } catch (error) {
      console.error(`❌ [LOCAL MOCK] Failed to save ${filename}:`, error);
      return { success: false, error: error.message };
    }
  }

  static async loadFile(filename) {
    try {
      console.log(`📥 [LOCAL MOCK] Loading ${filename}...`);
      const content = localStorage.getItem(this.STORAGE_PREFIX + filename);
      if (content) {
        console.log(`✅ [LOCAL MOCK] ${filename} loaded (${content.length} chars)`);
        return content;
      } else {
        console.log(`📭 [LOCAL MOCK] ${filename} not found`);
        return null;
      }
    } catch (error) {
      console.error(`❌ [LOCAL MOCK] Failed to load ${filename}:`, error);
      return null;
    }
  }
}

// Real Vercel Blob implementation for production
class ProductionBlobService {
  static async saveFile(filename, content) {
    try {
      console.log(`🚀 [PRODUCTION] Saving ${filename} to Vercel Blob...`);
      
      const { put } = await import('@vercel/blob');
      const blob = await put(filename, content, {
        access: 'public',
        allowOverwrite: true
      });

      console.log(`✅ [PRODUCTION] ${filename} saved to Vercel Blob`);
      console.log(`🔗 URL: ${blob.url}`);
      
      return { success: true, url: blob.url };
    } catch (error) {
      console.error(`❌ [PRODUCTION] Failed to save ${filename}:`, error);
      return { success: false, error: error.message };
    }
  }

  static async loadFile(filename) {
    try {
      console.log(`📥 [PRODUCTION] Loading ${filename} from Vercel Blob...`);
      
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: filename });
      
      if (blobs.length === 0) {
        console.log(`📭 [PRODUCTION] ${filename} not found in Vercel Blob`);
        return null;
      }

      const blob = blobs[0];
      const response = await fetch(blob.url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
      }
      
      const content = await response.text();
      console.log(`✅ [PRODUCTION] ${filename} loaded (${content.length} chars)`);
      
      return content;
    } catch (error) {
      console.error(`❌ [PRODUCTION] Failed to load ${filename}:`, error);
      return null;
    }
  }
}

// Smart service that chooses the right implementation
export class VercelBlobService {
  /**
   * Detect if we're running in production (Vercel) or development
   */
  static isProduction() {
    // Check if we're in a browser environment first
    if (typeof window === 'undefined') return false;
    
    // Check for Vercel deployment
    const isVercelDomain = window.location.hostname.includes('vercel.app') || 
                          window.location.hostname.includes('vercel.com');
    
    // Check for Vercel environment variable (safely)
    const isVercelEnv = import.meta.env?.VERCEL === '1' || 
                       import.meta.env?.VITE_VERCEL === '1';
    
    return isVercelDomain || isVercelEnv;
  }

  /**
   * Check if service is configured
   */
  static isConfigured() {
    if (this.isProduction()) {
      // In production, check for the server-side token
      const token = import.meta.env?.VITE_BLOB_READ_WRITE_TOKEN;
      const configured = !!token;
      console.log('🔍 [PRODUCTION] Vercel Blob configured:', configured);
      return configured;
    } else {
      console.log('🔧 [DEVELOPMENT] Using local blob mock (always configured)');
      return true; // Local mock is always "configured"
    }
  }

  /**
   * Get the appropriate service implementation
   */
  static getService() {
    return this.isProduction() ? ProductionBlobService : LocalBlobMock;
  }

  /**
   * Save file using the appropriate service
   */
  static async saveFile(filename, content) {
    const service = this.getService();
    return await service.saveFile(filename, content);
  }

  /**
   * Load file using the appropriate service
   */
  static async loadFile(filename) {
    const service = this.getService();
    return await service.loadFile(filename);
  }

  /**
   * Save players CSV
   */
  static async savePlayers(csvContent) {
    return await this.saveFile('fifa-players.csv', csvContent);
  }

  /**
   * Load players CSV
   */
  static async loadPlayers() {
    return await this.loadFile('fifa-players.csv');
  }

  /**
   * Save matches CSV
   */
  static async saveMatches(csvContent) {
    return await this.saveFile('fifa-matches.csv', csvContent);
  }

  /**
   * Load matches CSV
   */
  static async loadMatches() {
    return await this.loadFile('fifa-matches.csv');
  }

  /**
   * Save leagues CSV
   */
  static async saveLeagues(csvContent) {
    return await this.saveFile('fifa-leagues.csv', csvContent);
  }

  /**
   * Load leagues CSV
   */
  static async loadLeagues() {
    return await this.loadFile('fifa-leagues.csv');
  }

  /**
   * Sync all data
   */
  static async syncAll() {
    try {
      const results = {
        players: false,
        matches: false,
        leagues: false
      };

      const playersData = localStorage.getItem('fifa-csv-players.csv');
      const matchesData = localStorage.getItem('fifa-csv-matches.csv');
      const leaguesData = localStorage.getItem('fifa-csv-leagues.csv');

      const env = this.isProduction() ? 'PRODUCTION' : 'DEVELOPMENT';
      console.log(`💾 [${env}] Syncing data:`, {
        hasPlayers: !!playersData,
        hasMatches: !!matchesData,
        hasLeagues: !!leaguesData
      });

      if (playersData) {
        const result = await this.savePlayers(playersData);
        results.players = result?.success || false;
      }

      if (matchesData) {
        const result = await this.saveMatches(matchesData);
        results.matches = result?.success || false;
      }

      if (leaguesData) {
        const result = await this.saveLeagues(leaguesData);
        results.leagues = result?.success || false;
      }

      console.log(`🔄 [${env}] Sync results:`, results);
      return results;
      
    } catch (error) {
      console.error('❌ Failed to sync all data:', error);
      return { players: false, matches: false, leagues: false };
    }
  }
} 