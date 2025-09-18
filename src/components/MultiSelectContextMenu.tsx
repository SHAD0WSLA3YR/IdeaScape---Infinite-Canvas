import React, { useState, useEffect } from 'react';
import { Users, UserX, Trash2, Plus, Sparkles, Zap } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface MultiSelectContextMenuProps {
  x: number;
  y: number;
  selectedNodeIds: string[];
  onClose: () => void;
}

export function MultiSelectContextMenu({ x, y, selectedNodeIds, onClose }: MultiSelectContextMenuProps) {
  const { 
    groups, 
    assignNodesToGroup, 
    removeNodesFromGroups, 
    deleteNodes, 
    addGroup,
    summarizeGroup,
    suggestGroupNames 
  } = useCanvasStore();
  
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6');

  // Listen for close all dialogs event
  useEffect(() => {
    const handleCloseAllDialogs = () => {
      setShowNewGroupDialog(false);
      onClose();
    };

    window.addEventListener('closeAllDialogs', handleCloseAllDialogs);
    return () => window.removeEventListener('closeAllDialogs', handleCloseAllDialogs);
  }, [onClose]);

  const handleAssignToExistingGroup = (groupId: string) => {
    assignNodesToGroup(selectedNodeIds, groupId);
    onClose();
  };

  const handleCreateNewGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim(), newGroupColor, selectedNodeIds);
      setNewGroupName('');
      setNewGroupColor('#3b82f6');
      setShowNewGroupDialog(false);
      onClose();
    }
  };

  const handleRemoveFromGroups = () => {
    removeNodesFromGroups(selectedNodeIds);
    onClose();
  };

  const handleDeleteNodes = () => {
    deleteNodes(selectedNodeIds);
    onClose();
  };

  const handleSummarizeGroup = () => {
    summarizeGroup(selectedNodeIds);
    onClose();
  };

  const handleSuggestGroupNames = () => {
    suggestGroupNames(selectedNodeIds);
    onClose();
  };

  const colors = [
    '#3b82f6', // Blue
    '#f87171', // Red/Coral
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
  ];

  return (
    <>
      <div
        className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[200px]"
        style={{
          left: x,
          top: y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1">
          {selectedNodeIds.length} nodes selected
        </div>
        
        {/* Assign to existing group */}
        <div className="px-1">
          <div className="px-2 py-1 text-sm text-gray-600 dark:text-gray-300">
            Assign to Group:
          </div>
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => handleAssignToExistingGroup(group.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: group.color }}
              />
              {group.name}
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

        {/* Create new group */}
        <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
          <DialogTrigger asChild>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
              <Plus className="w-4 h-4" />
              Create New Group
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new group and assign the selected nodes to it. Choose a name and color for your group.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewGroup();
                    }
                  }}
                />
              </div>
              <div>
                <Label>Group Color</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewGroupColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newGroupColor === color 
                          ? 'border-gray-800 dark:border-gray-200' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowNewGroupDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNewGroup}
                  disabled={!newGroupName.trim()}
                >
                  Create Group
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Remove from groups */}
        <button
          onClick={handleRemoveFromGroups}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
        >
          <UserX className="w-4 h-4" />
          Remove from Groups
        </button>

        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

        {/* AI Features */}
        <div className="px-2 py-1 text-sm text-gray-600 dark:text-gray-300">
          AI Assistant:
        </div>
        <button
          onClick={handleSummarizeGroup}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 text-left text-gray-900 dark:text-gray-100"
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          Summarize Selected Nodes
        </button>
        <button
          onClick={handleSuggestGroupNames}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 text-left text-gray-900 dark:text-gray-100"
        >
          <Zap className="w-4 h-4 text-yellow-500" />
          Suggest Group Names
        </button>

        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

        {/* Delete nodes */}
        <button
          onClick={handleDeleteNodes}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-left"
        >
          <Trash2 className="w-4 h-4" />
          Delete Nodes
        </button>
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />
    </>
  );
}