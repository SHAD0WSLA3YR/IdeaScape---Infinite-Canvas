import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useCollaborationStore } from '../stores/collaborationStore';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function CollaborationDebug() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testServerConnection = async () => {
    addResult('🔄 Testing server connection...');
    
    try {
      const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-832115ea`;
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        addResult(`✅ Server connection OK: ${JSON.stringify(result)}`);
      } else {
        addResult(`❌ Server connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      addResult(`❌ Server connection error: ${error}`);
    }
  };

  const testCanvasCreation = async () => {
    addResult('🔄 Testing canvas creation...');
    
    try {
      const { createCollaborativeCanvas } = useCollaborationStore.getState();
      const result = await createCollaborativeCanvas('Debug Test Canvas', { nodes: [], connections: [], groups: [] });
      
      if (result.success) {
        addResult(`✅ Canvas created successfully: ${result.canvasId}`);
        addResult(`🔗 Share URL: ${result.shareUrl}`);
      } else {
        addResult(`❌ Canvas creation failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Canvas creation error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!isVisible) {
    return (
      <Button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50"
        variant="outline"
        size="sm"
      >
        Debug Collaboration
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 w-96 max-h-80 p-4 z-50 bg-white dark:bg-gray-800 border shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Collaboration Debug</h3>
        <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">×</Button>
      </div>
      
      <div className="space-y-2 mb-3">
        <Button onClick={testServerConnection} size="sm" className="w-full">
          Test Server Connection
        </Button>
        <Button onClick={testCanvasCreation} size="sm" className="w-full">
          Test Canvas Creation
        </Button>
        <Button onClick={clearResults} variant="outline" size="sm" className="w-full">
          Clear Results
        </Button>
      </div>

      <div className="text-xs space-y-1 max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 rounded">
        {testResults.length === 0 ? (
          <div className="text-gray-500">No test results yet</div>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="font-mono text-xs break-all">
              {result}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        <div>Project ID: {projectId}</div>
        <div>API Base: https://{projectId}.supabase.co/functions/v1/make-server-832115ea</div>
      </div>
    </Card>
  );
}