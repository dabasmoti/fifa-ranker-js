import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export default function PlayerStatsTable({ sortedPlayers }) {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-100">
                                <TableHead className="w-16 text-center">Rank</TableHead>
                                <TableHead className="min-w-[200px]">Player</TableHead>
                                <TableHead className="w-48 min-w-[180px]">Success Rate</TableHead>
                                <TableHead className="text-center">Points</TableHead>
                                <TableHead className="text-center" title="Matches Played">MP</TableHead>
                                <TableHead className="text-center text-green-600" title="Wins">W</TableHead>
                                <TableHead className="text-center text-yellow-600" title="Draws">D</TableHead>
                                <TableHead className="text-center text-red-600" title="Losses">L</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedPlayers.map((player, index) => (
                                <TableRow key={player.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <div className="flex justify-center items-center h-full">
                                            {index === 0 && <Trophy className="w-6 h-6 text-yellow-400" />}
                                            {index === 1 && <Trophy className="w-6 h-6 text-gray-400" />}
                                            {index === 2 && <Trophy className="w-6 h-6 text-amber-600" />}
                                            {index > 2 && <span className="font-bold text-gray-700 text-lg">{index + 1}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shrink-0">
                                                <span className="text-white font-bold text-md">
                                                    {player.name[0].toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="font-medium text-gray-900">{player.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress 
                                                value={player.success_percentage} 
                                                className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-600"
                                            />
                                            <Badge variant="outline" className="font-bold w-16 justify-center shrink-0">
                                                {player.success_percentage.toFixed(1)}%
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {player.total_points} / {player.max_possible_points}
                                    </TableCell>
                                    <TableCell className="text-center">{player.matches_played}</TableCell>
                                    <TableCell className="text-center font-bold text-lg text-green-600">{player.wins}</TableCell>
                                    <TableCell className="text-center font-bold text-lg text-yellow-600">{player.draws}</TableCell>
                                    <TableCell className="text-center font-bold text-lg text-red-600">{player.losses}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}