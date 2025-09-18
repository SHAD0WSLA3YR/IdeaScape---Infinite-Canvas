import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Search, MessageCircle } from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import { NodeSearchDialog } from './NodeSearchDialog';
import { ChatDialog } from './ChatDialog';
import { toast } from 'sonner@2.0.3';

export function MobileActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { addNodeAtCenter, groups, addNodeToGroup } = useCanvasStore();
  
  // Get the last used group or default to first group
  const lastUsedGroup = useMemo(() => {
    return groups.length > 0 ? groups[groups.length - 1] : null;
  }, [groups]);

  const handleAddNode = () => {
    const newNodeId = addNodeAtCenter();
    
    // Add to last used group if available
    if (lastUsedGroup) {
      addNodeToGroup(newNodeId, lastUsedGroup.id);
      toast.success(`Node added to ${lastUsedGroup.name}`);
    } else {
      toast.success('Node added');
    }
    setIsOpen(false);
  };

  const handleCreateGroup = () => {
    // Find and click the Add Group button in the toolbar
    const addGroupButton = document.querySelector('[data-group-dialog-trigger]') as HTMLElement;
    if (addGroupButton) {
      addGroupButton.click();
    }
    setIsOpen(false);
  };

  const handleOpenSearch = () => {
    setSearchOpen(true);
    setIsOpen(false);
  };

  const handleOpenChat = () => {
    setChatOpen(true);
    setIsOpen(false);
  };

  const actions = [
    {
      icon: Plus,
      label: 'Add Note',
      onClick: handleAddNode,
      color: 'bg-blue-500',
    },
    {
      icon: Search,
      label: 'Search',
      onClick: handleOpenSearch,
      color: 'bg-purple-500',
    },
    {
      icon: Users,
      label: 'Create Group',
      onClick: handleCreateGroup,
      color: 'bg-green-500',
    },
    {
      icon: MessageCircle,
      label: 'AI Chat',
      onClick: handleOpenChat,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main button */}
      <motion.button
        className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Scrollable list menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={action.onClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className={`w-8 h-8 ${action.color} text-white rounded-full flex items-center justify-center flex-shrink-0`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <NodeSearchDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen} 
      />
      
      <ChatDialog 
        open={chatOpen} 
        onOpenChange={setChatOpen} 
      />
    </div>
  );
}