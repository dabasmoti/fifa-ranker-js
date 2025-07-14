export class Match {
  constructor(id, team1, team2, score) {
    this.id = id;
    this.team1 = team1;
    this.team2 = team2;
    this.score = score;
  }

  static async list(sort = '-created_date', limit = null) {
    try {
      let matches = JSON.parse(localStorage.getItem('fifa-matches') || '[]');
      
      // Sort matches by created_date (newest first by default)
      if (sort === '-created_date') {
        matches.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      }
      
      // Apply limit if specified
      if (limit && typeof limit === 'number') {
        matches = matches.slice(0, limit);
      }
      
      return matches;
    } catch (error) {
      console.error('Error loading matches:', error);
      return [];
    }
  }

  static async create(data) {
    try {
      const matches = await this.list();
      const newMatch = {
        id: Date.now().toString(),
        team1_player1: data.team1_player1,
        team1_player2: data.team1_player2,
        team2_player1: data.team2_player1,
        team2_player2: data.team2_player2,
        team1_score: data.team1_score,
        team2_score: data.team2_score,
        match_date: data.match_date || new Date().toISOString().split('T')[0],
        created_date: new Date().toISOString()
      };
      matches.push(newMatch);
      localStorage.setItem('fifa-matches', JSON.stringify(matches));
      return newMatch;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const matches = await this.list();
      const matchIndex = matches.findIndex(match => match.id === id);
      
      if (matchIndex === -1) {
        throw new Error('Match not found');
      }

      const updatedMatch = {
        ...matches[matchIndex],
        team1_player1: data.team1_player1,
        team1_player2: data.team1_player2,
        team2_player1: data.team2_player1,
        team2_player2: data.team2_player2,
        team1_score: data.team1_score,
        team2_score: data.team2_score,
        match_date: data.match_date,
        updated_date: new Date().toISOString()
      };

      matches[matchIndex] = updatedMatch;
      localStorage.setItem('fifa-matches', JSON.stringify(matches));
      return updatedMatch;
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const matches = await this.list();
      const filteredMatches = matches.filter(match => match.id !== id);
      
      if (filteredMatches.length === matches.length) {
        throw new Error('Match not found');
      }

      localStorage.setItem('fifa-matches', JSON.stringify(filteredMatches));
      return true;
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const matches = await this.list();
      return matches.find(match => match.id === id) || null;
    } catch (error) {
      console.error('Error finding match:', error);
      return null;
    }
  }
} 