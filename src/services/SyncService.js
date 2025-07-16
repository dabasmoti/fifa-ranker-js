import JsonService from './JsonService.js';
import { MigrationService } from '@/utils/migration.js';

/**
 * Service for synchronizing data between different storage systems
 * Handles conflicts between localStorage, CSV, and Vercel Blob
 */
export class SyncService {
  constructor() {
    this.jsonService = new JsonService();
  }

  /**
   * Check the current data state across all storage systems
   * @returns {Promise<Object>} Status of each storage system
   */
  async checkDataState() {
    try {
      const state = {
        localStorage: {
          hasData: false,
          players: 0,
          matches: 0,
          lastModified: null
        },
        vercelBlob: {
          hasData: false,
          players: 0,
          matches: 0,
          leagues: 0,
          lastModified: null,
          apiAvailable: false
        },
        conflicts: [],
        recommendations: []
      };

      // Check localStorage
      const legacyPlayers = localStorage.getItem('fifa-players');
      const legacyMatches = localStorage.getItem('fifa-matches');
      
      if (legacyPlayers) {
        try {
          const players = JSON.parse(legacyPlayers);
          state.localStorage.hasData = true;
          state.localStorage.players = Array.isArray(players) ? players.length : 0;
        } catch (e) {
          console.warn('Invalid localStorage players data');
        }
      }

      if (legacyMatches) {
        try {
          const matches = JSON.parse(legacyMatches);
          state.localStorage.hasData = true;
          state.localStorage.matches = Array.isArray(matches) ? matches.length : 0;
        } catch (e) {
          console.warn('Invalid localStorage matches data');
        }
      }

      // Check Vercel Blob
      try {
        await this.jsonService.checkApiAvailability();
        state.vercelBlob.apiAvailable = true;

        const [players, matches, leagues] = await Promise.all([
          this.jsonService.loadPlayers(),
          this.jsonService.loadMatches(),
          this.jsonService.loadLeagues()
        ]);

        state.vercelBlob.hasData = players.length > 0 || matches.length > 0 || leagues.length > 0;
        state.vercelBlob.players = players.length;
        state.vercelBlob.matches = matches.length;
        state.vercelBlob.leagues = leagues.length;

      } catch (error) {
        console.warn('Vercel Blob API not available:', error.message);
        state.vercelBlob.apiAvailable = false;
      }

      // Analyze conflicts and generate recommendations
      this.analyzeConflicts(state);

      return state;

    } catch (error) {
      console.error('Error checking data state:', error);
      throw new Error('Failed to check data state');
    }
  }

  /**
   * Analyze conflicts between storage systems and generate recommendations
   * @param {Object} state - Current data state
   */
  analyzeConflicts(state) {
    const { localStorage: local, vercelBlob: blob } = state;

    // Check for conflicts
    if (local.hasData && blob.hasData) {
      if (local.players !== blob.players) {
        state.conflicts.push({
          type: 'players',
          message: `Player count mismatch: localStorage(${local.players}) vs Vercel Blob(${blob.players})`
        });
      }

      if (local.matches !== blob.matches) {
        state.conflicts.push({
          type: 'matches',
          message: `Match count mismatch: localStorage(${local.matches}) vs Vercel Blob(${blob.matches})`
        });
      }
    }

    // Generate recommendations
    if (local.hasData && !blob.hasData && blob.apiAvailable) {
      state.recommendations.push({
        action: 'migrate_to_blob',
        message: 'Migrate localStorage data to Vercel Blob',
        priority: 'high'
      });
    } else if (!local.hasData && blob.hasData) {
      state.recommendations.push({
        action: 'clear_legacy',
        message: 'Clear any remaining legacy data',
        priority: 'low'
      });
    } else if (local.hasData && blob.hasData && state.conflicts.length > 0) {
      state.recommendations.push({
        action: 'resolve_conflicts',
        message: 'Resolve data conflicts between storage systems',
        priority: 'high'
      });
    } else if (!blob.apiAvailable) {
      state.recommendations.push({
        action: 'fix_api',
        message: 'Start Vercel dev server to enable Blob API',
        priority: 'critical'
      });
    }
  }

