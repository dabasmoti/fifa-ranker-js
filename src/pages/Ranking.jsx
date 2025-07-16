
import React, { useState, useEffect } from "react";
import { Player } from "@/entities/Player.js";
import { Season } from "@/entities/Season.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Users, 
  Target, 
  TrendingUp,
  Grid3X3,
  List,
  Upload,
  Cloud,
  Calendar,
  ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/createPageUrl.js";

export default function Rankings() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (seasons.length > 0) {
      loadPlayers();
    }
  }, [selectedSeason, seasons]);

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
      if (activeSeason) {
        setSelectedSeason(activeSeason.id.toString());
      }
      
      // Load players after seasons are loaded
      await loadPlayers();
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      const seasonId = selectedSeason === "all" ? null : parseInt(selectedSeason);
      const playersData = await Player.getAllPlayersWithStats(seasonId);
      setPlayers(playersData);
    } catch (error) {
      console.error("Error loading players:", error);
      setError("Failed to load rankings");
    }
  };

  const getSelectedSeasonName = () => {
    if (selectedSeason === "all") return "All Time";
    const season = seasons.find(s => s.id.toString() === selectedSeason);
    return season ? season.name : "Unknown Season";
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rankings...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalPlayers: players.length,
    activePlayers: players.filter(p => p.matches_played > 0).length,
    totalMatches: players.reduce((sum, p) => sum + p.matches_played, 0) / 2, // Divide by 2 since each match involves 2 players
    avgSuccessRate: players.length > 0 ? 
      (players.reduce((sum, p) => sum + parseFloat(p.success_percentage), 0) / players.length).toFixed(1) : 0
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Trophy className="w-5 h-5 text-yellow-600" />;
    return <span className="text-lg font-medium text-gray-500">{index + 1}</span>;
  };

  const TableView = () => (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">RANK</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">PLAYER</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">SUCCESS RATE</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">POINTS</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">MP</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">W</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">D</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">L</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      {getRankIcon(index)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {player.name[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{player.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${player.success_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {player.success_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold">{player.total_points} / {player.matches_played * 3}</span>
                  </td>
                  <td className="py-4 px-4">{player.matches_played}</td>
                  <td className="py-4 px-4">
                    <span className="text-green-600 font-medium">{player.wins}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-yellow-600 font-medium">{player.draws}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-red-600 font-medium">{player.losses}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {players.map((player, index) => (
        <Card key={player.id} className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getRankIcon(index)}
                <div>
                  <h3 className="font-semibold text-gray-900">{player.name}</h3>
                  <p className="text-sm text-gray-500">{player.matches_played} matches played</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {player.success_percentage}%
                </div>
                {index === 0 && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    🏆 Top Player
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{player.wins}</div>
                <div className="text-xs text-gray-500">WINS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{player.draws}</div>
                <div className="text-xs text-gray-500">DRAWS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{player.losses}</div>
                <div className="text-xs text-gray-500">LOSSES</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {player.total_points} / {player.matches_played * 3} points
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${player.success_percentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Player Rankings</h1>
          <p className="text-gray-500 mt-1">
            Track FIFA player performance and success rates
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            variant={viewMode === 'table' ? 'secondary' : 'outline'}
            onClick={() => setViewMode('table')}
          >
            <List className="w-4 h-4 mr-2" />
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'secondary' : 'outline'}
            onClick={() => setViewMode('cards')}
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Cards
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Statistics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">{stats.activePlayers}</div>
                <div className="text-sm text-blue-700">Active Players</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">{stats.totalMatches}</div>
                <div className="text-sm text-green-700">Total Matches</div>
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

      {/* Leaderboard Section */}
      {players.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Player Data Yet</h3>
            <p className="text-gray-600 mb-6">
              Start by adding players and recording matches to see rankings!
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button 
                onClick={() => navigate(createPageUrl("Players"))}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Users className="w-5 h-5 mr-2" />
                Add Players
              </Button>
              <Button 
                onClick={() => navigate(createPageUrl("AddMatch"))}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <Target className="w-5 h-5 mr-2" />
                Record First Match
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Render Current View */}
          {viewMode === "table" ? <TableView /> : <CardView />}
        </>
      )}
    </div>
  );
}
