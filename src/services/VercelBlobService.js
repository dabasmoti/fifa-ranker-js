export class VercelBlobService {
  /**
   * Check if Vercel Blob is configured
   */
  static isConfigured() {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const configured = !!token;
    console.log('🔍 Vercel Blob configured:', configured);
    if (!configured) {
      console.log('❌ BLOB_READ_WRITE_TOKEN not found. This service only works when deployed on Vercel.');
    }
    return configured;
  }

  /**
   * Save file to Vercel Blob storage
   */
  static async saveFile(filename, content) {
    try {
      if (!this.isConfigured()) {
        console.log('❌ Vercel Blob not configured - skipping save');
        return { success: false, error: 'Vercel Blob not configured' };
      }

      console.log(`🚀 Saving ${filename} to Vercel Blob...`);
      
      const { put } = await import('@vercel/blob');
      const blob = await put(filename, content, {
        access: 'public',
        allowOverwrite: true
      });

      console.log(`✅ ${filename} saved to Vercel Blob successfully!`);
      console.log(`🔗 URL: ${blob.url}`);
      
      return { success: true, url: blob.url };
    } catch (error) {
      console.error(`❌ Failed to save ${filename} to Vercel Blob:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load file from Vercel Blob storage
   */
  static async loadFile(filename) {
    try {
      if (!this.isConfigured()) {
        console.log('❌ Vercel Blob not configured - cannot load');
        return null;
      }

      console.log(`📥 Loading ${filename} from Vercel Blob...`);
      
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: filename });
      
      if (blobs.length === 0) {
        console.log(`📭 ${filename} not found in Vercel Blob`);
        return null;
      }

      const blob = blobs[0];
      const response = await fetch(blob.url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
      }
      
      const content = await response.text();
      console.log(`✅ ${filename} loaded from Vercel Blob (${content.length} chars)`);
      
      return content;
    } catch (error) {
      console.error(`❌ Failed to load ${filename} from Vercel Blob:`, error);
      return null;
    }
  }

  /**
   * Delete file from Vercel Blob storage
   */
  static async deleteFile(filename) {
    try {
      if (!this.isConfigured()) {
        console.log('❌ Vercel Blob not configured - cannot delete');
        return false;
      }

      console.log(`🗑️ Deleting ${filename} from Vercel Blob...`);
      
      const { list, del } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: filename });
      
      if (blobs.length === 0) {
        console.log(`📭 ${filename} not found in Vercel Blob`);
        return true; // Already deleted
      }

      // Delete all matching blobs
      for (const blob of blobs) {
        await del(blob.url);
      }
      
      console.log(`✅ ${filename} deleted from Vercel Blob`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete ${filename} from Vercel Blob:`, error);
      return false;
    }
  }

  /**
   * List all files in Vercel Blob storage
   */
  static async listFiles() {
    try {
      if (!this.isConfigured()) {
        console.log('❌ Vercel Blob not configured - cannot list');
        return [];
      }

      console.log('📋 Listing files in Vercel Blob...');
      
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: 'fifa-' });
      
      console.log(`✅ Found ${blobs.length} files in Vercel Blob`);
      
      return blobs.map(blob => ({
        filename: blob.pathname,
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt
      }));
    } catch (error) {
      console.error('❌ Failed to list files in Vercel Blob:', error);
      return [];
    }
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
   * Sync all data to Vercel Blob
   */
  static async syncAll() {
    try {
      if (!this.isConfigured()) {
        console.log('❌ Vercel Blob not configured - sync skipped');
        return { players: false, matches: false, leagues: false };
      }

      const results = {
        players: false,
        matches: false,
        leagues: false
      };

      // Get current CSV data from localStorage (temporary until blob is available)
      const playersData = localStorage.getItem('fifa-csv-players.csv');
      const matchesData = localStorage.getItem('fifa-csv-matches.csv');
      const leaguesData = localStorage.getItem('fifa-csv-leagues.csv');

      console.log('💾 Syncing data to Vercel Blob:', {
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

      console.log('🔄 Sync results:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Failed to sync all data:', error);
      return { players: false, matches: false, leagues: false };
    }
  }
} 