import React from 'react';
import { Badge } from './ui/badge';
import { useCollaborationStore } from '../stores/collaborationStore';
import { Users, Globe, Wifi, WifiOff } from 'lucide-react';

export function CollaborationStatus() {
  const { 
    isCollaborating, 
    isConnected, 
    currentCanvasId,
    collaborativeCanvas 
  } = useCollaborationStore();

  if (!isCollaborating) return null;

  const participantCount = collaborativeCanvas?.participants?.length || 0;
  const maxParticipants = collaborativeCanvas?.maxParticipants || 2;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border rounded-lg px-3 py-2 shadow-lg">
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-blue-500" />
          <Badge variant="outline" className="text-xs">
            {participantCount}/{maxParticipants}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Globe className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {currentCanvasId?.slice(-8) || 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}