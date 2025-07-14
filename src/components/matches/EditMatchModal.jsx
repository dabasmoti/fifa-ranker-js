import React, { useState, useEffect } from "react";
import { Player } from "@/entities/Player.js";
import { Match } from "@/entities/Match.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Save, X } from "lucide-react";

export default function EditMatchModal({ match, isOpen, onClose, onSave }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [matchData, setMatchData] = useState({
    team1_player1: "",
    team1_player2: "",
    team2_player1: "",
    team2_player2: "",
    team1_score: "",
    team2_score: "",
    match_date: ""
  });

  useEffect(() => {
    if (isOpen) {
      loadPlayers();
      if (match) {
        setMatchData({
          team1_player1: match.team1_player1,
          team1_player2: match.team1_player2,
          team2_player1: match.team2_player1,
          team2_player2: match.team2_player2,
          team1_score: match.team1_score?.toString() || "",
          team2_score: match.team2_score?.toString() || "",
          match_date: match.match_date || ""
        });
      }
    }
  }, [isOpen, match]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const playersData = await Player.list();
      setPlayers(playersData);
    } catch (error) {
      console.error("Error loading players:", error);
      setError("Failed to load players");
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
    const { team1_player1, team1_player2, team2_player1, team2_player2, team1_score, team2_score } = matchData;
    
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

    return null;
  };

  const handleSave = async () => {
    const validationError = validateMatch();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedMatch = await Match.update(match.id, {
        ...matchData,
        team1_score: parseInt(matchData.team1_score),
        team2_score: parseInt(matchData.team2_score)
      });

      onSave?.(updatedMatch);
      onClose();
    } catch (error) {
      console.error("Error updating match:", error);
      setError("Failed to update match. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getAvailablePlayersForSelect = (currentField) => {
    const selectedPlayers = Object.entries(matchData)
      .filter(([field, value]) => field !== currentField && field.includes('player') && value)
      .map(([_, value]) => value);
    
    return players.filter(player => !selectedPlayers.includes(player.name));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Match</DialogTitle>
          <DialogDescription>
            Update the match details and scores.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-pulse">Loading players...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Team 1 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Team 1</h3>
                </div>
                
                <div>
                  <Label htmlFor="edit_team1_player1">Player 1</Label>
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
                  <Label htmlFor="edit_team1_player2">Player 2</Label>
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
                  <Label htmlFor="edit_team1_score">Team 1 Score</Label>
                  <Input
                    id="edit_team1_score"
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
                  <Label htmlFor="edit_team2_player1">Player 1</Label>
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
                  <Label htmlFor="edit_team2_player2">Player 2</Label>
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
                  <Label htmlFor="edit_team2_score">Team 2 Score</Label>
                  <Input
                    id="edit_team2_score"
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

            {/* Match Date */}
            <div className="max-w-xs">
              <Label htmlFor="edit_match_date">Match Date</Label>
              <Input
                id="edit_match_date"
                type="date"
                value={matchData.match_date}
                onChange={(e) => handleInputChange('match_date', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 