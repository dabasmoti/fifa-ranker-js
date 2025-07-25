import React, { useState, useEffect } from "react";

export default function SimpleGitHubSettings() {
  console.log('Simple GitHub Settings component is rendering');
  
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [status, setStatus] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // Load saved configuration on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('github-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setToken(config.token || '');
        setOwner(config.owner || '');
        setRepo(config.repo || '');
        setIsConfigured(true);
        setStatus('✅ Configuration loaded from storage');
      } catch (error) {
        setStatus('⚠️ Error loading saved configuration');
      }
    }
  }, []);

  const testGitHubConnection = async () => {
    if (!token || !owner || !repo) {
      setStatus('❌ Please fill in all fields');
      return;
    }
    
    setStatus('🔄 Testing connection...');
    
    try {
      // Test GitHub API connection
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.status === 404) {
        // Repository doesn't exist - that's okay, we can create it
        setStatus('✅ Connection successful! Repository will be created when needed.');
      } else if (response.status === 200) {
        // Repository exists and we have access
        setStatus('✅ Connection successful! Repository exists and accessible.');
      } else if (response.status === 401) {
        setStatus('❌ Authentication failed. Check your token.');
      } else if (response.status === 403) {
        setStatus('❌ Access denied. Make sure your token has "repo" permissions.');
      } else {
        setStatus(`❌ Connection failed with status: ${response.status}`);
      }
    } catch (error) {
      setStatus('❌ Network error. Check your internet connection.');
      console.error('GitHub connection test failed:', error);
    }
  };

  const saveConfiguration = () => {
    if (!token || !owner || !repo) {
      setStatus('❌ Please fill in all fields');
      return;
    }
    
    try {
      // Save to localStorage
      const config = { token, owner, repo };
      localStorage.setItem('github-config', JSON.stringify(config));
      setIsConfigured(true);
      setStatus('✅ Configuration saved successfully!');
    } catch (error) {
      setStatus('❌ Error saving configuration');
      console.error('Save error:', error);
    }
  };

  const initializeRepository = async () => {
    if (!isConfigured) {
      setStatus('❌ Please save configuration first');
      return;
    }

    setStatus('🔄 Setting up data structure...');

    try {
      // Check if repository exists and is accessible
      const checkResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (checkResponse.status === 404) {
        throw new Error('Repository not found. Please create the repository first or check the repository name.');
      } else if (checkResponse.status === 401) {
        throw new Error('Authentication failed. Check your token.');
      } else if (checkResponse.status === 403) {
        throw new Error('Access denied. Make sure your token has "repo" permissions.');
      } else if (!checkResponse.ok) {
        throw new Error(`Failed to access repository: ${checkResponse.status}`);
      }

      // Create data folder structure with placeholder files
      const files = [
        { path: 'data/players.csv', content: 'id,name,created_date\n' },
        { path: 'data/matches.csv', content: 'id,league_id,team1_player1,team1_player2,team2_player1,team2_player2,team1_score,team2_score,match_date,created_date\n' },
        { path: 'data/leagues.csv', content: 'id,name,description,start_date,end_date,is_active,created_date\n' },
        { path: 'README.md', content: '# FIFA Ranker Data\n\nThis repository stores FIFA tournament data.\nGenerated by FIFA Ranker application.\n' }
      ];

      for (const file of files) {
        await createOrUpdateFile(file.path, file.content, `Initialize ${file.path}`);
      }

      setStatus('✅ Data structure set up successfully! FIFA Ranker is ready to sync with your repository.');
    } catch (error) {
      setStatus(`❌ Error initializing repository: ${error.message}`);
      console.error('Repository initialization failed:', error);
    }
  };

  const createOrUpdateFile = async (path, content, message) => {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    try {
      // Try to get existing file to get SHA
      const getResponse = await fetch(url, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let sha;
      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }

      // Create or update file
      const putData = {
        message,
        content: btoa(content), // Base64 encode
      };

      if (sha) {
        putData.sha = sha;
      }

      const putResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putData)
      });

      if (!putResponse.ok) {
        let errorMessage = `Failed to create/update ${path}: ${putResponse.status}`;
        
        if (putResponse.status === 403) {
          errorMessage += ' - Permission denied. Please check:\n' +
            '• Your token has "repo" scope/permissions\n' +
            '• You have write access to this repository\n' +
            '• The repository is not archived or read-only';
        } else if (putResponse.status === 401) {
          errorMessage += ' - Authentication failed. Check your token.';
        } else if (putResponse.status === 404) {
          errorMessage += ' - Repository not found or not accessible.';
        } else if (putResponse.status === 422) {
          errorMessage += ' - Invalid request. The file content might be invalid.';
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(`Error with file ${path}:`, error);
      throw error;
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">GitHub Settings</h1>
      <p className="text-gray-600 mb-8">Configure cloud storage for your FIFA data</p>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Repository Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this from GitHub → Settings → Developer settings → Personal access tokens
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repository Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="your-username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repository Name
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="fifa-ranker-data"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4 flex-wrap">
            <button
              onClick={testGitHubConnection}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Test Connection
            </button>
            <button
              onClick={saveConfiguration}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Save Configuration
            </button>
            {isConfigured && (
              <button
                onClick={initializeRepository}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Setup Data Structure
              </button>
            )}
          </div>

          {status && (
            <div className={`p-3 rounded-md ${
              status.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : status.includes('❌')
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              {status}
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
          <ol className="text-blue-800 space-y-1 text-sm">
            <li>1. Go to GitHub.com → Settings → Developer settings → Personal access tokens</li>
            <li>2. Create a new token with <strong>'repo'</strong> permissions (full control of repositories)</li>
            <li>3. Make sure you have <strong>write access</strong> to the repository</li>
            <li>4. Enter your GitHub username as the owner</li>
            <li>5. Enter the name of your existing repository</li>
            <li>6. Test connection, save configuration, then setup data structure!</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ Common 403 Error Causes:</strong><br/>
              • Token missing 'repo' scope - recreate with full repository permissions<br/>
              • You don't own the repository or lack write access<br/>
              • Repository is archived, private, or organization-owned with restrictions
            </p>
          </div>
        </div>

        {isConfigured && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">✅ Configuration Complete!</h3>
            <p className="text-green-800 text-sm">
              Your GitHub storage is configured. You can now setup the data structure 
              and start using cloud-based data persistence for your FIFA matches!
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 