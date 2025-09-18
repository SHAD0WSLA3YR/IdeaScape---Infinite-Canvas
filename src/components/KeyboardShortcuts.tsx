import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Keyboard, Save, Plus, Users, Undo2, Redo2, Trash, ChevronUp, ChevronDown, HelpCircle } from 'lucide-react';

interface HelpPanelProps {
  // No props needed - this will be self-contained
}

export function HelpPanel() {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const shortcuts = [
    {
      category: 'Quick Actions',
      icon: <Keyboard className="w-4 h-4" />,
      items: [
        { keys: ['N'], description: 'Add new node at center' },
        { keys: ['G'], description: 'Add new group' },
        { keys: ['Delete'], description: 'Delete selected node' },
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
    }
  ];

  const mouseControls = [
    'Double-click: Create node',
    'Click blue dot: Start connection',
    'Click target node: Complete connection',
    'Ctrl+scroll: Zoom in/out',
    'Middle-click drag: Pan canvas',
    'Right-click: Context menu',
    'ESC: Cancel connection'
  ];

  return (
    <>
      {/* Bottom-left trigger panel */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg text-sm max-w-xs z-40">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-white/50 transition-colors rounded-lg"
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
                <h4 className="font-medium text-xs text-gray-800 mb-1">Mouse Controls</h4>
                <ul className="space-y-1 text-gray-600 text-xs">
                  <li>• Double-click: Create node</li>
                  <li>• Right-click: Context menu</li>
                  <li>• Ctrl+scroll: Zoom</li>
                </ul>
              </div>
              
              {/* Quick shortcuts preview */}
              <div>
                <h4 className="font-medium text-xs text-gray-800 mb-1">Quick Keys</h4>
                <ul className="space-y-1 text-gray-600 text-xs">
                  <li>• <Badge variant="outline" className="px-1 py-0 text-xs">N</Badge> Add node</li>
                  <li>• <Badge variant="outline" className="px-1 py-0 text-xs">Ctrl</Badge> + <Badge variant="outline" className="px-1 py-0 text-xs">Z</Badge> Undo</li>
                </ul>
              </div>
              
              {/* View all button */}
              <button
                onClick={() => setDialogOpen(true)}
                className="w-full mt-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs transition-colors"
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
              Help & Controls
            </DialogTitle>
            <DialogDescription>
              Complete guide to using the mind mapping canvas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Mouse Controls Section */}
            <div>
              <h3 className="font-medium text-base mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-3 bg-blue-600 rounded-sm"></div>
                </div>
                Mouse Controls
              </h3>
              <div className="space-y-2 ml-8">
                {mouseControls.map((control, index) => (
                  <div key={index} className="text-sm text-gray-600">
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
                          <span className="text-sm text-gray-600">{shortcut.description}</span>
                          <div className="flex gap-1">
                            {shortcut.keys.map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                <Badge variant="outline" className="px-2 py-1 text-xs font-mono">
                                  {key}
                                </Badge>
                                {keyIndex < shortcut.keys.length - 1 && (
                                  <span className="text-xs text-gray-400 mx-1">+</span>
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
          </div>

          <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
            <p><strong>Tip:</strong> The canvas auto-saves your progress every 30 seconds. Your work is safe even if you accidentally close the page!</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}