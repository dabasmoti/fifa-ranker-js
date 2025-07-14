export class GitHubService {
  static GITHUB_API_BASE = 'https://api.github.com';
  static DEFAULT_BRANCH = 'main';
  static DATA_PATH = 'data';

  /**
   * Get GitHub configuration from localStorage
   */
  static getConfig() {
    const config = localStorage.getItem('fifa-github-config');
    return config ? JSON.parse(config) : null;
  }

  /**
   * Save GitHub configuration to localStorage
   */
  static setConfig(config) {
    localStorage.setItem('fifa-github-config', JSON.stringify(config));
  }

  /**
   * Check if GitHub is configured
   */
  static isConfigured() {
    const config = this.getConfig();
    return config && config.token && config.owner && config.repo;
  }

  /**
   * Make authenticated GitHub API request
   */
  static async makeRequest(url, options = {}) {
    const config = this.getConfig();
    if (!config || !config.token) {
      throw new Error('GitHub not configured. Please set up your GitHub token and repository.');
    }

    const headers = {
      'Authorization': `token ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`GitHub API error: ${error.message}`);
    }

    return response;
  }

  /**
   * Get file content from GitHub repository
   */
  static async getFile(filename) {
    try {
      const config = this.getConfig();
      const path = `${this.DATA_PATH}/${filename}`;
      const url = `${this.GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
      
      const response = await this.makeRequest(url);
      const data = await response.json();
      
      // Decode base64 content
      const content = atob(data.content.replace(/\n/g, ''));
      return {
        content,
        sha: data.sha
      };
    } catch (error) {
      if (error.message.includes('404')) {
        // File doesn't exist, return empty content
        return { content: '', sha: null };
      }
      throw error;
    }
  }

  /**
   * Create or update file in GitHub repository
   */
  static async saveFile(filename, content, commitMessage = null) {
    try {
      const config = this.getConfig();
      const path = `${this.DATA_PATH}/${filename}`;
      const url = `${this.GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
      
      // Get existing file SHA if it exists
      let sha = null;
      try {
        const existing = await this.getFile(filename);
        sha = existing.sha;
      } catch (error) {
        // File doesn't exist, that's fine
      }

      const message = commitMessage || `Update ${filename} - FIFA Ranker data`;
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      const body = {
        message,
        content: encodedContent,
        branch: this.DEFAULT_BRANCH
      };

      if (sha) {
        body.sha = sha;
      }

      const response = await this.makeRequest(url, {
        method: 'PUT',
        body: JSON.stringify(body)
      });

      return await response.json();
    } catch (error) {
      console.error('Error saving file to GitHub:', error);
      throw error;
    }
  }

  /**
   * Initialize repository with data folder structure
   */
  static async initializeRepository() {
    try {
      const config = this.getConfig();
      
      // Create a README file in the data directory to ensure it exists
      const readmeContent = `# FIFA Ranker Data

This directory contains CSV data files for the FIFA Ranker application.

## Files:
- \`players.csv\` - Player information
- \`matches.csv\` - Match results
- \`leagues.csv\` - League/season information

## Usage:
This data is automatically managed by the FIFA Ranker web application.
You can import/export this data through the application interface.

Generated: ${new Date().toISOString()}
`;

      await this.saveFile('README.md', readmeContent, 'Initialize FIFA Ranker data directory');
      return true;
    } catch (error) {
      console.error('Error initializing repository:', error);
      throw error;
    }
  }

  /**
   * Test GitHub connection and permissions
   */
  static async testConnection() {
    try {
      const config = this.getConfig();
      if (!config || !config.token || !config.owner || !config.repo) {
        throw new Error('GitHub configuration is incomplete');
      }

      // Test repository access
      const url = `${this.GITHUB_API_BASE}/repos/${config.owner}/${config.repo}`;
      const response = await this.makeRequest(url);
      const repoData = await response.json();

      // Check if we have write permissions
      if (!repoData.permissions || !repoData.permissions.push) {
        throw new Error('No write permissions to repository. Please check your token permissions.');
      }

      return {
        success: true,
        repository: repoData.full_name,
        permissions: repoData.permissions
      };
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get repository information
   */
  static async getRepositoryInfo() {
    try {
      const config = this.getConfig();
      const url = `${this.GITHUB_API_BASE}/repos/${config.owner}/${config.repo}`;
      const response = await this.makeRequest(url);
      return await response.json();
    } catch (error) {
      console.error('Error getting repository info:', error);
      throw error;
    }
  }

  /**
   * List all data files in the repository
   */
  static async listDataFiles() {
    try {
      const config = this.getConfig();
      const url = `${this.GITHUB_API_BASE}/repos/${config.owner}/${config.repo}/contents/${this.DATA_PATH}`;
      
      const response = await this.makeRequest(url);
      const files = await response.json();
      
      return files.filter(file => 
        file.type === 'file' && 
        (file.name.endsWith('.csv') || file.name === 'README.md')
      );
    } catch (error) {
      if (error.message.includes('404')) {
        // Data directory doesn't exist
        return [];
      }
      throw error;
    }
  }

  /**
   * Sync all data to GitHub
   */
  static async syncAllData(players, matches, leagues) {
    try {
      const results = [];

      // Save players
      if (players && players.length > 0) {
        const playersCsv = this.arrayToCsv(players, ['id', 'name', 'created_date']);
        await this.saveFile('players.csv', playersCsv, 'Update players data');
        results.push('players.csv');
      }

      // Save matches
      if (matches && matches.length > 0) {
        const matchesCsv = this.arrayToCsv(matches, [
          'id', 'team1_player1', 'team1_player2', 'team2_player1', 'team2_player2',
          'team1_score', 'team2_score', 'match_date', 'league_id', 'created_date'
        ]);
        await this.saveFile('matches.csv', matchesCsv, 'Update matches data');
        results.push('matches.csv');
      }

      // Save leagues
      if (leagues && leagues.length > 0) {
        const leaguesCsv = this.arrayToCsv(leagues, [
          'id', 'name', 'description', 'start_date', 'end_date', 'is_active', 'created_date'
        ]);
        await this.saveFile('leagues.csv', leaguesCsv, 'Update leagues data');
        results.push('leagues.csv');
      }

      return results;
    } catch (error) {
      console.error('Error syncing data to GitHub:', error);
      throw error;
    }
  }

  /**
   * Load all data from GitHub
   */
  static async loadAllData() {
    try {
      const data = {};

      // Load players
      try {
        const playersFile = await this.getFile('players.csv');
        if (playersFile.content) {
          data.players = this.csvToArray(playersFile.content, ['id', 'name', 'created_date']);
        } else {
          data.players = [];
        }
      } catch (error) {
        console.warn('Could not load players.csv:', error.message);
        data.players = [];
      }

      // Load matches
      try {
        const matchesFile = await this.getFile('matches.csv');
        if (matchesFile.content) {
          data.matches = this.csvToArray(matchesFile.content, [
            'id', 'team1_player1', 'team1_player2', 'team2_player1', 'team2_player2',
            'team1_score', 'team2_score', 'match_date', 'league_id', 'created_date'
          ]);
        } else {
          data.matches = [];
        }
      } catch (error) {
        console.warn('Could not load matches.csv:', error.message);
        data.matches = [];
      }

      // Load leagues
      try {
        const leaguesFile = await this.getFile('leagues.csv');
        if (leaguesFile.content) {
          data.leagues = this.csvToArray(leaguesFile.content, [
            'id', 'name', 'description', 'start_date', 'end_date', 'is_active', 'created_date'
          ]);
        } else {
          data.leagues = [];
        }
      } catch (error) {
        console.warn('Could not load leagues.csv:', error.message);
        data.leagues = [];
      }

      return data;
    } catch (error) {
      console.error('Error loading data from GitHub:', error);
      throw error;
    }
  }

  /**
   * Convert array of objects to CSV string
   */
  static arrayToCsv(array, headers) {
    if (!array || array.length === 0) return '';
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const obj of array) {
      const row = headers.map(header => {
        const value = obj[header] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
  }

  /**
   * Convert CSV string to array of objects
   */
  static csvToArray(csvString, headers) {
    if (!csvString || !csvString.trim()) return [];
    
    const lines = csvString.trim().split('\n');
    if (lines.length <= 1) return [];
    
    // Skip header line
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
   * Parse a single CSV line handling quotes and commas
   */
  static parseCsvLine(line) {
    const values = [];
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
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    values.push(current);
    
    return values;
  }
} 