  /**
   * Migrate all data from localStorage to Vercel Blob
   * @returns {Promise<Object>} Migration results
   */
  async migrateToBlob() {
    try {
      console.log('🔄 Starting migration from localStorage to Vercel Blob...');

      // Check if Vercel Blob API is available
      await this.jsonService.checkApiAvailability();

      // Use the existing migration service
      const migrationResult = await MigrationService.migrateAll();

      if (migrationResult.success) {
        console.log('✅ Migration completed successfully');
        
        // Create backup and clear localStorage
        MigrationService.createLegacyBackup();
        MigrationService.clearLegacyData();

        return {
          success: true,
          message: 'Data migrated successfully to Vercel Blob',
          details: migrationResult
        };
      } else {
        throw new Error(migrationResult.message || 'Migration failed');
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Force sync data from Vercel Blob to update local cache
   * @returns {Promise<Object>} Sync results
   */
  async forceSyncFromBlob() {
    try {
      console.log('🔄 Force syncing data from Vercel Blob...');

      // Check if Vercel Blob API is available
      await this.jsonService.checkApiAvailability();

      // Load all data from Vercel Blob with cache busting
      const data = await this.jsonService.loadAll();

      console.log('✅ Data force synced from Vercel Blob');
      return {
        success: true,
        message: 'Data successfully synced from Vercel Blob',
        data
      };

    } catch (error) {
      console.error('❌ Force sync failed:', error);
      throw error;
    }
  }

  /**
   * Resolve conflicts by choosing a preferred data source
   * @param {string} preferredSource - 'localStorage' or 'vercelBlob'
   * @returns {Promise<Object>} Resolution results
   */
  async resolveConflicts(preferredSource = 'vercelBlob') {
    try {
      console.log(`🔄 Resolving conflicts with preferred source: ${preferredSource}`);

      if (preferredSource === 'localStorage') {
        // Migrate localStorage data to Vercel Blob (overwrite)
        return await this.migrateToBlob();
      } else {
        // Use Vercel Blob as source of truth
        const result = await this.forceSyncFromBlob();
        
        // Clear localStorage data after successful sync
        MigrationService.createLegacyBackup();
        MigrationService.clearLegacyData();

        return {
          ...result,
          message: 'Conflicts resolved using Vercel Blob as source of truth'
        };
      }

    } catch (error) {
      console.error('❌ Conflict resolution failed:', error);
      throw error;
    }
  }

  /**
   * Backup all data to download files
   * @returns {Promise<Object>} Backup results
   */
  async backupAllData() {
    try {
      console.log('💾 Creating backup of all data...');

      const backups = {
        localStorage: null,
        vercelBlob: null
      };

      // Backup localStorage if it exists
      const legacyPlayers = localStorage.getItem('fifa-players');
      const legacyMatches = localStorage.getItem('fifa-matches');

      if (legacyPlayers || legacyMatches) {
        const localData = {
          players: legacyPlayers ? JSON.parse(legacyPlayers) : [],
          matches: legacyMatches ? JSON.parse(legacyMatches) : [],
          timestamp: new Date().toISOString()
        };

        this.downloadJson('localStorage-backup.json', localData);
        backups.localStorage = localData;
      }

      // Backup Vercel Blob if available
      try {
        await this.jsonService.checkApiAvailability();
        const blobData = await this.jsonService.loadAll();
        blobData.timestamp = new Date().toISOString();

        this.downloadJson('vercel-blob-backup.json', blobData);
        backups.vercelBlob = blobData;

      } catch (error) {
        console.warn('Could not backup Vercel Blob data:', error.message);
      }

      console.log('✅ Backup completed');
      return {
        success: true,
        message: 'Backup files downloaded successfully',
        backups
      };

    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  /**
   * Download data as JSON file
   * @param {string} filename - Name of the file
   * @param {Object} data - Data to download
   */
  downloadJson(filename, data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get sync status and recommendations
   * @returns {Promise<Object>} Status and recommendations
   */
  async getSyncStatus() {
    try {
      const state = await this.checkDataState();
      
      return {
        isInSync: state.conflicts.length === 0,
        conflicts: state.conflicts,
        recommendations: state.recommendations,
        state
      };

    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        isInSync: false,
        conflicts: [{ type: 'error', message: error.message }],
        recommendations: [{ 
          action: 'check_setup', 
          message: 'Check system setup and try again',
          priority: 'critical'
        }],
        state: null
      };
    }
  }
}

export default SyncService; 