import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp } from "lucide-react";

export default function PlayerStatsCard({ player, rank, isTopPlayer }) {
  const getPositionIcon = (position) => {
    if (position === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">{position}</div>;
  };

  const getSuccessColor = (percentage) => {
    if (percentage >= 75) return "text-green-600 bg-green-50";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isTopPlayer ? 'ring-2 ring-blue-200 shadow-lg' : ''
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getPositionIcon(rank)}
            <div>
              <h3 className="font-bold text-lg text-gray-900">{player.name}</h3>
              <p className="text-sm text-gray-500">{player.matches_played} matches played</p>
            </div>
          </div>
          <Badge className={`${getSuccessColor(player.success_percentage)} border-0 text-sm font-bold px-3 py-1`}>
            {player.success_percentage.toFixed(1)}%
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{player.wins}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{player.draws}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Draws</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{player.losses}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Losses</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Target className="w-4 h-4" />
            <span>{player.total_points} / {player.max_possible_points} points</span>
          </div>
          {isTopPlayer && (
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Top Player</span>
            </div>
          )}
        </div>

        <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
            style={{ width: `${player.success_percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}