import { Player } from '@/entities/Player.js';
import { Match } from '@/entities/Match.js';
import { League } from '@/entities/League.js';
import { CsvService } from '@/services/CsvService.js';

export class MigrationService {
  /**
   * Check if old localStorage data exists
   */
  static hasLegacyData() {
    const legacyPlayers = localStorage.getItem('fifa-players');
    const legacyMatches = localStorage.getItem('fifa-matches');
    
    return !!(legacyPlayers || legacyMatches);
  }

  /**
   * Check if new CSV data already exists
   */
  static async hasNewData() {
    try {
      const [players, matches, leagues] = await Promise.all([
        Player.list(),
        Match.list(),
        League.list()
      ]);
      
      return players.length > 0 || matches.length > 0 || leagues.length > 0;
    } catch (error) {
      console.error('Error checking for new data:', error);
      return false;
    }
  }

  /**
   * Migrate players from localStorage to CSV
   */
  static async migratePlayers() {
    try {
      const legacyPlayersJson = localStorage.getItem('fifa-players');
      if (!legacyPlayersJson) {
        return { migrated: 0, skipped: 0 };
      }

      const legacyPlayers = JSON.parse(legacyPlayersJson);
      const existingPlayers = await Player.list();
      const existingNames = new Set(existingPlayers.map(p => p.name.toLowerCase()));

      let migrated = 0;
      let skipped = 0;

      for (const legacyPlayer of legacyPlayers) {
        if (existingNames.has(legacyPlayer.name.toLowerCase())) {
          skipped++;
          continue;
        }

        await Player.create({
          name: legacyPlayer.name,
          created_date: legacyPlayer.created_at || new Date().toISOString()
        });
        
        migrated++;
      }

      return { migrated, skipped, total: legacyPlayers.length };
    } catch (error) {
      console.error('Error migrating players:', error);
      throw new Error('Failed to migrate players');
    }
  }

  /**
   * Migrate matches from localStorage to CSV
   */
  static async migrateMatches(targetLeagueId = null) {
    try {
      const legacyMatchesJson = localStorage.getItem('fifa-matches');
      if (!legacyMatchesJson) {
        return { migrated: 0, skipped: 0 };
      }

      const legacyMatches = JSON.parse(legacyMatchesJson);
      
      // Get or create target league
      let leagueId = targetLeagueId;
      if (!leagueId) {
        const activeLeague = await League.getActive();
        if (!activeLeague) {
          const defaultLeague = await League.create({
            name: 'Migrated Data League',
            description: 'League created during data migration from localStorage',
            is_active: true
          });
          leagueId = defaultLeague.id;
        } else {
          leagueId = activeLeague.id;
        }
      }

      const existingMatches = await Match.list();
      const existingIds = new Set(existingMatches.map(m => m.id));

      let migrated = 0;
      let skipped = 0;

      for (const legacyMatch of legacyMatches) {
        if (existingIds.has(legacyMatch.id)) {
          skipped++;
          continue;
        }

        // Convert legacy match format to new format
        const matchData = {
          id: legacyMatch.id,
          league_id: leagueId,
          team1_player1: legacyMatch.team1_player1,
          team1_player2: legacyMatch.team1_player2,
          team2_player1: legacyMatch.team2_player1,
          team2_player2: legacyMatch.team2_player2,
          team1_score: parseInt(legacyMatch.team1_score) || 0,
          team2_score: parseInt(legacyMatch.team2_score) || 0,
          match_date: legacyMatch.match_date || new Date().toISOString().split('T')[0],
          created_date: legacyMatch.created_date || legacyMatch.created_at || new Date().toISOString()
        };

        // Add directly to avoid triggering league checks
        const allMatches = await Match.list();
        allMatches.push(matchData);
        await CsvService.writeCsv(Match.CSV_FILENAME, allMatches, Match.CSV_HEADERS);
        
        migrated++;
      }

      return { migrated, skipped, total: legacyMatches.length, leagueId };
    } catch (error) {
      console.error('Error migrating matches:', error);
      throw new Error('Failed to migrate matches');
    }
  }

