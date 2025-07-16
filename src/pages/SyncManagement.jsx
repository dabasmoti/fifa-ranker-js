import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import SyncService from '@/services/SyncService.js';

const SyncManagement = () => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  const syncService = new SyncService();

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      setLoading(true);
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
      setActionResult({
        type: 'error',
        message: `Failed to load sync status: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      setActionLoading(true);
      setActionResult(null);
      
      let result;
      
      switch (action) {
        case 'migrate_to_blob':
          result = await syncService.migrateToBlob();
          break;
        case 'force_sync':
          result = await syncService.forceSyncFromBlob();
          break;
        case 'resolve_conflicts_blob':
          result = await syncService.resolveConflicts('vercelBlob');
          break;
        case 'resolve_conflicts_local':
          result = await syncService.resolveConflicts('localStorage');
          break;
        case 'backup_data':
          result = await syncService.backupAllData();
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      setActionResult({
        type: 'success',
        message: result.message || 'Action completed successfully'
      });

      // Reload sync status after action
      setTimeout(() => {
        loadSyncStatus();
      }, 1000);

    } catch (error) {
      console.error('Error performing action:', error);
      setActionResult({
        type: 'error',
        message: error.message || 'Action failed'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (isInSync) => {
    return isInSync ? 'success' : 'destructive';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking sync status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Data Sync Management</h1>
          <p className="mt-2 text-gray-600">Manage synchronization between storage systems</p>
        </div>

        {/* Action Result */}
        {actionResult && (
          <Alert className={actionResult.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <AlertDescription className={actionResult.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {actionResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Sync Status
              <Badge variant={syncStatus?.isInSync ? 'success' : 'destructive'}>
                {syncStatus?.isInSync ? 'In Sync' : 'Out of Sync'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Current synchronization status between storage systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* localStorage Status */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">localStorage (Legacy)</h4>
                {syncStatus?.state?.localStorage.hasData ? (
                  <div className="space-y-1 text-sm">
                    <p>📊 Players: {syncStatus.state.localStorage.players}</p>
                    <p>⚽ Matches: {syncStatus.state.localStorage.matches}</p>
                    <Badge variant="warning">Has Legacy Data</Badge>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    <p>No legacy data found</p>
                    <Badge variant="secondary">Clean</Badge>
                  </div>
                )}
              </div>

              {/* Vercel Blob Status */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Vercel Blob (Current)</h4>
                {syncStatus?.state?.vercelBlob.apiAvailable ? (
                  <div className="space-y-1 text-sm">
                    <p>📊 Players: {syncStatus.state.vercelBlob.players}</p>
                    <p>⚽ Matches: {syncStatus.state.vercelBlob.matches}</p>
                    <p>🏆 Leagues: {syncStatus.state.vercelBlob.leagues}</p>
                    <Badge variant="success">API Available</Badge>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    <p>API not available</p>
                    <Badge variant="destructive">Offline</Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conflicts */}
        {syncStatus?.conflicts && syncStatus.conflicts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Conflicts Detected</CardTitle>
              <CardDescription>
                Data inconsistencies between storage systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncStatus.conflicts.map((conflict, index) => (
                  <Alert key={index} className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      <strong>{conflict.type}:</strong> {conflict.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {syncStatus?.recommendations && syncStatus.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>
                Suggested steps to resolve sync issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {syncStatus.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                        <span className="font-medium">{rec.message}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {rec.action === 'migrate_to_blob' && (
                        <Button
                          onClick={() => handleAction('migrate_to_blob')}
                          disabled={actionLoading}
                          size="sm"
                        >
                          Migrate Now
                        </Button>
                      )}
                      
                      {rec.action === 'resolve_conflicts' && (
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleAction('resolve_conflicts_blob')}
                            disabled={actionLoading}
                            size="sm"
                            variant="outline"
                          >
                            Use Blob Data
                          </Button>
                          <Button
                            onClick={() => handleAction('resolve_conflicts_local')}
                            disabled={actionLoading}
                            size="sm"
                            variant="outline"
                          >
                            Use Local Data
                          </Button>
                        </div>
                      )}
                      
                      {rec.action === 'fix_api' && (
                        <Badge variant="outline">Run: vercel dev</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Actions</CardTitle>
            <CardDescription>
              Additional sync and maintenance operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              
              <Button
                onClick={() => handleAction('force_sync')}
                disabled={actionLoading}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <span className="text-lg">🔄</span>
                <div className="text-center">
                  <div className="font-medium">Force Sync</div>
                  <div className="text-xs text-gray-500">Reload from Blob</div>
                </div>
              </Button>

              <Button
                onClick={() => handleAction('backup_data')}
                disabled={actionLoading}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <span className="text-lg">💾</span>
                <div className="text-center">
                  <div className="font-medium">Backup All</div>
                  <div className="text-xs text-gray-500">Download backups</div>
                </div>
              </Button>

              <Button
                onClick={loadSyncStatus}
                disabled={loading}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <span className="text-lg">🔍</span>
                <div className="text-center">
                  <div className="font-medium">Refresh Status</div>
                  <div className="text-xs text-gray-500">Check again</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        {syncStatus?.isInSync && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center text-green-800">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-semibold">Everything is in sync!</h3>
                <p className="text-sm">Your data is properly synchronized across all storage systems.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SyncManagement; 