import React, { useState, useEffect } from "react";
import { Player } from "@/entities/Player.js";
import { Season } from "@/entities/Season.js";
import { Match } from "@/entities/Match.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Play,
  X
} from "lucide-react";

export default function CsvUpload() {
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [seasonName, setSeasonName] = useState("");
  const [seasonDescription, setSeasonDescription] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [useExistingSeason, setUseExistingSeason] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      const seasonsData = await Season.list();
      setSeasons(seasonsData);
    } catch (error) {
      console.error("Error loading seasons:", error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setError("");
    setSuccess("");
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const parsedData = parseCsvData(csvText);
        setCsvData(parsedData);
        
        // Generate preview data
        const preview = generatePreview(parsedData);
        setPreviewData(preview);
      } catch (error) {
        setError(`Failed to parse CSV file: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const parseCsvData = (csvText) => {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const matches = [];

    // More flexible header validation - check for exact matches or close variations
    const expectedHeaders = [
      ['team1_player1', 'team1player1', 'team1 player1'],
      ['team1_player2', 'team1player2', 'team1 player2'], 
      ['team2_player1', 'team2player1', 'team2 player1'],
      ['team2_player2', 'team2player2', 'team2 player2'],
      ['team1_score', 'team1score', 'team1 score'],
      ['team2_score', 'team2score', 'team2 score'],
      ['date', 'match_date', 'matchdate']
    ];

    const headerMapping = {};
    const missingHeaders = [];

    expectedHeaders.forEach((variations, index) => {
      const headerNames = ['team1_player1', 'team1_player2', 'team2_player1', 'team2_player2', 'team1_score', 'team2_score', 'date'];
      const fieldName = headerNames[index];
      
      let found = false;
      for (const variation of variations) {
        const headerIndex = headers.findIndex(h => h === variation);
        if (headerIndex !== -1) {
          headerMapping[fieldName] = headerIndex;
          found = true;
          break;
        }
      }
      
      if (!found) {
        missingHeaders.push(fieldName);
      }
    });

    if (missingHeaders.length > 0) {
      throw new Error(`CSV headers are missing or don't match expected format. 
Found headers: ${headers.join(', ')}
Missing/incorrect: ${missingHeaders.join(', ')}
Expected headers should include: team1_player1, team1_player2, team2_player1, team2_player2, team1_score, team2_score, date`);
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < Object.keys(headerMapping).length) {
        console.warn(`Skipping line ${i + 1}: insufficient data (${values.length} columns, expected ${Object.keys(headerMapping).length})`);
        continue;
      }

      const match = {
        team1_player1: values[headerMapping.team1_player1],
        team1_player2: values[headerMapping.team1_player2],
        team2_player1: values[headerMapping.team2_player1],
        team2_player2: values[headerMapping.team2_player2],
        team1_score: parseInt(values[headerMapping.team1_score]),
        team2_score: parseInt(values[headerMapping.team2_score]),
        match_date: values[headerMapping.date]
      };

      // Validate the match data
      if (match.team1_player1 && match.team2_player1 && 
          !isNaN(match.team1_score) && !isNaN(match.team2_score)) {
        matches.push(match);
      } else {
        console.warn(`Skipping line ${i + 1}: invalid match data`);
      }
    }

    if (matches.length === 0) {
      throw new Error('No valid matches found in CSV file');
    }

    return matches;
  };

  const generatePreview = (matches) => {
    const playerNames = new Set();
    matches.forEach(match => {
      playerNames.add(match.team1_player1);
      if (match.team1_player2) playerNames.add(match.team1_player2);
      playerNames.add(match.team2_player1);
      if (match.team2_player2) playerNames.add(match.team2_player2);
    });

    const dateRange = {
      earliest: matches.reduce((min, match) => 
        match.match_date < min ? match.match_date : min, matches[0]?.match_date || ''),
      latest: matches.reduce((max, match) => 
        match.match_date > max ? match.match_date : max, matches[0]?.match_date || '')
    };

    return {
      totalMatches: matches.length,
      totalPlayers: playerNames.size,
      playerNames: Array.from(playerNames).sort(),
      dateRange,
      sampleMatches: matches.slice(0, 5)
    };
  };

  const handleImport = async () => {
    if (!csvData.length) {
      setError("Please upload a CSV file first");
      return;
    }

    if (!useExistingSeason && !seasonName.trim()) {
      setError("Please enter a season name or select an existing season");
      return;
    }

    if (useExistingSeason && !selectedSeasonId) {
      setError("Please select an existing season");
      return;
    }

    setImporting(true);
    setProgress(0);
    setError("");
    setSuccess("");

    try {
      // Step 1: Create or get season (10%)
      setProgress(10);
      let season;
      
      if (useExistingSeason) {
        season = seasons.find(s => s.id.toString() === selectedSeasonId);
        if (!season) {
          throw new Error("Selected season not found");
        }
      } else {
        // Create new season
        season = await Season.create({
          name: seasonName.trim(),
          description: seasonDescription.trim() || `Imported from CSV on ${new Date().toLocaleDateString()}`,
          start_date: previewData.dateRange.earliest.split(' ')[0],
          is_active: true
        });
      }

      // Step 2: Create players (30%)
      setProgress(30);
      const playerResults = await ensurePlayersExist(previewData.playerNames);

      // Step 3: Import matches (90%)
      const importResults = await importMatches(csvData, season.id);
      setProgress(100);

      // Success!
      setImportResults({
        season: season,
        players: playerResults,
        matches: importResults,
        totalProcessed: csvData.length
      });
      
      setSuccess(`Successfully imported ${importResults.success} matches into "${season.name}"!`);
      
      // Clear form
      setCsvFile(null);
      setCsvData([]);
      setPreviewData(null);
      if (!useExistingSeason) {
        setSeasonName("");
        setSeasonDescription("");
      }

    } catch (error) {
      console.error("Import failed:", error);
      setError(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const ensurePlayersExist = async (playerNames) => {
    const results = { created: 0, existing: 0, errors: [] };

    for (const playerName of playerNames) {
      try {
        await Player.create({ name: playerName });
        results.created++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          results.existing++;
        } else {
          results.errors.push(`${playerName}: ${error.message}`);
        }
      }
    }

    return results;
  };

  const importMatches = async (matches, seasonId) => {
    const results = { success: 0, failed: 0, errors: [] };
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      try {
        // Convert date format if needed
        let matchDate = match.match_date;
        if (matchDate.includes(' ')) {
          matchDate = matchDate.split(' ')[0];
        }

        await Match.create({
          team1_player1: match.team1_player1,
          team1_player2: match.team1_player2 || '',
          team2_player1: match.team2_player1,
          team2_player2: match.team2_player2 || '',
          team1_score: match.team1_score,
          team2_score: match.team2_score,
          match_date: matchDate,
          seasonId: seasonId
        });

        results.success++;
        
        // Update progress
        const progressPercent = 30 + Math.round((i / matches.length) * 60);
        setProgress(progressPercent);
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          match: `${match.team1_player1}+${match.team1_player2} vs ${match.team2_player1}+${match.team2_player2}`,
          error: error.message
        });
      }
    }

    return results;
  };

  const clearUpload = () => {
    setCsvFile(null);
    setCsvData([]);
    setPreviewData(null);
    setError("");
    setSuccess("");
    setImportResults(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">CSV Data Import</h1>
        <p className="text-gray-600">Import match data from CSV files</p>
      </div>

      {/* File Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload CSV File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csvFile">Select CSV File</Label>
              <div className="mt-2">
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Expected format: team1_player1, team1_player2, team2_player1, team2_player2, team1_score, team2_score, date
              </p>
            </div>

            {csvFile && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">{csvFile.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearUpload}
                  disabled={importing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      {previewData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Data Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                <Calendar className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">{previewData.totalMatches}</div>
                  <div className="text-sm text-blue-700">Matches</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md">
                <Users className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">{previewData.totalPlayers}</div>
                  <div className="text-sm text-green-700">Players</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-md">
                <Calendar className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-medium text-purple-900">{previewData.dateRange.earliest.split(' ')[0]}</div>
                  <div className="text-sm text-purple-700">to {previewData.dateRange.latest.split(' ')[0]}</div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Players to be imported:</h4>
              <div className="flex flex-wrap gap-2">
                {previewData.playerNames.map(name => (
                  <span key={name} className="px-2 py-1 bg-gray-100 rounded-md text-sm">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Sample matches:</h4>
              <div className="space-y-2">
                {previewData.sampleMatches.map((match, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                    {match.team1_player1}{match.team1_player2 ? ` + ${match.team1_player2}` : ''} 
                    vs {match.team2_player1}{match.team2_player2 ? ` + ${match.team2_player2}` : ''} 
                    ({match.team1_score}-{match.team2_score}) - {match.match_date.split(' ')[0]}
                  </div>
                ))}
                {previewData.totalMatches > 5 && (
                  <div className="text-sm text-gray-500">
                    ... and {previewData.totalMatches - 5} more matches
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Season Selection */}
      {previewData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Season Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="seasonType"
                    checked={!useExistingSeason}
                    onChange={() => setUseExistingSeason(false)}
                    className="mr-2"
                    disabled={importing}
                  />
                  Create New Season
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="seasonType"
                    checked={useExistingSeason}
                    onChange={() => setUseExistingSeason(true)}
                    className="mr-2"
                    disabled={importing}
                  />
                  Use Existing Season
                </label>
              </div>

              {!useExistingSeason ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="seasonName">Season Name *</Label>
                    <Input
                      id="seasonName"
                      value={seasonName}
                      onChange={(e) => setSeasonName(e.target.value)}
                      placeholder="e.g., Summer Tournament 2025"
                      disabled={importing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="seasonDescription">Description (Optional)</Label>
                    <Input
                      id="seasonDescription"
                      value={seasonDescription}
                      onChange={(e) => setSeasonDescription(e.target.value)}
                      placeholder="Brief description of the season"
                      disabled={importing}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="existingSeason">Select Season *</Label>
                  <select
                    id="existingSeason"
                    value={selectedSeasonId}
                    onChange={(e) => setSelectedSeasonId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={importing}
                  >
                    <option value="">Choose a season...</option>
                    {seasons.map(season => (
                      <option key={season.id} value={season.id}>
                        {season.name} {season.is_active ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button and Progress */}
      {previewData && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            {importing && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Importing data...</span>
                  <span className="text-sm text-gray-500">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={importing || !previewData}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              <Play className="w-5 h-5 mr-2" />
              {importing ? 'Importing...' : `Import ${previewData.totalMatches} Matches`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error/Success Messages */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Import Results */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              Import Completed Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Season Information:</h4>
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="font-medium text-blue-900">{importResults.season.name}</div>
                  <div className="text-sm text-blue-700">{importResults.season.description}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Players:</h4>
                  <div className="space-y-1 text-sm">
                    <div>Created: {importResults.players.created}</div>
                    <div>Already existed: {importResults.players.existing}</div>
                    <div>Errors: {importResults.players.errors.length}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Matches:</h4>
                  <div className="space-y-1 text-sm">
                    <div>Successfully imported: {importResults.matches.success}</div>
                    <div>Failed: {importResults.matches.failed}</div>
                    <div>Total processed: {importResults.totalProcessed}</div>
                  </div>
                </div>
              </div>

              {importResults.matches.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-700">Match Import Errors:</h4>
                  <div className="space-y-1 text-sm">
                    {importResults.matches.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-red-600">
                        {error.match}: {error.error}
                      </div>
                    ))}
                    {importResults.matches.errors.length > 5 && (
                      <div className="text-red-500">
                        ... and {importResults.matches.errors.length - 5} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 