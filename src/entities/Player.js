import { CsvService } from '@/services/CsvService.js';

export class Player {
  static CSV_FILENAME = 'players.csv';
  static CSV_HEADERS = ['id', 'name', 'created_date'];

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.created_date = data.created_date;
  }

  static async list() {
    try {
      const players = await CsvService.readCsv(this.CSV_FILENAME, this.CSV_HEADERS);
      return players;
    } catch (error) {
      console.error('Error loading players:', error);
      return [];
    }
  }

  static async create(data) {
    try {
      const players = await this.list();
      
      // Check for duplicate names
      const existingPlayer = players.find(p => 
        p.name.toLowerCase() === data.name.toLowerCase()
      );
      
      if (existingPlayer) {
        throw new Error('A player with this name already exists');
      }
      
      const newPlayer = {
        id: Date.now().toString(),
        name: data.name.trim(),
        created_date: new Date().toISOString()
      };
      
      players.push(newPlayer);
      await CsvService.writeCsv(this.CSV_FILENAME, players, this.CSV_HEADERS);
      
      return newPlayer;
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const players = await this.list();
      const playerIndex = players.findIndex(player => player.id === id);
      
      if (playerIndex === -1) {
        throw new Error('Player not found');
      }

      // Check for duplicate names (excluding current player)
      if (data.name) {
        const existingPlayer = players.find(p => 
          p.id !== id && p.name.toLowerCase() === data.name.toLowerCase()
        );
        
        if (existingPlayer) {
          throw new Error('A player with this name already exists');
        }
      }

      const updatedPlayer = {
        ...players[playerIndex],
        name: data.name ? data.name.trim() : players[playerIndex].name,
        updated_date: new Date().toISOString()
      };

      players[playerIndex] = updatedPlayer;
      await CsvService.writeCsv(this.CSV_FILENAME, players, this.CSV_HEADERS);
      
      return updatedPlayer;
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const players = await this.list();
      const playerToDelete = players.find(player => player.id === id);
      
      if (!playerToDelete) {
        throw new Error('Player not found');
      }

      // Check if player has matches before deleting
      const { Match } = await import('@/entities/Match.js');
      const matches = await Match.list();
      const playerMatches = matches.filter(match => 
        match.team1_player1 === playerToDelete.name ||
        match.team1_player2 === playerToDelete.name ||
        match.team2_player1 === playerToDelete.name ||
        match.team2_player2 === playerToDelete.name
      );

      if (playerMatches.length > 0) {
        throw new Error(`Cannot delete player "${playerToDelete.name}" - they have ${playerMatches.length} match(es) recorded. Please remove from all matches first.`);
      }
      
      const filteredPlayers = players.filter(player => player.id !== id);
      await CsvService.writeCsv(this.CSV_FILENAME, filteredPlayers, this.CSV_HEADERS);
      
      return true;
    } catch (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const players = await this.list();
      return players.find(player => player.id === id) || null;
    } catch (error) {
      console.error('Error finding player:', error);
      return null;
    }
  }

  static async findByName(name) {
    try {
      const players = await this.list();
      return players.find(player => 
        player.name.toLowerCase() === name.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Error finding player by name:', error);
      return null;
    }
  }

  /**
   * Get player statistics for a specific league
   */
  static async getPlayerStats(playerName, leagueId = null) {
    try {
      const { Match } = await import('@/entities/Match.js');
      const matches = leagueId ? 
        await Match.getByLeague(leagueId) : 
        await Match.list();

      const playerMatches = matches.filter(match => 
        match.team1_player1 === playerName ||
        match.team1_player2 === playerName ||
        match.team2_player1 === playerName ||
        match.team2_player2 === playerName
      );

      const stats = {
        matches_played: playerMatches.length,
        wins: 0,
        draws: 0,
        losses: 0,
        total_points: 0,
        max_possible_points: playerMatches.length * 3,
        success_percentage: 0,
        goals_for: 0,
        goals_against: 0
      };

      playerMatches.forEach(match => {
        const isTeam1 = match.team1_player1 === playerName || match.team1_player2 === playerName;
        const teamScore = isTeam1 ? match.team1_score : match.team2_score;
        const opponentScore = isTeam1 ? match.team2_score : match.team1_score;

        stats.goals_for += teamScore;
        stats.goals_against += opponentScore;

        if (teamScore > opponentScore) {
          stats.wins++;
          stats.total_points += 3;
        } else if (teamScore === opponentScore) {
          stats.draws++;
          stats.total_points += 1;
        } else {
          stats.losses++;
        }
      });

      stats.success_percentage = stats.max_possible_points > 0 ? 
        ((stats.total_points / stats.max_possible_points) * 100).toFixed(1) : 0;

      return stats;
    } catch (error) {
      console.error('Error calculating player stats:', error);
      return {
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        total_points: 0,
        max_possible_points: 0,
        success_percentage: 0,
        goals_for: 0,
        goals_against: 0
      };
    }
  }

  /**
   * Get all players with their statistics for a league
   */
  static async getAllPlayersWithStats(leagueId = null) {
    try {
      const players = await this.list();
      const playersWithStats = await Promise.all(
        players.map(async (player) => {
          const stats = await this.getPlayerStats(player.name, leagueId);
          return {
            ...player,
            ...stats
          };
        })
      );

      // Sort by success percentage (descending), then by total points
      playersWithStats.sort((a, b) => {
        if (b.success_percentage !== a.success_percentage) {
          return b.success_percentage - a.success_percentage;
        }
        return b.total_points - a.total_points;
      });

      return playersWithStats;
    } catch (error) {
      console.error('Error getting players with stats:', error);
      return [];
    }
  }

  /**
   * Export players to CSV
   */
  static async exportToCsv(filename = 'players.csv') {
    try {
      const players = await this.list();
      CsvService.downloadCsv(filename, players, this.CSV_HEADERS);
      return filename;
    } catch (error) {
      console.error('Error exporting players:', error);
      throw error;
    }
  }

  /**
   * Import players from CSV file
   */
  static async importFromCsv(file) {
    try {
      const importedPlayers = await CsvService.importCsv(file, this.CSV_HEADERS);
      const currentPlayers = await this.list();
      
      // Process imported players
      const processedPlayers = importedPlayers.map(player => ({
        ...player,
        id: player.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: player.name.trim(),
        created_date: player.created_date || new Date().toISOString()
      }));

      // Merge with existing players (avoid duplicates by name)
      const existingNames = new Set(currentPlayers.map(p => p.name.toLowerCase()));
      const newPlayers = processedPlayers.filter(p => !existingNames.has(p.name.toLowerCase()));
      
      const allPlayers = [...currentPlayers, ...newPlayers];
      await CsvService.writeCsv(this.CSV_FILENAME, allPlayers, this.CSV_HEADERS);
      
      return {
        imported: newPlayers.length,
        skipped: processedPlayers.length - newPlayers.length,
        total: allPlayers.length
      };
    } catch (error) {
      console.error('Error importing players:', error);
      throw error;
    }
  }

  /**
   * Get active players (players who have played in recent matches)
   */
  static async getActivePlayers(leagueId = null, daysSince = 30) {
    try {
      const { Match } = await import('@/entities/Match.js');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysSince);

      const matches = leagueId ? 
        await Match.getByLeague(leagueId) : 
        await Match.list();

      const recentMatches = matches.filter(match => 
        new Date(match.match_date) >= cutoffDate
      );

      const activePlayerNames = new Set();
      recentMatches.forEach(match => {
        activePlayerNames.add(match.team1_player1);
        activePlayerNames.add(match.team1_player2);
        activePlayerNames.add(match.team2_player1);
        activePlayerNames.add(match.team2_player2);
      });

      const allPlayers = await this.list();
      return allPlayers.filter(player => activePlayerNames.has(player.name));
    } catch (error) {
      console.error('Error getting active players:', error);
      return [];
    }
  }
} 