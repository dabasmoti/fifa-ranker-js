import React, { useState, useEffect } from "react";
import { League } from "@/entities/League.js";
import { Match } from "@/entities/Match.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  Calendar,
  Users,
  Target,
  BarChart3,
  Archive
} from "lucide-react";
import { format } from "date-fns";

export default function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [activeLeague, setActiveLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLeague, setEditingLeague] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [leagueStats, setLeagueStats] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leaguesData, activeLeagueData] = await Promise.all([
        League.list(),
        League.getActive()
      ]);
      
      setLeagues(leaguesData);
      setActiveLeague(activeLeagueData);
      
      // Load stats for each league
      const stats = {};
      for (const league of leaguesData) {
        stats[league.id] = await League.getStats(league.id);
      }
      setLeagueStats(stats);
      
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load leagues");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("League name is required");
      return;
    }

    try {
      await League.create({
        ...formData,
        name: formData.name.trim(),
        is_active: false // Don't auto-activate new leagues
      });

      setSuccess("League created successfully!");
      setFormData({
        name: "",
        description: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: ""
      });
      setShowCreateForm(false);
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error creating league:", error);
      setError("Failed to create league. Please try again.");
    }
  };

  const handleEditLeague = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("League name is required");
      return;
    }

    try {
      await League.update(editingLeague.id, {
        ...formData,
        name: formData.name.trim()
      });

      setSuccess("League updated successfully!");
      setFormData({
        name: "",
        description: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: ""
      });
      setShowEditForm(false);
      setEditingLeague(null);
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating league:", error);
      setError("Failed to update league. Please try again.");
    }
  };

  const handleSetActive = async (leagueId) => {
    try {
      await League.setActive(leagueId);
      setSuccess("League activated successfully!");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error activating league:", error);
      setError("Failed to activate league. Please try again.");
    }
  };

  const handleEndLeague = async (leagueId) => {
    if (!confirm("Are you sure you want to end this league? This will deactivate it and set the end date to today.")) {
      return;
    }

    try {
      await League.endLeague(leagueId);
      setSuccess("League ended successfully!");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error ending league:", error);
      setError("Failed to end league. Please try again.");
    }
  };

  const handleDeleteLeague = async (leagueId, leagueName) => {
    if (!confirm(`Are you sure you want to delete "${leagueName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await League.delete(leagueId);
      setSuccess("League deleted successfully!");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error deleting league:", error);
      setError(error.message || "Failed to delete league. Please try again.");
    }
  };

  const handleExportLeague = async (leagueId) => {
    try {
      await League.exportLeagueData(leagueId);
      setSuccess("League data exported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error exporting league:", error);
      setError("Failed to export league data.");
    }
  };

  const openEditForm = (league) => {
    setEditingLeague(league);
    setFormData({
      name: league.name,
      description: league.description || "",
      start_date: league.start_date,
      end_date: league.end_date || ""
    });
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const openCreateForm = () => {
    setFormData({
      name: "",
      description: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: ""
    });
    setShowCreateForm(true);
    setShowEditForm(false);
    setEditingLeague(null);
  };

  const getLeagueStatusBadge = (league) => {
    if (league.is_active) {
      return <Badge className="bg-green-500 text-white">Active</Badge>;
    } else if (league.end_date) {
      return <Badge variant="secondary">Ended</Badge>;
    } else {
      return <Badge variant="outline">Inactive</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading leagues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">League Management</h1>
        <p className="text-gray-600">Manage FIFA tournament seasons and periods</p>
      </div>

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

      {/* Active League Info */}
      {activeLeague && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Trophy className="w-5 h-5" />
              Current Active League
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-green-900">{activeLeague.name}</h3>
                <p className="text-green-700 text-sm">{activeLeague.description}</p>
                <p className="text-green-600 text-xs mt-1">
                  Started: {formatDate(activeLeague.start_date)}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {leagueStats[activeLeague.id] && (
                  <>
                    <div className="text-center">
                      <div className="font-semibold text-green-900">{leagueStats[activeLeague.id].total_matches}</div>
                      <div className="text-green-600">Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-900">{leagueStats[activeLeague.id].total_players}</div>
                      <div className="text-green-600">Players</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || showEditForm) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {showCreateForm ? "Create New League" : "Edit League"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={showCreateForm ? handleCreateLeague : handleEditLeague} className="space-y-4">
              <div>
                <Label htmlFor="name">League Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter league name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter league description"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {showCreateForm ? "Create League" : "Update League"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setShowEditForm(false);
                    setEditingLeague(null);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!showCreateForm && !showEditForm && (
        <div className="mb-6">
          <Button onClick={openCreateForm} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New League
          </Button>
        </div>
      )}

      {/* Leagues List */}
      <div className="space-y-4">
        {leagues.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No leagues found</h3>
              <p className="text-gray-500 mb-4">Create your first league to start organizing your FIFA tournaments.</p>
              <Button onClick={openCreateForm} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Create First League
              </Button>
            </CardContent>
          </Card>
        ) : (
          leagues.map((league) => (
            <Card key={league.id} className={`${league.is_active ? 'ring-2 ring-green-200' : ''}`}>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{league.name}</h3>
                      {getLeagueStatusBadge(league)}
                    </div>
                    
                    {league.description && (
                      <p className="text-gray-600 text-sm mb-2">{league.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Start: {formatDate(league.start_date)}</span>
                      </div>
                      {league.end_date && (
                        <div className="flex items-center gap-1">
                          <Archive className="w-4 h-4" />
                          <span>End: {formatDate(league.end_date)}</span>
                        </div>
                      )}
                    </div>

                    {leagueStats[league.id] && (
                      <div className="flex items-center gap-6 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span>{leagueStats[league.id].total_matches} matches</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-green-600" />
                          <span>{leagueStats[league.id].total_players} players</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!league.is_active && !league.end_date && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(league.id)}
                        className="flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Activate
                      </Button>
                    )}
                    
                    {league.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEndLeague(league.id)}
                        className="flex items-center gap-1"
                      >
                        <Pause className="w-3 h-3" />
                        End League
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportLeague(league.id)}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditForm(league)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteLeague(league.id, league.name)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 