import DatabaseService from '@/services/DatabaseService.js';

export class Player {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.created_date = data.created_date;
  }

  static async list() {
    try {
      const dbService = new DatabaseService();
      const players = await dbService.getPlayers();
      return players;
    } catch (error) {
      console.error('Error loading players:', error);
      throw new Error('Failed to load players. Please ensure database connection is available.');
    }
  }

  static async create(data) {
    try {
      const dbService = new DatabaseService();
      const newPlayer = await dbService.createPlayer(data.name.trim());
      return newPlayer;
    } catch (error) {
      console.error('Error creating player:', error);
      
      // Handle duplicate name error
      if (error.message.includes('duplicate key value') || error.message.includes('already exists')) {
        throw new Error('A player with this name already exists');
      }
      
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const dbService = new DatabaseService();
      const updatedPlayer = await dbService.updatePlayer(id, data.name.trim());
      
      if (!updatedPlayer) {
        throw new Error('Player not found');
      }
      
      return updatedPlayer;
    } catch (error) {
      console.error('Error updating player:', error);
      
      // Handle duplicate name error
      if (error.message.includes('duplicate key value') || error.message.includes('already exists')) {
        throw new Error('A player with this name already exists');
      }
      
      throw error;
    }
  }

  static async delete(id) {
    try {
      const dbService = new DatabaseService();
      await dbService.deletePlayer(id);
      return true;
    } catch (error) {
      console.error('Error deleting player:', error);
      
      // Handle foreign key constraint errors
      if (error.message.includes('foreign key constraint') || error.message.includes('referenced by other data')) {
        throw new Error('Cannot delete this player as they are referenced in match records');
      }
      
      throw error;
    }
  }

  static async findById(id) {
    try {
      const players = await this.list();
      return players.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error finding player:', error);
      throw error;
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
   * Get player statistics for a specific season
   */
  static async getPlayerStats(playerName, seasonId = null) {
    try {
      const { Match } = await import('@/entities/Match.js');
      const matches = seasonId ? 
        await Match.getBySeason(seasonId) : 
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
   * Calculate wins needed to reach first place and losses to drop to last place
   * Accounts for games played - fewer games = more volatile position
   */
  static calculateRankingProjections(playersWithStats) {
    if (playersWithStats.length === 0) return playersWithStats;

    const firstPlacePoints = playersWithStats[0].total_points;
    const lastPlacePoints = playersWithStats[playersWithStats.length - 1].total_points;
    
    // Calculate average games played to understand activity levels
    const avgGamesPlayed = playersWithStats.reduce((sum, p) => sum + p.matches_played, 0) / playersWithStats.length;

    return playersWithStats.map((player, index) => {
      const currentRank = index + 1;
      const playerGames = player.matches_played;
      
      // Calculate wins needed to reach first place
      let winsToFirst = 0;
      if (currentRank > 1) {
        const pointsNeeded = firstPlacePoints - player.total_points + 1; // +1 to overtake
        let baseWinsNeeded = Math.ceil(pointsNeeded / 3);
        
        // Adjust based on games played relative to first place player
        const firstPlaceGames = playersWithStats[0].matches_played;
        const gamesDifference = firstPlaceGames - playerGames;
        
        // If player has played significantly fewer games, they have an advantage
        // Each additional game could be a win (3 points)
        if (gamesDifference > 0) {
          // Player has room to catch up with fewer wins due to having more potential games
          const potentialFromExtraGames = gamesDifference * 3;
          const adjustedPointsNeeded = Math.max(0, pointsNeeded - potentialFromExtraGames);
          baseWinsNeeded = Math.ceil(adjustedPointsNeeded / 3);
        }
        
        winsToFirst = Math.max(0, baseWinsNeeded);
      }
      
      // Calculate losses to drop to last place
      let lossesToLast = 0;
      if (currentRank < playersWithStats.length && playersWithStats.length > 1) {
        const pointsCanLose = player.total_points - lastPlacePoints;
        
        // Base calculation: how many losses before others could catch up
        let baseLossesToLast = pointsCanLose > 0 ? Math.max(1, Math.floor(pointsCanLose / 3) + 1) : 1;
        
        // Adjust based on volatility: fewer games = more volatile = easier to drop
        const gameVolatility = avgGamesPlayed / Math.max(playerGames, 1);
        if (gameVolatility > 1.5) {
          // Player has played significantly fewer games than average - more volatile
          baseLossesToLast = Math.max(1, Math.floor(baseLossesToLast * 0.7)); // Reduce by 30%
        } else if (gameVolatility < 0.7) {
          // Player has played significantly more games than average - more stable
          baseLossesToLast = Math.ceil(baseLossesToLast * 1.3); // Increase by 30%
        }
        
        lossesToLast = baseLossesToLast;
      }

      return {
        ...player,
        current_rank: currentRank,
        wins_to_first: winsToFirst,
        losses_to_last: lossesToLast,
        is_first_place: currentRank === 1,
        is_last_place: currentRank === playersWithStats.length,
        // Add volatility indicator for debugging
        position_volatility: avgGamesPlayed / Math.max(playerGames, 1)
      };
    });
  }

  /**
   * Get all players with their statistics for a season
   */
  static async getAllPlayersWithStats(seasonId = null) {
    try {
      const players = await this.list();
      const playersWithStats = await Promise.all(
        players.map(async (player) => {
          const stats = await this.getPlayerStats(player.name, seasonId);
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

      // Add ranking projections
      const playersWithProjections = this.calculateRankingProjections(playersWithStats);

      return playersWithProjections;
    } catch (error) {
      console.error('Error getting players with stats:', error);
      return [];
    }
  }

  /**
   * Force refresh player data from database (useful for debugging)
   */
  static async refreshData() {
    try {
      const dbService = new DatabaseService();
      const players = await dbService.getPlayers();
      console.log(`🔄 Refreshed player data: ${players.length} players loaded from database`);
      return players;
    } catch (error) {
      console.error('Error refreshing player data:', error);
      throw error;
    }
  }

  /**
   * Export players to JSON
   */
  static async exportToJson(filename = 'players.json') {
    try {
      const players = await this.list();
      const jsonString = JSON.stringify(players, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return filename;
    } catch (error) {
      console.error('Error exporting players:', error);
      throw error;
    }
  }

  /**
   * Get active players (players who have played in recent matches)
   */
  static async getActivePlayers(seasonId = null, daysSince = 30) {
    try {
      const { Match } = await import('@/entities/Match.js');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysSince);

      const matches = seasonId ? 
        await Match.getBySeason(seasonId) : 
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