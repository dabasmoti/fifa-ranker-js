import React, { useState, useEffect } from "react";
import { GitHubService } from "@/services/GitHubService.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Github, 
  Save, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Key,
  GitBranch,
  Database,
  Upload,
  Download,
  Sync
} from "lucide-react";

export default function GitHubSettings() {
  const [config, setConfig] = useState({
    token: '',
    owner: '',
    repo: ''
  });
  
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [repositoryInfo, setRepositoryInfo] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const savedConfig = GitHubService.getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      setIsConfigured(GitHubService.isConfigured());
      if (GitHubService.isConfigured()) {
        loadRepositoryInfo();
      }
    }
  };

  const loadRepositoryInfo = async () => {
    try {
      const info = await GitHubService.getRepositoryInfo();
      setRepositoryInfo(info);
    } catch (error) {
      console.error('Error loading repository info:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!config.token || !config.owner || !config.repo) {
      setError('All fields are required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      GitHubService.setConfig(config);
      setIsConfigured(true);
      setSuccess('Configuration saved successfully!');
      
      // Test connection after saving
      await handleTest();
      
      // Load repository info
      await loadRepositoryInfo();
    } catch (error) {
      setError('Error saving configuration: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.token || !config.owner || !config.repo) {
      setError('Please fill in all fields before testing');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError('');

    try {
      // Temporarily save config for testing
      GitHubService.setConfig(config);
      
      const result = await GitHubService.testConnection();
      setTestResult(result);
      
      if (result.success) {
        setSuccess('Connection successful! Repository access confirmed.');
      } else {
        setError('Connection failed: ' + result.error);
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
      setError('Connection test failed: ' + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleInitializeRepository = async () => {
    try {
      setIsSaving(true);
      await GitHubService.initializeRepository();
      setSuccess('Repository initialized successfully!');
      await loadRepositoryInfo();
    } catch (error) {
      setError('Error initializing repository: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncData = async () => {
    try {
      setIsSyncing(true);
      setError('');
      
      // Get current data from localStorage
      const players = JSON.parse(localStorage.getItem('fifa-csv-players.csv') || '[]');
      const matches = JSON.parse(localStorage.getItem('fifa-csv-matches.csv') || '[]');
      const leagues = JSON.parse(localStorage.getItem('fifa-csv-leagues.csv') || '[]');
      
      const results = await GitHubService.syncAllData(players, matches, leagues);
      setSuccess(`Successfully synced ${results.length} files to GitHub: ${results.join(', ')}`);
    } catch (error) {
      setError('Error syncing data: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">GitHub Settings</h1>
        <p className="text-gray-600">Configure GitHub repository for persistent data storage</p>
      </div>

      {/* Status Card */}
      {isConfigured && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              GitHub Configured
            </CardTitle>
          </CardHeader>
          <CardContent>
            {repositoryInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Repository:</span>
                  <a 
                    href={repositoryInfo.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    {repositoryInfo.full_name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Visibility:</span>
                  <span className="text-sm font-medium">
                    {repositoryInfo.private ? 'Private' : 'Public'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Default Branch:</span>
                  <span className="text-sm font-medium">{repositoryInfo.default_branch}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Repository Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GitHub Token */}
          <div>
            <Label htmlFor="token" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              GitHub Personal Access Token
            </Label>
            <Input
              id="token"
              type="password"
              value={config.token}
              onChange={(e) => handleInputChange('token', e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Create a token at{' '}
              <a 
                href="https://github.com/settings/tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                GitHub Settings → Developer settings → Personal access tokens
              </a>
              <br />
              Required permissions: <code>repo</code> (Full control of private repositories)
            </p>
          </div>

          {/* Repository Owner */}
          <div>
            <Label htmlFor="owner">Repository Owner/Organization</Label>
            <Input
              id="owner"
              value={config.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
              placeholder="your-username"
              className="mt-1"
            />
          </div>

          {/* Repository Name */}
          <div>
            <Label htmlFor="repo">Repository Name</Label>
            <Input
              id="repo"
              value={config.repo}
              onChange={(e) => handleInputChange('repo', e.target.value)}
              placeholder="fifa-ranker-data"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              The repository will store CSV files in a <code>data/</code> folder
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleTest} 
              disabled={isTesting || !config.token || !config.owner || !config.repo}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
            
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !config.token || !config.owner || !config.repo}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                  {testResult.success ? (
                    <>
                      <strong>Connection successful!</strong>
                      <br />
                      Repository: {testResult.repository}
                      <br />
                      Permissions: {testResult.permissions?.push ? 'Write access confirmed' : 'Read-only access'}
                    </>
                  ) : (
                    <>
                      <strong>Connection failed:</strong> {testResult.error}
                    </>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      {isConfigured && testResult?.success && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Manage your FIFA Ranker data in the configured GitHub repository.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleInitializeRepository}
                disabled={isSaving}
                variant="outline"
                className="flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Initialize Repository
              </Button>
              
              <Button 
                onClick={handleSyncData}
                disabled={isSyncing}
                className="flex items-center gap-2"
              >
                <Sync className="w-4 h-4" />
                {isSyncing ? 'Syncing...' : 'Sync Current Data'}
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              <p><strong>Initialize Repository:</strong> Creates the data folder structure and README</p>
              <p><strong>Sync Current Data:</strong> Uploads your current localStorage data to GitHub</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Create a GitHub Repository</p>
                <p className="text-sm text-gray-600">
                  Create a new repository on GitHub to store your FIFA Ranker data. 
                  This can be private or public.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Generate Personal Access Token</p>
                <p className="text-sm text-gray-600">
                  Go to GitHub Settings → Developer settings → Personal access tokens → 
                  Generate new token. Select <code>repo</code> permissions.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Configure and Test</p>
                <p className="text-sm text-gray-600">
                  Enter your token, repository owner, and repository name above. 
                  Test the connection to verify access.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div>
                <p className="font-medium">Initialize and Sync</p>
                <p className="text-sm text-gray-600">
                  Initialize the repository structure and sync your existing data to GitHub.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert className="mt-6 border-red-200 bg-red-50">
          <XCircle className="w-4 h-4" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-6 border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4" />
          <AlertDescription className="text-green-800">
            <strong>Success:</strong> {success}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 