import React, { useState, useEffect } from "react";
import { Player } from "@/entities/Player.js";
import { Season } from "@/entities/Season.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Search,
  UserCheck,
  UserX,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showStats, setShowStats] = useState(true);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: ""
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (seasons.length > 0) {
      loadPlayers();
    }
  }, [selectedSeason, seasons]);

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSeasonDropdown && !event.target.closest('.season-dropdown')) {
        setShowSeasonDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSeasonDropdown]);

  const loadInitialData = async () => {
    try {
      const seasonsData = await Season.list();
      setSeasons(seasonsData);
      
      // Set default to active season if exists, otherwise "all"
      const activeSeason = seasonsData.find(s => s.is_active);
      let initialSeasonId = "all";
      if (activeSeason) {
        initialSeasonId = activeSeason.id.toString();
        setSelectedSeason(initialSeasonId);
      }
      
      // Load players with the correct season ID
      await loadPlayers(initialSeasonId);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async (seasonIdOverride = null) => {
    setLoading(true);
    try {
      // Load players with their calculated statistics for the selected season
      console.log('🔄 Loading players with statistics...');
      const seasonToUse = seasonIdOverride !== null ? seasonIdOverride : selectedSeason;
      const seasonId = seasonToUse === "all" ? null : parseInt(seasonToUse);
      const playersData = await Player.getAllPlayersWithStats(seasonId);
      setPlayers(playersData);
      console.log(`✅ Loaded ${playersData.length} players with statistics for season: ${seasonToUse}`);
    } catch (error) {
      console.error("Error loading players:", error);
      setError("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSeasonName = () => {
    if (selectedSeason === "all") return "All Time";
    const season = seasons.find(s => s.id.toString() === selectedSeason);
    return season ? season.name : "Unknown Season";
  };

  const handleRefresh = async () => {
    console.log('🔄 Manually refreshing player data...');
    await loadPlayers();
    setSuccess("Player data refreshed!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const filterPlayers = () => {
    if (!searchTerm) {
      setFilteredPlayers(players);
      return;
    }
    
    const filtered = players.filter(player =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPlayers(filtered);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Player name is required");
      return;
    }

    try {
      if (editingPlayer) {
        await Player.update(editingPlayer.id, formData);
        setSuccess("Player updated successfully!");
        setShowEditForm(false);
        setEditingPlayer(null);
      } else {
        await Player.create(formData);
        setSuccess("Player added successfully!");
        setShowAddForm(false);
      }
      
      setFormData({ name: "" });
      await loadPlayers();
    } catch (error) {
      setError(error.message || "An error occurred");
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({ name: player.name });
    setShowEditForm(true);
    setError("");
  };

  const handleDelete = async (player) => {
    if (!confirm(`Are you sure you want to delete "${player.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await Player.delete(player.id);
      setSuccess(`Player "${player.name}" deleted successfully!`);
      await loadPlayers();
    } catch (error) {
      setError(error.message || "Failed to delete player");
    }
  };

  const handleExport = async () => {
    try {
      await Player.exportToCsv(`players_${new Date().toISOString().split('T')[0]}.csv`);
      setSuccess("Players exported successfully!");
    } catch (error) {
      setError("Failed to export players");
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await Player.importFromCsv(file);
      setSuccess(`Import complete! ${result.imported} players imported, ${result.skipped} skipped (duplicates)`);
      await loadPlayers();
    } catch (error) {
      setError("Failed to import players: " + error.message);
    }
    
    // Reset file input
    event.target.value = "";
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setEditingPlayer(null);
    setFormData({ name: "" });
    setError("");
  };

  const stats = {
    totalPlayers: players.length,
    activePlayers: players.filter(p => p.matches_played > 0).length,
    topPlayer: players.length > 0 ? players[0] : null,
    avgSuccessRate: players.length > 0 ? 
      (players.reduce((sum, p) => sum + parseFloat(p.success_percentage), 0) / players.length).toFixed(1) : 0
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Players</h1>
          <p className="text-gray-600">Manage FIFA tournament players and view statistics</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Season Selector */}
          <div className="relative season-dropdown">
            <Button
              variant="outline"
              onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
              className="flex items-center gap-2 min-w-[150px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{getSelectedSeasonName()}</span>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            {showSeasonDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[200px]">
                <div className="py-1">
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      selectedSeason === "all" ? "bg-blue-50 text-blue-600" : ""
                    }`}
                    onClick={() => {
                      setSelectedSeason("all");
                      setShowSeasonDropdown(false);
                    }}
                  >
                    🏆 All Time
                  </button>
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        selectedSeason === season.id.toString() ? "bg-blue-50 text-blue-600" : ""
                      }`}
                      onClick={() => {
                        setSelectedSeason(season.id.toString());
                        setShowSeasonDropdown(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{season.name}</span>
                        {season.is_active && (
                          <Badge variant="success" className="text-xs">Active</Badge>
                        )}
                        {season.is_locked && (
                          <Badge variant="secondary" className="text-xs">Ended</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Player
          </Button>
          <Button 
            onClick={handleExport}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </Button>
          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Refresh
          </Button>
          <div className="relative">
            <Button 
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
              onClick={() => document.getElementById('import-players').click()}
            >
              <Upload className="w-5 h-5 mr-2" />
              Import
            </Button>
            <input
              id="import-players"
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">{stats.totalPlayers}</div>
                  <div className="text-sm text-blue-700">Total Players</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-600 rounded-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">{stats.activePlayers}</div>
                  <div className="text-sm text-green-700">Active Players</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-600 rounded-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-900 truncate">
                    {stats.topPlayer ? stats.topPlayer.name : 'N/A'}
                  </div>
                  <div className="text-sm text-yellow-700">Top Player</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900">{stats.avgSuccessRate}%</div>
                  <div className="text-sm text-purple-700">Avg Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Add/Edit Player Form */}
      {(showAddForm || showEditForm) && (
        <Card className="mb-8 border-2 border-blue-200">
          <CardHeader>
            <CardTitle>{editingPlayer ? 'Edit Player' : 'Add New Player'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Player Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter player name"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {editingPlayer ? 'Update Player' : 'Add Player'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={editingPlayer ? cancelEdit : () => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      {filteredPlayers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No players found' : 'No players yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `No players match "${searchTerm}"`
                : 'Add your first player to start tracking FIFA matches'
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Player
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-gray-900 truncate">
                      {player.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Joined {format(new Date(player.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(player)}
                      className="p-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(player)}
                      className="p-2 border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Success Rate */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Success Rate</span>
                    <Badge 
                      className={`
                        ${parseFloat(player.success_percentage) >= 70 ? 'bg-green-100 text-green-800' : 
                          parseFloat(player.success_percentage) >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}
                      `}
                    >
                      {player.success_percentage}%
                    </Badge>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{player.matches_played}</div>
                      <div className="text-xs text-gray-500">Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{player.wins}</div>
                      <div className="text-xs text-gray-500">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">{player.draws}</div>
                      <div className="text-xs text-gray-500">Draws</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{player.losses}</div>
                      <div className="text-xs text-gray-500">Losses</div>
                    </div>
                  </div>

                  {/* Goals */}
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-600">
                      Goals: <span className="font-medium text-blue-600">{player.goals_for}</span> - 
                      <span className="font-medium text-red-600"> {player.goals_against}</span>
                    </span>
                    <span className="font-medium text-purple-600">
                      {player.total_points} pts
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Player Management Tips</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• <strong>Add players</strong> before recording any matches</li>
            <li>• <strong>Export data</strong> regularly to backup your player list</li>
            <li>• <strong>Import CSV files</strong> to restore or merge player data</li>
            <li>• <strong>Statistics update</strong> automatically when matches are recorded</li>
            <li>• <strong>Success rate</strong> is calculated as: (Total Points / Max Possible Points) × 100</li>
            <li>• <strong>Scoring:</strong> Win = 3 points, Draw = 1 point, Loss = 0 points</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}