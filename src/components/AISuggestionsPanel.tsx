import React from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Loader2, Check, X, Lightbulb, Link, Type, Brain, Info } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import type { ConnectionSuggestion } from '../services/aiService';

export function AISuggestionsPanel() {
  const { 
    aiSuggestions, 
    clearAISuggestions,
    applyConnectionSuggestion,
    dismissConnectionSuggestion,
    nodes
  } = useCanvasStore();

  const { connections, groupSummary, groupNames, isLoading, error } = aiSuggestions;

  // Don't show the panel if there's nothing to display
  if (!isLoading && !error && connections.length === 0 && !groupSummary && groupNames.length === 0) {
    return null;
  }
  
  // Debug logging
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('AISuggestionsPanel render state:', {
      isLoading,
      error,
      connectionsLength: connections.length,
      hasGroupSummary: !!groupSummary,
      groupSummary: groupSummary ? `"${groupSummary.substring(0, 50)}..."` : null,
      groupNamesLength: groupNames.length,
      groupNames
    });
  }

  const getNodeTitle = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.content.title || node?.content.value || 'Untitled Node';
  };

  const handleApplyConnection = (suggestion: ConnectionSuggestion) => {
    applyConnectionSuggestion(suggestion);
  };

  const handleDismissConnection = (suggestion: ConnectionSuggestion) => {
    dismissConnectionSuggestion(suggestion);
  };

  return (
    <Card className="fixed top-20 right-4 w-80 max-h-[calc(100vh-6rem)] z-50 shadow-lg border-2 flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">AI Assistant</CardTitle>
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
              Coming Soon
            </Badge>
            {(connections.length > 0 || groupSummary || groupNames.length > 0) && (
              <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 text-xs">
                {connections.length + (groupSummary ? 1 : 0) + (groupNames.length > 0 ? 1 : 0)} suggestions
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAISuggestions}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {isLoading && (
          <CardDescription className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating AI suggestions...
          </CardDescription>
        )}
        {error && (
          <CardDescription className="text-red-500 break-words">
            {error}
          </CardDescription>
        )}
        {!isLoading && !error && (
          <CardDescription>
            AI-powered suggestions ready
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full px-6 pb-4">
          <div className="space-y-4 pr-2">
            {/* Configuration Notice - Only show if no real suggestions */}
            {!isLoading && !error && connections.length === 0 && !groupSummary && groupNames.length === 0 && (
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs break-words">
                  AI features configured and ready. Use context menu options to generate suggestions.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Group Summary */}
            {groupSummary && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-green-500" />
                  <h4 className="font-medium text-sm">Group Summary</h4>
                </div>
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-3">
                    <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap break-words leading-relaxed">
                      {groupSummary}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Group Name Suggestions */}
            {groupNames.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <h4 className="font-medium text-sm">Group Name Ideas</h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {groupNames.map((name, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-xs break-words"
                      onClick={() => {
                        // Copy to clipboard for easy use
                        navigator.clipboard.writeText(name);
                        // You could also trigger a custom event to suggest this name
                        const event = new CustomEvent('suggestGroupName', { detail: { name } });
                        window.dispatchEvent(event);
                      }}
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click to copy group name suggestions
                </p>
              </div>
            )}

            {/* Connection Suggestions */}
            {connections.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-blue-500" />
                  <h4 className="font-medium text-sm">
                    Connection Suggestions ({connections.length})
                  </h4>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                    Coming Soon
                  </Badge>
                </div>
                <div className="space-y-2">
                  {connections.map((suggestion, index) => (
                    <Card key={index} className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="text-sm">
                            <div className="font-medium text-blue-800 dark:text-blue-200 break-words">
                              "{getNodeTitle(suggestion.nodeId1)}" 
                              <span className="mx-1 text-blue-600">→</span> 
                              "{getNodeTitle(suggestion.nodeId2)}"
                            </div>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 whitespace-pre-wrap break-words leading-relaxed">
                            {suggestion.reason}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleApplyConnection(suggestion)}
                                title="Apply connection"
                              >
                                <Check className="w-3 h-3 text-green-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleDismissConnection(suggestion)}
                                title="Dismiss suggestion"
                              >
                                <X className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Show separator between sections if multiple exist */}
            {((groupSummary ? 1 : 0) + (groupNames.length > 0 ? 1 : 0) + (connections.length > 0 ? 1 : 0)) > 1 && (
              <Separator />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}