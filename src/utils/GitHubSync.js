import { GitHubService } from '@/services/GitHubService.js';
import { Player } from '@/entities/Player.js';
import { Match } from '@/entities/Match.js';
import { League } from '@/entities/League.js';

export class GitHubSync {
  /**
   * Sync all localStorage data to GitHub
   */
  static async syncToGitHub() {
    if (!GitHubService.isConfigured()) {
      throw new Error('GitHub is not configured. Please set up your GitHub repository first.');
    }

    try {
      const results = {
        players: { success: false, error: null },
        matches: { success: false, error: null },
        leagues: { success: false, error: null }
      };

      // Get data from localStorage via entities
      const players = await Player.list();
      const matches = await Match.list();
      const leagues = await League.list();

      // Sync players
      try {
        if (players.length > 0) {
          const playersCsv = GitHubService.arrayToCsv(players, Player.CSV_HEADERS);
          await GitHubService.saveFile('players.csv', playersCsv, 'Sync players data from localStorage');
          results.players.success = true;
        }
      } catch (error) {
        results.players.error = error.message;
      }

      // Sync matches
      try {
        if (matches.length > 0) {
          const matchesCsv = GitHubService.arrayToCsv(matches, Match.CSV_HEADERS);
          await GitHubService.saveFile('matches.csv', matchesCsv, 'Sync matches data from localStorage');
          results.matches.success = true;
        }
      } catch (error) {
        results.matches.error = error.message;
      }

      // Sync leagues
      try {
        if (leagues.length > 0) {
          const leaguesCsv = GitHubService.arrayToCsv(leagues, League.CSV_HEADERS);
          await GitHubService.saveFile('leagues.csv', leaguesCsv, 'Sync leagues data from localStorage');
          results.leagues.success = true;
        }
      } catch (error) {
        results.leagues.error = error.message;
      }

      return results;
    } catch (error) {
      console.error('Error syncing to GitHub:', error);
      throw error;
    }
  }

  /**
   * Load all data from GitHub and update localStorage
   */
  static async syncFromGitHub() {
    if (!GitHubService.isConfigured()) {
      throw new Error('GitHub is not configured. Please set up your GitHub repository first.');
    }

    try {
      const results = {
        players: { success: false, error: null, count: 0 },
        matches: { success: false, error: null, count: 0 },
        leagues: { success: false, error: null, count: 0 }
      };

      // Load players from GitHub
      try {
        const playersFile = await GitHubService.getFile('players.csv');
        if (playersFile.content) {
          const players = GitHubService.csvToArray(playersFile.content, Player.CSV_HEADERS);
          
          // Clear existing localStorage and save new data
          localStorage.removeItem('fifa-csv-players.csv');
          if (players.length > 0) {
            for (const player of players) {
              await Player.create(player);
            }
          }
          
          results.players.success = true;
          results.players.count = players.length;
        }
      } catch (error) {
        results.players.error = error.message;
      }

      // Load matches from GitHub
      try {
        const matchesFile = await GitHubService.getFile('matches.csv');
        if (matchesFile.content) {
          const matches = GitHubService.csvToArray(matchesFile.content, Match.CSV_HEADERS);
          
          // Clear existing localStorage and save new data
          localStorage.removeItem('fifa-csv-matches.csv');
          if (matches.length > 0) {
            for (const match of matches) {
              await Match.create(match);
            }
          }
          
          results.matches.success = true;
          results.matches.count = matches.length;
        }
      } catch (error) {
        results.matches.error = error.message;
      }

      // Load leagues from GitHub
      try {
        const leaguesFile = await GitHubService.getFile('leagues.csv');
        if (leaguesFile.content) {
          const leagues = GitHubService.csvToArray(leaguesFile.content, League.CSV_HEADERS);
          
          // Clear existing localStorage and save new data
          localStorage.removeItem('fifa-csv-leagues.csv');
          if (leagues.length > 0) {
            for (const league of leagues) {
              await League.create(league);
            }
          }
          
          results.leagues.success = true;
          results.leagues.count = leagues.length;
        }
      } catch (error) {
        results.leagues.error = error.message;
      }

      return results;
    } catch (error) {
      console.error('Error syncing from GitHub:', error);
      throw error;
    }
  }

  /**
   * Get sync status comparing localStorage vs GitHub
   */
  static async getSyncStatus() {
    if (!GitHubService.isConfigured()) {
      return {
        configured: false,
        error: 'GitHub is not configured'
      };
    }

    try {
      const status = {
        configured: true,
        players: { local: 0, github: 0, synced: false },
        matches: { local: 0, github: 0, synced: false },
        leagues: { local: 0, github: 0, synced: false },
        lastSync: null
      };

      // Get local counts
      const localPlayers = await Player.list();
      const localMatches = await Match.list();
      const localLeagues = await League.list();

      status.players.local = localPlayers.length;
      status.matches.local = localMatches.length;
      status.leagues.local = localLeagues.length;

      // Get GitHub counts
      try {
        const playersFile = await GitHubService.getFile('players.csv');
        if (playersFile.content) {
          const githubPlayers = GitHubService.csvToArray(playersFile.content, Player.CSV_HEADERS);
          status.players.github = githubPlayers.length;
        }
      } catch (error) {
        // File doesn't exist, that's ok
      }

      try {
        const matchesFile = await GitHubService.getFile('matches.csv');
        if (matchesFile.content) {
          const githubMatches = GitHubService.csvToArray(matchesFile.content, Match.CSV_HEADERS);
          status.matches.github = githubMatches.length;
        }
      } catch (error) {
        // File doesn't exist, that's ok
      }

      try {
        const leaguesFile = await GitHubService.getFile('leagues.csv');
        if (leaguesFile.content) {
          const githubLeagues = GitHubService.csvToArray(leaguesFile.content, League.CSV_HEADERS);
          status.leagues.github = githubLeagues.length;
        }
      } catch (error) {
        // File doesn't exist, that's ok
      }

      // Check if synced (counts match)
      status.players.synced = status.players.local === status.players.github;
      status.matches.synced = status.matches.local === status.matches.github;
      status.leagues.synced = status.leagues.local === status.leagues.github;

      // Get last sync time from localStorage
      const lastSync = localStorage.getItem('fifa-github-last-sync');
      if (lastSync) {
        status.lastSync = new Date(lastSync);
      }

      return status;
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        configured: true,
        error: error.message
      };
    }
  }

  /**
   * Record successful sync timestamp
   */
  static recordSyncTime() {
    localStorage.setItem('fifa-github-last-sync', new Date().toISOString());
  }

  /**
   * Auto-sync data when performing operations (if configured)
   */
  static async autoSync() {
    if (!GitHubService.isConfigured()) {
      return false;
    }

    try {
      // Only auto-sync if we haven't synced in the last 5 minutes
      const lastSync = localStorage.getItem('fifa-github-last-sync');
      if (lastSync) {
        const lastSyncTime = new Date(lastSync);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (lastSyncTime > fiveMinutesAgo) {
          return false; // Too recent, skip auto-sync
        }
      }

      await this.syncToGitHub();
      this.recordSyncTime();
      return true;
    } catch (error) {
      console.warn('Auto-sync failed:', error.message);
      return false;
    }
  }
} 