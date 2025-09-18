import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useCollaborationStore } from '../stores/collaborationStore';
import { Users, Share, UserCheck, UserX, Wifi, WifiOff, Crown, Eye } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  canvasData?: {
    nodes: any[];
    connections: any[];
    groups: any[];
  };
}

export function CollaborationPanel({ isOpen, onClose, canvasData }: CollaborationPanelProps) {
  const [canvasName, setCanvasName] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const {
    isConnected,
    isCollaborating,
    currentCanvasId,
    participants,
    createCollaborativeCanvas,
    joinCanvas,
    leaveCanvas,
    getShareableUrl,
    getOtherParticipants,
    getCurrentUser
  } = useCollaborationStore();

  // Create a new collaborative canvas (Demo Mode)
  const handleCreateCanvas = async () => {
    if (!canvasName.trim()) {
      toast.error('Please enter a canvas name');
      return;
    }

    setIsCreating(true);
    
    try {
      // Demo mode: Show success message without creating actual collaboration
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate loading
      
      toast.success('Demo: Collaborative canvas simulated!', {
        description: 'This is a preview of the collaboration feature',
        duration: 5000
      });
      
      // For demo purposes, show the panel as if collaboration started
      setShareUrl('https://ideascape.app/canvas/demo-collaboration-url');
      
    } catch (error) {
      console.error('Demo error:', error);
      toast.error('Demo simulation failed');
    } finally {
      setIsCreating(false);
    }
  };



  // Leave the current collaborative session
  const handleLeaveCanvas = async () => {
    try {
      await leaveCanvas();
      setShareUrl('');
      setCanvasName('');
      toast.success('Left collaborative session');
    } catch (error) {
      console.error('Error leaving canvas:', error);
      toast.error('Failed to leave session');
    }
  };

  // Get current user info
  const currentUser = getCurrentUser();
  const otherParticipants = getOtherParticipants();

  // Update canvas name when dialog opens
  useEffect(() => {
    if (isOpen && !canvasName) {
      const timestamp = new Date().toLocaleString();
      setCanvasName(`Mind Map - ${timestamp}`);
    }
  }, [isOpen]);

  // Update share URL when canvas ID changes
  useEffect(() => {
    if (currentCanvasId) {
      setShareUrl(getShareableUrl(currentCanvasId));
    }
  }, [currentCanvasId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Real-time Collaboration
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
              Coming Soon
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {isCollaborating 
              ? 'You\'re currently in a collaborative session. Share the URL to invite others.'
              : 'Create a shareable canvas for real-time collaboration with up to 2 people.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <Card className="border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Offline</span>
                  </>
                )}
                
                {isCollaborating && (
                  <Badge variant="secondary" className="ml-auto">
                    Collaborating
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Session Info */}
          {isCollaborating && currentCanvasId ? (
            <div className="space-y-4">
              {/* Participants */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Participants ({participants.length}/2)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.userId} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: participant.color }}
                      />
                      <span className="flex-1">{participant.userName}</span>
                      {participant.userId === currentUser?.userId ? (
                        <Badge variant="outline" size="sm">
                          <Crown className="w-3 h-3 mr-1" />
                          You
                        </Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          Online
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  {participants.length < 2 && (
                    <div className="text-sm text-gray-500 italic">
                      {2 - participants.length} spot{2 - participants.length !== 1 ? 's' : ''} available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Share URL */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Share className="w-4 h-4" />
                    Share URL
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Input
                      id="share-url-input"
                      value={isCollaborating ? "https://ideascape.app/canvas/demo-collaboration-url" : ""}
                      readOnly
                      className="text-xs select-all font-mono"
                      placeholder="Demo URL will appear here when collaboration starts..."
                      onClick={(e) => {
                        // Auto-select text when clicked for easy manual copying
                        (e.target as HTMLInputElement).select();
                      }}
                    />
                    {isCollaborating && (
                      <div className="text-xs text-muted-foreground">
                        🎭 Demo Mode: This is a preview URL for demonstration purposes
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Share this URL with others to invite them to collaborate on your canvas.
                  </p>
                </CardContent>
              </Card>

              {/* Leave Session */}
              <Button
                variant="outline"
                onClick={handleLeaveCanvas}
                className="w-full"
              >
                <UserX className="w-4 h-4 mr-2" />
                Leave Session
              </Button>
            </div>
          ) : (
            // Create New Session
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Canvas Name</label>
                <Input
                  value={canvasName}
                  onChange={(e) => setCanvasName(e.target.value)}
                  placeholder="Enter a name for your collaborative canvas..."
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleCreateCanvas}
                disabled={isCreating || !canvasName.trim()}
                className="w-full"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {isCreating ? 'Creating...' : 'Create Collaborative Canvas'}
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Maximum 2 people can collaborate simultaneously</p>
                <p>• All participants can edit nodes, connections, and groups</p>
                <p>• Changes are synchronized in real-time</p>
                <p>• Your current canvas will be shared with collaborators</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}