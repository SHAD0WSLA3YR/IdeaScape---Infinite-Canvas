import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Keyboard, Save, Plus, Users, Undo2, Redo2, Trash, ChevronUp, ChevronDown, HelpCircle, Search, Copy, Type, Image, Link, Video, MessageCircle, Tag, Sparkles, Wand2 } from 'lucide-react';

export function HelpPanel() {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const shortcuts = [
    {
      category: 'Quick Actions',
      icon: <Plus className="w-4 h-4" />,
      items: [
        { keys: ['N'], description: 'Add new node at center' },
        { keys: ['G'], description: 'Add new group' },
        { keys: ['Delete'], description: 'Delete selected node(s)' },
        { keys: ['Ctrl', 'D'], description: 'Duplicate selected node' },
      ]
    },
    {
      category: 'File Operations',
      icon: <Save className="w-4 h-4" />,
      items: [
        { keys: ['Ctrl', 'Z'], description: 'Undo' },
        { keys: ['Ctrl', 'Y'], description: 'Redo' },
        { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alternative)' },
        { keys: ['Ctrl', 'E'], description: 'Export canvas' },
      ]
    },
    {
      category: 'Navigation & Search',
      icon: <Search className="w-4 h-4" />,
      items: [
        { keys: ['Ctrl', 'F'], description: 'Search nodes' },
        { keys: ['Ctrl', 'G'], description: 'Group selected nodes' },
      ]
    }
  ];

  const mouseControls = [
    'Double-click empty area: Create new node',
    'Click + drag empty area: Select multiple nodes',
    'Click blue dot: Start connection',
    'Click target node: Complete connection',
    'Ctrl+scroll: Zoom in/out (cursor-based)',
    'Middle-click drag: Pan canvas',
    'Right-click: Context menu (node/canvas options)',
    'ESC: Cancel connection or close dialogs'
  ];

  const nodeFeatures = [
    {
      category: 'Content Types',
      icon: <Type className="w-4 h-4" />,
      items: [
        'Text: Rich text editing with formatting',
        'Image: Drag & drop or paste images',
        'Link: Multiple URLs with previews',
        'Video: Drag & drop video files'
      ]
    },
    {
      category: 'Organization',
      icon: <Users className="w-4 h-4" />,
      items: [
        'Groups: Color-coded node organization',
        'Comments: Add contextual notes to nodes',
        'Tags: Searchable labels for categorization',
        'Connections: Link related nodes together'
      ]
    },
    {
      category: 'AI Features',
      icon: <Sparkles className="w-4 h-4" />,
      items: [
        'Summarize Node: AI-powered content summary',
        'Summarize Group: Analyze grouped content',
        'Suggest Connections: Auto-discover relationships',
        'Suggest Group Names: Smart naming suggestions',
        'AI Chat: General assistance and brainstorming'
      ]
    },
    {
      category: 'Smart Features',
      icon: <Wand2 className="w-4 h-4" />,
      items: [
        'Auto-Organize: Force-directed layout algorithm',
        'Auto-Save: Progress saved every 30 seconds',
        'Search: Find nodes by content or tags',
        'Dark/Light Theme: Adaptive interface',
        'Mobile Optimized: Touch-friendly controls'
      ]
    }
  ];

  return (
    <>
      {/* Bottom-left trigger panel */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg text-sm max-w-xs z-40">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors rounded-lg text-gray-900 dark:text-gray-100"
        >
          <div className="flex items-center gap-2">
            <HelpCircle size={16} />
            <span>Help & Controls</span>
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {expanded && (
          <div className="px-3 pb-3">
            <div className="space-y-3">
              {/* Quick controls preview */}
              <div>
                <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">Mouse Controls</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                  <li>• Double-click: Create node</li>
                  <li>• Drag select: Multi-select</li>
                  <li>• Right-click: Context menu</li>
                  <li>• Ctrl+scroll: Zoom to cursor</li>
                </ul>
              </div>
              
              {/* Quick shortcuts preview */}
              <div>
                <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">Quick Keys</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                  <li>• <Badge variant="outline" className="px-1 py-0 text-xs">N</Badge> Add node</li>
                  <li>• <Badge variant="outline" className="px-1 py-0 text-xs">Ctrl</Badge> + <Badge variant="outline" className="px-1 py-0 text-xs">F</Badge> Search</li>
                  <li>• <Badge variant="outline" className="px-1 py-0 text-xs">Ctrl</Badge> + <Badge variant="outline" className="px-1 py-0 text-xs">G</Badge> Group</li>
                </ul>
              </div>
              
              {/* View all button */}
              <button
                onClick={() => setDialogOpen(true)}
                className="w-full mt-2 py-2 px-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-sm transition-colors"
              >
                View All Shortcuts
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full help dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              IdeaScape Help & Controls
            </DialogTitle>
            <DialogDescription>
              Complete guide to using the infinite canvas mind mapping application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* Mouse Controls Section */}
            <div>
              <h3 className="font-medium text-base mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <div className="w-2 h-3 bg-blue-600 dark:bg-blue-400 rounded-sm"></div>
                </div>
                Mouse Controls
              </h3>
              <div className="space-y-2 ml-8">
                {mouseControls.map((control, index) => (
                  <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {control}
                  </div>
                ))}
              </div>
            </div>

            {/* Keyboard Shortcuts Section */}
            <div>
              <h3 className="font-medium text-base mb-3 flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Keyboard Shortcuts
              </h3>
              <div className="space-y-4 ml-7">
                {shortcuts.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center gap-2 mb-2">
                      {category.icon}
                      <h4 className="font-medium text-sm">{category.category}</h4>
                    </div>
                    
                    <div className="space-y-2 ml-6">
                      {category.items.map((shortcut, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{shortcut.description}</span>
                          <div className="flex gap-1">
                            {shortcut.keys.map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
                                  {key}
                                </Badge>
                                {keyIndex < shortcut.keys.length - 1 && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 mx-1">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Node Features Section */}
            <div>
              <h3 className="font-medium text-base mb-3 flex items-center gap-2">
                <Type className="w-5 h-5" />
                Features & Capabilities
              </h3>
              <div className="space-y-4 ml-7">
                {nodeFeatures.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center gap-2 mb-2">
                      {category.icon}
                      <h4 className="font-medium text-sm">{category.category}</h4>
                    </div>
                    
                    <div className="space-y-1 ml-6">
                      {category.items.map((feature, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          • {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded space-y-2">
            <p><strong>Auto-Save:</strong> Your progress is automatically saved every 30 seconds. Work is safe even if you close the page!</p>
            <p><strong>AI Powered:</strong> Use the AI features in context menus to summarize content, suggest connections, and generate group names.</p>
            <p><strong>Mobile Ready:</strong> Touch-optimized interface with gesture support and mobile-specific controls.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}