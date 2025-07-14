
import React, { useState, useEffect } from "react";
import { Player } from "@/entities/Player.js";
import { Match } from "@/entities/Match.js";
import { Trophy, Users, Target, TrendingUp, LayoutGrid, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PlayerStatsCard from "@/components/rankings/PlayerStatsCard.jsx";
import PlayerStatsTable from "@/components/rankings/PlayerStatsTable.jsx";
import { Button } from "@/components/ui/button";

export default function Rankings() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [view, setView] = useState("card"); // 'card' or 'table'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playersData, matchesData] = await Promise.all([
        Player.list(),
        Match.list('-created_date')
      ]);
      
      setPlayers(playersData);
      setMatches(matchesData);
      calculateStats(playersData, matchesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (playersData, matchesData) => {
    const playerStats = {};
    
    // Initialize stats for all players
    playersData.forEach(player => {
      playerStats[player.name] = {
        ...player,
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        total_points: 0,
        max_possible_points: 0,
        success_percentage: 0
      };
    });

    // Calculate stats from matches
    matchesData.forEach(match => {
      const team1Players = [match.team1_player1, match.team1_player2];
      const team2Players = [match.team2_player1, match.team2_player2];
      
      let team1Points = 0;
      let team2Points = 0;
      
      if (match.team1_score > match.team2_score) {
        team1Points = 3; // Win
        team2Points = 0; // Loss
      } else if (match.team2_score > match.team1_score) {
        team1Points = 0; // Loss
        team2Points = 3; // Win
      } else {
        team1Points = 1; // Draw
        team2Points = 1; // Draw
      }

      // Update stats for team 1 players
      team1Players.forEach(playerName => {
        if (playerStats[playerName]) {
          playerStats[playerName].matches_played++;
          playerStats[playerName].total_points += team1Points;
          playerStats[playerName].max_possible_points += 3;
          
          if (team1Points === 3) playerStats[playerName].wins++;
          else if (team1Points === 1) playerStats[playerName].draws++;
          else playerStats[playerName].losses++;
        }
      });

      // Update stats for team 2 players
      team2Players.forEach(playerName => {
        if (playerStats[playerName]) {
          playerStats[playerName].matches_played++;
          playerStats[playerName].total_points += team2Points;
          playerStats[playerName].max_possible_points += 3;
          
          if (team2Points === 3) playerStats[playerName].wins++;
          else if (team2Points === 1) playerStats[playerName].draws++;
          else playerStats[playerName].losses++;
        }
      });
    });

    // Calculate success percentages
    Object.keys(playerStats).forEach(playerName => {
      const player = playerStats[playerName];
      if (player.max_possible_points > 0) {
        player.success_percentage = (player.total_points / player.max_possible_points) * 100;
      }
    });

    setStats(playerStats);
  };

  const getSortedPlayers = () => {
    return Object.values(stats)
      .filter(player => player.matches_played > 0)
      .sort((a, b) => b.success_percentage - a.success_percentage || b.total_points - a.total_points);
  };

  const getOverallStats = () => {
    const playersWithMatches = Object.values(stats).filter(p => p.matches_played > 0);
    return {
      totalPlayers: playersWithMatches.length,
      totalMatches: matches.length,
      avgSuccessRate: playersWithMatches.length > 0 
        ? playersWithMatches.reduce((sum, p) => sum + p.success_percentage, 0) / playersWithMatches.length 
        : 0
    };
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sortedPlayers = getSortedPlayers();
  const overallStats = getOverallStats();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Player Rankings</h1>
        <p className="text-gray-600">Track FIFA player performance and success rates</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">{overallStats.totalPlayers}</div>
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
                <div className="text-2xl font-bold text-green-900">{overallStats.totalMatches}</div>
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
                <div className="text-2xl font-bold text-purple-900">{overallStats.avgSuccessRate.toFixed(1)}%</div>
                <div className="text-sm text-purple-700">Avg Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      {sortedPlayers.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border">
                <Button
                    variant={view === 'card' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setView('card')}
                    aria-label="Card view"
                >
                    <LayoutGrid className="h-5 w-5" />
                </Button>
                <Button
                    variant={view === 'table' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setView('table')}
                    aria-label="Table view"
                >
                    <List className="h-5 w-5" />
                </Button>
            </div>
          </div>
          
          {view === 'card' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sortedPlayers.map((player, index) => (
                <PlayerStatsCard 
                  key={player.name} 
                  player={player} 
                  rank={index + 1}
                  isTopPlayer={index === 0}
                />
              ))}
            </div>
          ) : (
            <PlayerStatsTable sortedPlayers={sortedPlayers} />
          )}

        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rankings Yet</h3>
            <p className="text-gray-500">Add some players and record matches to see rankings here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
