import React, { useState, useEffect } from "react";
import { Player } from "@/entities/Player.js";
import { Match } from "@/entities/Match.js";
import { Season } from "@/entities/Season.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Plus, Users, Calendar, Trophy, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils/createPageUrl.js";
import MatchCard from "@/components/matches/MatchCard.jsx";

export default function AddMatch() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [matchData, setMatchData] = useState({
    team1_player1: "",
    team1_player2: "",
    team2_player1: "",
    team2_player2: "",
    team1_score: "",
    team2_score: "",
    match_date: new Date().toISOString().split('T')[0],
    seasonId: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playersData, matchesData, seasonsData, activeSeasonData] = await Promise.all([
        Player.list(),
        Match.list('-created_date', 5),
        Season.list(),
        Season.getActive()
      ]);
      
      setPlayers(playersData);
      setRecentMatches(matchesData);
      setSeasons(seasonsData);
      setActiveSeason(activeSeasonData);
      
      // Set default season to active season if it exists
      if (activeSeasonData && !matchData.seasonId) {
        setMatchData(prev => ({
          ...prev,
          seasonId: activeSeasonData.id.toString()
        }));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setMatchData(prev => ({
      ...prev,
      [field]: value
    }));
    setError("");
  };

  const validateMatch = () => {
    const { team1_player1, team1_player2, team2_player1, team2_player2, team1_score, team2_score, seasonId } = matchData;
    
    if (!team1_player1 || !team1_player2 || !team2_player1 || !team2_player2) {
      return "Please select all players for both teams";
    }

    const allSelectedPlayers = [team1_player1, team1_player2, team2_player1, team2_player2];
    const uniquePlayers = new Set(allSelectedPlayers);
    
    if (uniquePlayers.size !== 4) {
      return "Each player can only be selected once per match";
    }

    if (team1_score === "" || team2_score === "") {
      return "Please enter scores for both teams";
    }

    const score1 = parseInt(team1_score);
    const score2 = parseInt(team2_score);
    
    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      return "Please enter valid scores (0 or higher)";
    }

    if (!seasonId) {
      return "Please select a season for this match";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateMatch();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await Match.create({
        ...matchData,
        team1_score: parseInt(matchData.team1_score),
        team2_score: parseInt(matchData.team2_score),
        seasonId: parseInt(matchData.seasonId)
      });

      setSuccess("Match recorded successfully!");
      
      // Reset form but keep the selected season
      const currentSeasonId = matchData.seasonId;
      setMatchData({
        team1_player1: "",
        team1_player2: "",
        team2_player1: "",
        team2_player2: "",
        team1_score: "",
        team2_score: "",
        match_date: new Date().toISOString().split('T')[0],
        seasonId: currentSeasonId
      });

      // Reload recent matches
      loadData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error recording match:", error);
      setError("Failed to record match. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailablePlayersForSelect = (currentField) => {
    const selectedPlayers = Object.entries(matchData)
      .filter(([field, value]) => field !== currentField && field.includes('player') && value)
      .map(([_, value]) => value);
    
    return players.filter(player => !selectedPlayers.includes(player.name));
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (players.length < 4) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Card className="text-center py-16">
          <CardContent>
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Not Enough Players</h3>
            <p className="text-gray-500 mb-4">You need at least 4 players to record a match.</p>
            <Button 
              onClick={() => navigate(createPageUrl("Players"))}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add More Players
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Record Match</h1>
        <p className="text-gray-600">Add a new FIFA match result</p>
      </div>

      {/* Season Info */}
      {activeSeason ? (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-green-800">
            <strong>Active Season:</strong> {activeSeason.name}
            {activeSeason.description && ` - ${activeSeason.description}`}
            <br />
            <span className="text-sm">This season is pre-selected by default, but you can choose any unlocked season.</span>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-blue-800">
            <strong>No Active Season:</strong> Please select a season for your match, or a new season will be automatically created.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Match Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Selection */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Team 1 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Team 1</h3>
                </div>
                
                <div>
                  <Label htmlFor="team1_player1">Player 1</Label>
                  <Select 
                    value={matchData.team1_player1} 
                    onChange={(e) => handleInputChange('team1_player1', e.target.value)}
                    className="mt-1"
                  >
                    <option value="">Select first player</option>
                    {getAvailablePlayersForSelect('team1_player1').map((player) => (
                      <option key={player.id} value={player.name}>
                        {player.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="team1_player2">Player 2</Label>
                  <Select 
                    value={matchData.team1_player2} 
                    onChange={(e) => handleInputChange('team1_player2', e.target.value)}
                    className="mt-1"
                  >
                    <option value="">Select second player</option>
                    {getAvailablePlayersForSelect('team1_player2').map((player) => (
                      <option key={player.id} value={player.name}>
                        {player.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="team1_score">Team 1 Score</Label>
                  <Input
                    id="team1_score"
                    type="number"
                    min="0"
                    value={matchData.team1_score}
                    onChange={(e) => handleInputChange('team1_score', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Team 2 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">Team 2</h3>
                </div>
                
                <div>
                  <Label htmlFor="team2_player1">Player 1</Label>
                  <Select 
                    value={matchData.team2_player1} 
                    onChange={(e) => handleInputChange('team2_player1', e.target.value)}
                    className="mt-1"
                  >
                    <option value="">Select first player</option>
                    {getAvailablePlayersForSelect('team2_player1').map((player) => (
                      <option key={player.id} value={player.name}>
                        {player.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="team2_player2">Player 2</Label>
                  <Select 
                    value={matchData.team2_player2} 
                    onChange={(e) => handleInputChange('team2_player2', e.target.value)}
                    className="mt-1"
                  >
                    <option value="">Select second player</option>
                    {getAvailablePlayersForSelect('team2_player2').map((player) => (
                      <option key={player.id} value={player.name}>
                        {player.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="team2_score">Team 2 Score</Label>
                  <Input
                    id="team2_score"
                    type="number"
                    min="0"
                    value={matchData.team2_score}
                    onChange={(e) => handleInputChange('team2_score', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Match Date and Season */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="match_date">Match Date</Label>
                <Input
                  id="match_date"
                  type="date"
                  value={matchData.match_date}
                  onChange={(e) => handleInputChange('match_date', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="seasonId">Season</Label>
                <Select 
                  value={matchData.seasonId} 
                  onChange={(e) => handleInputChange('seasonId', e.target.value)}
                  className="mt-1"
                >
                  <option value="">Select season</option>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                      {season.is_active && " (Active)"}
                      {season.is_locked && " (Ended)"}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            >
              {isSubmitting ? "Recording Match..." : "Record Match"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}