  /**
   * Full migration process
   */
  static async migrateAll() {
    try {
      const hasLegacy = this.hasLegacyData();
      if (!hasLegacy) {
        return {
          success: false,
          message: 'No legacy data found to migrate',
          players: { migrated: 0, skipped: 0 },
          matches: { migrated: 0, skipped: 0 }
        };
      }

      // Migrate players first
      const playerResult = await this.migratePlayers();

      // Migrate matches
      const matchResult = await this.migrateMatches();

      // Create backup of original data
      this.createLegacyBackup();

      return {
        success: true,
        message: 'Migration completed successfully',
        players: playerResult,
        matches: matchResult,
        leagueId: matchResult.leagueId
      };
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }

  /**
   * Create a backup of legacy data before migration
   */
  static createLegacyBackup() {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      const legacyPlayers = localStorage.getItem('fifa-players');
      const legacyMatches = localStorage.getItem('fifa-matches');

      if (legacyPlayers) {
        localStorage.setItem(`fifa-legacy-backup-players-${timestamp}`, legacyPlayers);
      }

      if (legacyMatches) {
        localStorage.setItem(`fifa-legacy-backup-matches-${timestamp}`, legacyMatches);
      }

      console.log('Legacy data backup created with timestamp:', timestamp);
    } catch (error) {
      console.warn('Could not create legacy backup:', error);
    }
  }

  /**
   * Clear legacy data after successful migration
   */
  static clearLegacyData() {
    try {
      localStorage.removeItem('fifa-players');
      localStorage.removeItem('fifa-matches');
      console.log('Legacy data cleared');
    } catch (error) {
      console.warn('Could not clear legacy data:', error);
    }
  }

  /**
   * Restore legacy data from backup
   */
  static restoreLegacyBackup(timestamp) {
    try {
      const backupPlayers = localStorage.getItem(`fifa-legacy-backup-players-${timestamp}`);
      const backupMatches = localStorage.getItem(`fifa-legacy-backup-matches-${timestamp}`);

      if (backupPlayers) {
        localStorage.setItem('fifa-players', backupPlayers);
      }

      if (backupMatches) {
        localStorage.setItem('fifa-matches', backupMatches);
      }

      return true;
    } catch (error) {
      console.error('Error restoring legacy backup:', error);
      return false;
    }
  }

  /**
   * Get list of available legacy backups
   */
  static getLegacyBackups() {
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys.filter(key => key.startsWith('fifa-legacy-backup-'));
    
    const backups = {};
    backupKeys.forEach(key => {
      const parts = key.split('-');
      const timestamp = parts[parts.length - 1];
      const type = parts[parts.length - 2]; // 'players' or 'matches'
      
      if (!backups[timestamp]) {
        backups[timestamp] = { timestamp, players: false, matches: false };
      }
      backups[timestamp][type] = true;
    });

    return Object.values(backups).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Export all data as CSV files
   */
  static async exportAllData() {
    try {
      const [players, matches, leagues] = await Promise.all([
        Player.list(),
        Match.list(),
        League.list()
      ]);

      // Export each data type
      CsvService.downloadCsv('fifa_players_export.csv', players, Player.CSV_HEADERS);
      CsvService.downloadCsv('fifa_matches_export.csv', matches, Match.CSV_HEADERS);
      CsvService.downloadCsv('fifa_leagues_export.csv', leagues, League.CSV_HEADERS);

      return {
        success: true,
        files: ['fifa_players_export.csv', 'fifa_matches_export.csv', 'fifa_leagues_export.csv']
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Import data from uploaded CSV files
   */
  static async importData(files) {
    try {
      const results = {
        players: { imported: 0, skipped: 0 },
        matches: { imported: 0, skipped: 0 },
        leagues: { imported: 0, skipped: 0 }
      };

      for (const file of files) {
        const fileName = file.name.toLowerCase();
        
        if (fileName.includes('player')) {
          results.players = await Player.importFromCsv(file);
        } else if (fileName.includes('match')) {
          results.matches = await Match.importFromCsv(file);
        } else if (fileName.includes('league')) {
          const leagues = await CsvService.importCsv(file, League.CSV_HEADERS);
          // Import leagues manually to handle activation properly
          let imported = 0, skipped = 0;
          for (const league of leagues) {
            try {
              await League.create(league);
              imported++;
            } catch (error) {
              console.warn('Skipped league:', league.name, error.message);
              skipped++;
            }
          }
          results.leagues = { imported, skipped };
        }
      }

      return results;
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }
} 