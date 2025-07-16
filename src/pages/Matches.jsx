import React, { useState, useEffect } from "react";
import { Match } from "@/entities/Match.js";
import { Season } from "@/entities/Season.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trophy, Search, Filter, Calendar, Plus, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/createPageUrl.js";
import MatchCard from "@/components/matches/MatchCard.jsx";
import EditMatchModal from "@/components/matches/EditMatchModal.jsx";

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("-created_date");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (seasons.length > 0) {
      loadMatches();
    }
  }, [selectedSeason, seasons]);

  useEffect(() => {
    filterAndSortMatches();
  }, [matches, searchTerm, sortBy, filterBy]);

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
      
      // Load matches with the correct season ID
      await loadMatches(initialSeasonId);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError("Failed to load seasons");
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async (seasonIdOverride = null) => {
    setLoading(true);
    try {
      const seasonToUse = seasonIdOverride !== null ? seasonIdOverride : selectedSeason;
      const seasonId = seasonToUse === "all" ? null : parseInt(seasonToUse);
      const matchesData = await Match.list("-created_date", null, seasonId);
      setMatches(matchesData);
    } catch (error) {
      console.error("Error loading matches:", error);
      setError("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMatches = () => {
    let filtered = [...matches];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(match => 
        match.team1_player1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.team1_player2.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.team2_player1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.team2_player2.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply result filter
    if (filterBy !== "all") {
      filtered = filtered.filter(match => {
        if (filterBy === "wins_team1") return match.team1_score > match.team2_score;
        if (filterBy === "wins_team2") return match.team2_score > match.team1_score;
        if (filterBy === "draws") return match.team1_score === match.team2_score;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "-created_date") {
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (sortBy === "created_date") {
        return new Date(a.created_date) - new Date(b.created_date);
      } else if (sortBy === "-match_date") {
        return new Date(b.match_date) - new Date(a.match_date);
      } else if (sortBy === "match_date") {
        return new Date(a.match_date) - new Date(b.match_date);
      }
      return 0;
    });

    setFilteredMatches(filtered);
  };

  const handleEditMatch = (match) => {
    setSelectedMatch(match);
    setEditModalOpen(true);
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      await Match.delete(matchId);
      setSuccess("Match deleted successfully!");
      loadMatches();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error deleting match:", error);
      setError("Failed to delete match. Please try again.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleSaveMatch = async (updatedMatch) => {
    setSuccess("Match updated successfully!");
    loadMatches();
    setTimeout(() => setSuccess(""), 3000);
  };

  const getMatchStats = () => {
    const totalMatches = matches.length;
    const team1Wins = matches.filter(m => m.team1_score > m.team2_score).length;
    const team2Wins = matches.filter(m => m.team2_score > m.team1_score).length;
    const draws = matches.filter(m => m.team1_score === m.team2_score).length;

    return { totalMatches, team1Wins, team2Wins, draws };
  };

  const getSelectedSeasonName = () => {
    if (selectedSeason === "all") return "All Time";
    const season = seasons.find(s => s.id.toString() === selectedSeason);
    return season ? season.name : "Unknown Season";
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = getMatchStats();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Matches</h1>
          <p className="text-gray-600">View and manage all FIFA matches</p>
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
            onClick={() => navigate(createPageUrl("AddMatch"))}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Match
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">{stats.totalMatches}</div>
                <div className="text-sm text-blue-700">Total Matches</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">{stats.team1Wins}</div>
                <div className="text-sm text-green-700">Team 1 Wins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-900">{stats.team2Wins}</div>
                <div className="text-sm text-purple-700">Team 2 Wins</div>
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
                <div className="text-2xl font-bold text-yellow-900">{stats.draws}</div>
                <div className="text-sm text-yellow-700">Draws</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search Players
              </label>
              <Input
                placeholder="Search by player name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Filter by Result
              </label>
              <Select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                <option value="all">All Matches</option>
                <option value="wins_team1">Team 1 Wins</option>
                <option value="wins_team2">Team 2 Wins</option>
                <option value="draws">Draws</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Sort by
              </label>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="-created_date">Newest First</option>
                <option value="created_date">Oldest First</option>
                <option value="-match_date">Latest Match Date</option>
                <option value="match_date">Earliest Match Date</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 mb-6">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Matches List */}
      {filteredMatches.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredMatches.length} Match{filteredMatches.length !== 1 ? 'es' : ''} Found
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                showActions={true}
                onEdit={handleEditMatch}
                onDelete={handleDeleteMatch}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterBy !== "all" || selectedSeason !== "all" ? "No Matches Found" : "No Matches Yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterBy !== "all" || selectedSeason !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Start by recording your first match."
              }
            </p>
            {(!searchTerm && filterBy === "all" && selectedSeason === "all") && (
              <Button 
                onClick={() => navigate(createPageUrl("AddMatch"))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Match
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Match Modal */}
      <EditMatchModal
        match={selectedMatch}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedMatch(null);
        }}
        onSave={handleSaveMatch}
      />
    </div>
  );
} 