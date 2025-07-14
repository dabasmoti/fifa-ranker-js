export class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  static async list() {
    try {
      const players = JSON.parse(localStorage.getItem('fifa-players') || '[]');
      return players;
    } catch (error) {
      console.error('Error loading players:', error);
      return [];
    }
  }

  static async create(data) {
    try {
      const players = await this.list();
      const newPlayer = {
        id: Date.now().toString(),
        name: data.name,
        created_at: new Date().toISOString()
      };
      players.push(newPlayer);
      localStorage.setItem('fifa-players', JSON.stringify(players));
      return newPlayer;
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const players = await this.list();
      const filteredPlayers = players.filter(player => player.id !== id);
      localStorage.setItem('fifa-players', JSON.stringify(filteredPlayers));
      return true;
    } catch (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  }
} 