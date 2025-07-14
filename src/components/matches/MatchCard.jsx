import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function MatchCard({ match, onEdit, onDelete, showActions = false }) {
  const getResultBadge = () => {
    if (match.team1_score > match.team2_score) {
      return <Badge className="bg-green-100 text-green-800">Team 1 Won</Badge>;
    } else if (match.team2_score > match.team1_score) {
      return <Badge className="bg-blue-100 text-blue-800">Team 2 Won</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Draw</Badge>;
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(match);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this match?')) {
      onDelete?.(match.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {match.match_date ? format(new Date(match.match_date), 'MMM d, yyyy') : 'No date'}
          </div>
          <div className="flex items-center gap-2">
            {getResultBadge()}
            {showActions && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Edit match"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete match"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Team 1</span>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-gray-900">{match.team1_player1}</div>
              <div className="font-medium text-gray-900">{match.team1_player2}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {match.team1_score} - {match.team2_score}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Team 2</span>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-gray-900">{match.team2_player1}</div>
              <div className="font-medium text-gray-900">{match.team2_player2}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}