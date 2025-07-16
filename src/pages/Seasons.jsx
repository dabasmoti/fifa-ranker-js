import React, { useState, useEffect } from "react";
import { Season } from "@/entities/Season.js";
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
  Calendar,
  Users,
  Target,
  BarChart3,
  Lock,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

export default function Seasons() {
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [seasonStats, setSeasonStats] = useState({});
  const [isAdmin, setIsAdmin] = useState(true); // For now, everyone is admin

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
      const [seasonsData, activeSeasonData] = await Promise.all([
        Season.list(),
        Season.getActive()
      ]);
      
      setSeasons(seasonsData);
      setActiveSeason(activeSeasonData);
      
      // Load stats for each season
      const stats = {};
      for (const season of seasonsData) {
        const matches = await Match.getBySeason(season.id);
        stats[season.id] = {
          totalMatches: matches.length,
          uniquePlayers: new Set([
            ...matches.map(m => m.team1_player1),
            ...matches.map(m => m.team1_player2),
            ...matches.map(m => m.team2_player1),
            ...matches.map(m => m.team2_player2),
          ].filter(Boolean)).size
        };
      }
      setSeasonStats(stats);
      
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load seasons");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Season name is required");
      return;
    }

    try {
      await Season.create({
        ...formData,
        name: formData.name.trim(),
        is_active: false // Don't auto-activate new seasons
      });

      setSuccess("Season created successfully!");
      resetForm();
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error creating season:", error);
      setError(error.message || "Failed to create season. Please try again.");
    }
  };

  const handleEditSeason = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Season name is required");
      return;
    }

    try {
      await Season.update(editingSeason.id, {
        ...formData,
        name: formData.name.trim()
      });

      setSuccess("Season updated successfully!");
      resetForm();
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating season:", error);
      setError(error.message || "Failed to update season. Please try again.");
    }
  };

  const handleSetActive = async (seasonId) => {
    try {
      await Season.setActive(seasonId);
      setSuccess("Season activated successfully!");
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error activating season:", error);
      setError("Failed to activate season");
    }
  };

  const handleEndSeason = async (seasonId, seasonName) => {
    if (!isAdmin) {
      setError("Only administrators can end seasons");
      return;
    }

    if (window.confirm(`Are you sure you want to end "${seasonName}"? This action cannot be undone and will lock the season.`)) {
      try {
        await Season.endSeason(seasonId);
        setSuccess("Season ended and locked successfully!");
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Error ending season:", error);
        setError("Failed to end season");
      }
    }
  };

  const handleDeleteSeason = async (seasonId, seasonName) => {
    if (window.confirm(`Are you sure you want to delete "${seasonName}"? This will also delete all associated matches.`)) {
      try {
        await Season.delete(seasonId);
        setSuccess("Season deleted successfully!");
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        console.error("Error deleting season:", error);
        setError(error.message || "Failed to delete season");
      }
    }
  };

  const handleDeleteAllMatches = async () => {
    if (!isAdmin) {
      setError("Only administrators can delete all matches");
      return;
    }

    const confirmed = window.confirm(
      "⚠️ DANGER: This will permanently delete ALL matches from the database!\n\n" +
      "This action cannot be undone. Are you absolutely sure you want to continue?"
    );

    if (confirmed) {
      const doubleConfirmed = window.confirm(
        "This is your final warning!\n\n" +
        "ALL MATCHES WILL BE PERMANENTLY DELETED.\n\n" +
        "Type 'DELETE ALL' in the next prompt to confirm."
      );

      if (doubleConfirmed) {
        const finalConfirmation = prompt(
          "Type 'DELETE ALL' (case sensitive) to confirm deletion of all matches:"
        );

        if (finalConfirmation === "DELETE ALL") {
          try {
            await Match.deleteAll();
            setSuccess("All matches have been deleted successfully!");
            loadData(); // Reload to update match counts
            setTimeout(() => setSuccess(""), 5000);
          } catch (error) {
            console.error("Error deleting all matches:", error);
            setError("Failed to delete all matches. Please try again.");
          }
        } else {
          setError("Confirmation text did not match. Deletion cancelled.");
        }
      }
    }
  };

  const handleExportSeason = async (seasonId) => {
    try {
      const data = await Season.exportData(seasonId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess("Season data exported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error exporting season:", error);
      setError("Failed to export season data");
    }
  };

  const openCreateForm = () => {
    resetForm();
    setShowCreateForm(true);
    setShowEditForm(false);
  };

  const openEditForm = (season) => {
    if (season.is_locked && !isAdmin) {
      setError("Cannot edit locked seasons");
      return;
    }
    
    setEditingSeason(season);
    setFormData({
      name: season.name,
      description: season.description || "",
      start_date: season.start_date || new Date().toISOString().split('T')[0],
      end_date: season.end_date || ""
    });
    setShowEditForm(true);
    setShowCreateForm(false);
    setError("");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: ""
    });
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingSeason(null);
    setError("");
  };

  const getSeasonStatus = (season) => {
    if (season.is_locked) return { label: "Ended", color: "secondary", icon: Lock };
    if (season.is_active) return { label: "Active", color: "success", icon: Play };
    if (season.end_date) return { label: "Completed", color: "warning", icon: CheckCircle };
    return { label: "Scheduled", color: "outline", icon: Clock };
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading seasons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Season Management</h1>
        <p className="text-gray-600">Manage FIFA tournament seasons and track performance over time</p>
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

      {/* Active Season Info */}
      {activeSeason && (
        <Card className="mb-6 ring-2 ring-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Trophy className="w-5 h-5" />
              Current Active Season
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg text-green-900">{activeSeason.name}</h3>
                {activeSeason.description && (
                  <p className="text-green-700 mt-1">{activeSeason.description}</p>
                )}
                <div className="mt-2 space-y-1 text-sm text-green-600">
                  <p>Started: {activeSeason.start_date ? format(new Date(activeSeason.start_date), 'PPP') : 'Not set'}</p>
                  {activeSeason.end_date && (
                    <p>Ends: {format(new Date(activeSeason.end_date), 'PPP')}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Matches: </span>
                  {seasonStats[activeSeason.id]?.totalMatches || 0}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Players: </span>
                  {seasonStats[activeSeason.id]?.uniquePlayers || 0}
                </div>
                {isAdmin && !activeSeason.is_locked && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEndSeason(activeSeason.id, activeSeason.name)}
                    className="flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <Pause className="w-3 h-3" />
                    End Season
                  </Button>
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
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {showCreateForm ? "Create New Season" : "Edit Season"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={showCreateForm ? handleCreateSeason : handleEditSeason} className="space-y-4">
              <div>
                <Label htmlFor="name">Season Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Winter League 2024, Premier Season"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Optional description of the season"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
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
                  <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing seasons</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {showCreateForm ? "Create Season" : "Update Season"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
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
        <div className="mb-6 flex gap-3 flex-wrap">
          <Button onClick={openCreateForm} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Season
          </Button>
          {isAdmin && (
            <Button 
              onClick={handleDeleteAllMatches}
              variant="outline"
              className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
            >
              <AlertTriangle className="w-4 h-4" />
              Delete All Matches
            </Button>
          )}
        </div>
      )}

      {/* Seasons List */}
      <div className="space-y-4">
        {seasons.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No seasons found</h3>
              <p className="text-gray-500 mb-4">Create your first season to start organizing your FIFA tournaments.</p>
              <Button onClick={openCreateForm} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Create First Season
              </Button>
            </CardContent>
          </Card>
        ) : (
          seasons.map((season) => {
            const status = getSeasonStatus(season);
            const StatusIcon = status.icon;
            
            return (
              <Card key={season.id} className={`${season.is_active ? 'ring-2 ring-green-200' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {season.name}
                        <Badge variant={status.color} className="flex items-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                        {season.is_locked && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Locked
                          </Badge>
                        )}
                      </CardTitle>
                      {season.description && (
                        <p className="text-gray-600 mt-1">{season.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="text-sm">
                      <span className="font-medium">Start Date: </span>
                      {season.start_date ? format(new Date(season.start_date), 'PP') : 'Not set'}
                    </div>
                    {season.end_date && (
                      <div className="text-sm">
                        <span className="font-medium">End Date: </span>
                        {format(new Date(season.end_date), 'PP')}
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="font-medium">Matches: </span>
                      {seasonStats[season.id]?.totalMatches || 0}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Players: </span>
                      {seasonStats[season.id]?.uniquePlayers || 0}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!season.is_active && !season.is_locked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(season.id)}
                        className="flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Activate
                      </Button>
                    )}
                    
                    {season.is_active && !season.is_locked && isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEndSeason(season.id, season.name)}
                        className="flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <Pause className="w-3 h-3" />
                        End Season
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportSeason(season.id)}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </Button>

                    {(!season.is_locked || isAdmin) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(season)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSeason(season.id, season.name)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
} 