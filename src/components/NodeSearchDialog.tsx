import React, { useState, useMemo, useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Search, Calendar, Eye, MapPin, Tag } from 'lucide-react';

interface NodeSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NodeSearchDialog({ open, onOpenChange }: NodeSearchDialogProps) {
  const { nodes, setViewport, selectNode, clearSelection } = useCanvasStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Listen for close all dialogs event
  useEffect(() => {
    const handleCloseAllDialogs = () => {
      onOpenChange(false);
    };

    window.addEventListener('closeAllDialogs', handleCloseAllDialogs);
    return () => window.removeEventListener('closeAllDialogs', handleCloseAllDialogs);
  }, [onOpenChange]);

  // Search nodes by content including tags
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return nodes.filter(node => {
      const content = node.content.value?.toLowerCase() || '';
      const title = node.content.title?.toLowerCase() || '';
      const links = node.content.links?.map(link => 
        `${link.title.toLowerCase()} ${link.url.toLowerCase()}`
      ).join(' ') || '';
      const tags = node.tags?.join(' ').toLowerCase() || '';
      const comment = node.comment?.toLowerCase() || '';
      
      return content.includes(query) || 
             title.includes(query) || 
             links.includes(query) ||
             tags.includes(query) ||
             comment.includes(query);
    });
  }, [nodes, searchQuery]);

  // Group nodes by date
  const nodesByDate = useMemo(() => {
    const grouped = new Map<string, typeof nodes>();
    
    nodes.forEach(node => {
      const date = node.createdAt ? new Date(node.createdAt).toISOString().split('T')[0] : 'unknown';
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(node);
    });

    // Sort dates in descending order (most recent first)
    const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
      if (a[0] === 'unknown') return 1;
      if (b[0] === 'unknown') return -1;
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    });

    return sortedEntries;
  }, [nodes]);

  // Filter nodes by selected date
  const dateFilteredNodes = useMemo(() => {
    if (!selectedDate) return [];
    
    return nodes.filter(node => {
      if (!node.createdAt) return selectedDate === 'unknown';
      return new Date(node.createdAt).toISOString().split('T')[0] === selectedDate;
    });
  }, [nodes, selectedDate]);

  const handleNodeClick = (node: any) => {
    // Clear any existing selection
    clearSelection();
    
    // Select the clicked node
    selectNode(node.id);
    
    // Center the viewport on the node
    setViewport({
      x: -node.x + window.innerWidth / 2,
      y: -node.y + window.innerHeight / 2,
      scale: 1
    });
    
    // Close the dialog
    onOpenChange(false);
  };

  const formatNodeContent = (node: any) => {
    const content = node.content.value || 'Empty node';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  const getNodePreview = (node: any) => {
    const hasImages = node.content.images && node.content.images.length > 0;
    const hasVideos = node.content.videos && node.content.videos.length > 0;
    const hasLinks = node.content.links && node.content.links.length > 0;
    const contentType = hasVideos ? 'Video' : hasImages ? 'Image' : hasLinks ? 'Link' : 'Text';
    
    return {
      type: contentType,
      preview: formatNodeContent(node)
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col transition-all duration-300 ease-in-out">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Nodes
          </DialogTitle>
          <DialogDescription>
            Search through your nodes by content or browse by creation date
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="search" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 transition-all duration-300">
            <TabsTrigger value="search" className="flex items-center gap-2 transition-all duration-200">
              <Search className="w-4 h-4" />
              Search by Content
            </TabsTrigger>
            <TabsTrigger value="date" className="flex items-center gap-2 transition-all duration-200">
              <Calendar className="w-4 h-4" />
              Browse by Date
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="flex-1 flex flex-col space-y-4 transition-all duration-300 ease-in-out">
            <Input
              placeholder="Search nodes by content, title, or links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full transition-all duration-200"
            />

            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-2 pr-4">
                {searchQuery.trim() === '' ? (
                  <div className="text-center text-muted-foreground py-8">
                    Enter a search term to find nodes
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No nodes found matching "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map(node => {
                    const { type, preview } = getNodePreview(node);
                    const createdDate = node.createdAt ? new Date(node.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date';
                    
                    return (
                      <div
                        key={node.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 ease-in-out hover:transform hover:scale-[1.01] hover:shadow-sm"
                        onClick={() => handleNodeClick(node)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {createdDate}
                              </span>
                            </div>
                            <p className="text-sm text-foreground overflow-hidden" style={{ 
                              display: '-webkit-box', 
                              WebkitLineClamp: 2, 
                              WebkitBoxOrient: 'vertical' 
                            }}>
                              {preview}
                            </p>
                            {node.content.links && node.content.links.length > 0 && (
                              <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                {node.content.links.length} link{node.content.links.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          <Button size="sm" variant="ghost" className="shrink-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {searchResults.length > 0 && (
              <div className="text-xs text-muted-foreground text-center">
                Found {searchResults.length} node{searchResults.length > 1 ? 's' : ''}
              </div>
            )}
          </TabsContent>

          <TabsContent value="date" className="flex-1 flex flex-col space-y-4 transition-all duration-300 ease-in-out">
            <div className="grid grid-cols-2 gap-4 transition-all duration-300">
              <ScrollArea className="h-64 border rounded transition-all duration-200">
                <div className="p-2 space-y-1">
                  <h4 className="text-sm font-medium mb-2 px-2">Dates</h4>
                  {nodesByDate.map(([date, dateNodes]) => {
                    const displayDate = date === 'unknown' ? 'Unknown Date' : new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const isSelected = selectedDate === date;
                    
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(isSelected ? '' : date)}
                        className={`w-full text-left px-2 py-1 rounded text-sm transition-all duration-200 ease-in-out ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground transform scale-[1.02]' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:transform hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{displayDate}</span>
                          <Badge variant="secondary" className="text-xs">
                            {dateNodes.length}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              <ScrollArea className="h-64 border rounded transition-all duration-200">
                <div className="p-2 space-y-2">
                  <h4 className="text-sm font-medium mb-2 transition-all duration-200">
                    {selectedDate ? (
                      selectedDate === 'unknown' ? 'Unknown Date' : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    ) : (
                      'Select a date'
                    )}
                  </h4>
                  {selectedDate === '' ? (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                      Select a date to view nodes
                    </div>
                  ) : (
                    dateFilteredNodes.map(node => {
                      const { type, preview } = getNodePreview(node);
                      
                      return (
                        <div
                          key={node.id}
                          className="border rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 ease-in-out hover:transform hover:scale-[1.02] hover:shadow-sm"
                          onClick={() => handleNodeClick(node)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <Badge variant="secondary" className="text-xs mb-1">
                                {type}
                              </Badge>
                              <p className="text-xs text-foreground overflow-hidden" style={{ 
                                display: '-webkit-box', 
                                WebkitLineClamp: 2, 
                                WebkitBoxOrient: 'vertical' 
                              }}>
                                {preview}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" className="shrink-0 h-6 w-6 p-0">
                              <MapPin className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {selectedDate && dateFilteredNodes.length > 0 && (
              <div className="text-xs text-muted-foreground text-center">
                {dateFilteredNodes.length} node{dateFilteredNodes.length > 1 ? 's' : ''} created on{' '}
                {selectedDate === 'unknown' ? 'unknown date' : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}