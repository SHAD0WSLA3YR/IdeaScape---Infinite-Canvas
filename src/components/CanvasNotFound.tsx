import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertTriangle, Home, Users } from 'lucide-react';

interface CanvasNotFoundProps {
  canvasId?: string;
  onCreateNew?: () => void;
  onGoHome?: () => void;
}

export function CanvasNotFound({ canvasId, onCreateNew, onGoHome }: CanvasNotFoundProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Canvas Not Found</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The collaborative canvas you're trying to access doesn't exist or is no longer available.
          </p>
          {canvasId && (
            <p className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
              Canvas ID: {canvasId}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Button onClick={onCreateNew} className="w-full" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Create New Collaborative Canvas
          </Button>
          
          <Button onClick={onGoHome} variant="outline" className="w-full" size="sm">
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>Possible reasons:</p>
          <ul className="text-left space-y-1">
            <li>• Canvas was deleted by creator</li>
            <li>• Link has expired</li>
            <li>• Canvas reached participant limit</li>
            <li>• Network connection issues</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}