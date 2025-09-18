import React, { useEffect, useState, useCallback, useRef } from 'react';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { Toolbar } from './components/Toolbar';
import { MobileToolbar } from './components/MobileToolbar';
import { MobileActionMenu } from './components/MobileActionMenu';
import { DesktopChatButton } from './components/DesktopChatButton';
import { EditableTitle } from './components/EditableTitle';
import { HelpPanel } from './components/HelpPanel';
import { UserCursors } from './components/UserCursors';
import { CollaborationStatus } from './components/CollaborationStatus';
// import { CollaborationDebug } from './components/CollaborationDebug';
import { useCanvasStore } from './store/canvasStore';
import { useCollaborationStore } from './stores/collaborationStore';
import { useIsMobile } from './components/ui/use-mobile';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { NodeSearchDialog } from './components/NodeSearchDialog';
import { AISuggestionsPanel } from './components/AISuggestionsPanel';

export default function App() {
  // Debug: Log the current URL and path for debugging routing issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🌐 App loaded at:', window.location.href);
      console.log('📍 Pathname:', window.location.pathname);
    }
  }, []);
  const { 
    deleteNode, 
    deleteNodes,
    duplicateNode,
    selectedNodeId, 
    selectedNodeIds,
    undo, 
    redo, 
    exportCanvas,
    importCanvas,
    addNodeAtCenter,
    groupSelectedNodes,
    loadAutoSave,
    autoSave,
    settings,
    setTheme,
    cleanupStorage,
    getStorageInfo,
    setNodes,
    setConnections,
    setGroups
  } = useCanvasStore();

  const {
    isCollaborating,
    joinCanvas,
    updateCanvasData,
    leaveCanvas
  } = useCollaborationStore();

  const isMobile = useIsMobile();
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Handle save export function
  const handleSave = useCallback(() => {
    try {
      const data = exportCanvas();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canvas-${Date.now()}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Canvas exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  }, [exportCanvas]);

  // Open group dialog function
  const openGroupDialog = useCallback(() => {
    // Find and click the Add Group button in the toolbar
    const addGroupButton = document.querySelector('[data-group-dialog-trigger]') as HTMLElement;
    if (addGroupButton && typeof addGroupButton.click === 'function') {
      addGroupButton.click();
    }
  }, []);

  // Handle duplicate node function
  const handleDuplicateNode = useCallback(() => {
    if (selectedNodeId) {
      duplicateNode(selectedNodeId);
    } else if (selectedNodeIds.length === 1) {
      duplicateNode(selectedNodeIds[0]);
    }
  }, [selectedNodeId, selectedNodeIds, duplicateNode]);

  // Auto-save periodically and on page unload
  useEffect(() => {
    let autoSaveToastId: string | number | undefined;
    let quotaErrorCount = 0;
    
    const performAutoSave = () => {
      try {
        autoSave();
        setLastAutoSave(new Date());
        quotaErrorCount = 0; // Reset error count on successful save
        
        // Show subtle auto-save notification (less frequently to reduce performance impact)
        if (autoSaveToastId) {
          toast.dismiss(autoSaveToastId);
        }
        // Only show auto-save toast every 5th save to reduce noise
        if (Math.random() < 0.2) {
          autoSaveToastId = toast.success('Auto-saved', { 
            duration: 1500,
            style: { 
              opacity: 0.7,
              fontSize: '12px'
            }
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          quotaErrorCount++;
          
          if (quotaErrorCount === 1) {
            // First time - show helpful message
            toast.error('Storage space full! Auto-save optimized. Consider exporting your canvas.', {
              duration: 8000,
              action: {
                label: 'Export Now',
                onClick: () => handleSave()
              }
            });
          } else if (quotaErrorCount >= 3) {
            // Multiple failures - show more urgent message
            toast.error('Critical: Unable to auto-save! Please export your work immediately.', {
              duration: 15000,
              action: {
                label: 'Export Canvas',
                onClick: () => handleSave()
              }
            });
          }
        } else {
          console.error('Auto-save failed:', error);
        }
      }
    };
    
    const autoSaveInterval = setInterval(performAutoSave, 30000); // Auto-save every 30 seconds

    const handleBeforeUnload = () => {
      try {
        autoSave();
      } catch (error) {
        // Silent failure on page unload - user is already leaving
        console.warn('Auto-save failed on page unload:', error);
      }
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      clearInterval(autoSaveInterval);
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
      if (autoSaveToastId) {
        toast.dismiss(autoSaveToastId);
      }
    };
  }, [autoSave, handleSave]);

  // Load auto-save on app start and perform storage maintenance
  useEffect(() => {
    // Wrap in setTimeout to avoid blocking initial render
    setTimeout(() => {
      try {
        const didLoadAutoSave = loadAutoSave();
        if (didLoadAutoSave) {
          toast.success('Previous work restored from auto-save');
        }
        
        // Cleanup storage on app start (async)
        setTimeout(() => {
          try {
            cleanupStorage();
            
            // Check storage usage and warn if high (non-blocking)
            const storageInfo = getStorageInfo();
            const usagePercent = (storageInfo.used / storageInfo.total) * 100;
            
            if (usagePercent > 80) {
              toast.warning(`Storage ${usagePercent.toFixed(0)}% full. Consider exporting your work.`, {
                duration: 5000,
                action: {
                  label: 'Export',
                  onClick: () => handleSave()
                }
              });
            }
          } catch (error) {
            console.warn('Storage cleanup/check failed:', error);
          }
        }, 1000);
      } catch (error) {
        console.warn('Auto-save load failed:', error);
      }
    }, 100);
  }, [loadAutoSave, cleanupStorage, getStorageInfo, handleSave]);

  // Initialize theme on app start
  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  // Handle URL-based canvas sharing (DISABLED FOR DEMO)
  useEffect(() => {
    // Demo mode: Disable URL-based collaboration routing
    console.log('🎭 Demo Mode: Collaboration URL routing disabled');
    
    // Just ensure title is set correctly
    document.title = 'IdeaScape';
  }, []);

  // Listen for real-time canvas updates from other users (DISABLED FOR DEMO)
  useEffect(() => {
    // Demo mode: Disable real-time collaboration events
    console.log('🎭 Demo Mode: Real-time collaboration events disabled');
  }, []);

  // Get current canvas state for sync
  const { nodes, connections, groups } = useCanvasStore();

  // Sync local changes to collaborative canvas (DISABLED FOR DEMO)
  useEffect(() => {
    // Demo mode: Disable canvas sync
    if (isCollaborating) {
      console.log('🎭 Demo Mode: Canvas sync disabled');
    }
  }, [isCollaborating]);

  // Clean up collaboration on page unload (DISABLED FOR DEMO)
  useEffect(() => {
    // Demo mode: Disable collaboration cleanup
    console.log('🎭 Demo Mode: Collaboration cleanup disabled');
  }, []);

  // Listen for search dialog open events from context menu
  useEffect(() => {
    const handleOpenSearch = () => {
      setSearchOpen(true);
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('openNodeSearch', handleOpenSearch);
      return () => {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          window.removeEventListener('openNodeSearch', handleOpenSearch);
        }
      };
    }
  }, []);

  // Listen for group dialog open events from keyboard shortcut
  useEffect(() => {
    const handleOpenGroupDialog = (event: CustomEvent) => {
      try {
        const nodeIds = event.detail?.nodeIds || [];
        if (nodeIds.length > 1) {
          // For multiple nodes, show the multi-select context menu
          // We'll dispatch a custom event to open the multi-select context menu
          const multiSelectEvent = new CustomEvent('showMultiSelectContextMenu', {
            detail: { nodeIds }
          });
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(multiSelectEvent);
          }
        } else {
          // For single/no nodes, show the regular group dialog
          openGroupDialog();
        }
      } catch (error) {
        console.warn('Error handling group dialog event:', error);
      }
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('openGroupDialog', handleOpenGroupDialog);
      return () => {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          window.removeEventListener('openGroupDialog', handleOpenGroupDialog);
        }
      };
    }
  }, [openGroupDialog]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        // Prevent shortcuts when typing in input fields
        const target = e.target as HTMLElement;
        const isInputField = target?.tagName === 'INPUT' || 
                            target?.tagName === 'TEXTAREA' || 
                            target?.contentEditable === 'true';

        if (isInputField) {
          // Only allow Delete key for selected nodes when not in input
          if (e.key === 'Delete') {
            if (selectedNodeIds.length > 1) {
              deleteNodes(selectedNodeIds);
            } else if (selectedNodeId) {
              deleteNode(selectedNodeId);
            }
          }
          return;
        }

        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case 'z':
              e.preventDefault();
              if (e.shiftKey) {
                redo(); // Ctrl+Shift+Z for redo
              } else {
                undo(); // Ctrl+Z for undo
              }
              break;
            case 'y':
              e.preventDefault();
              redo(); // Ctrl+Y for redo
              break;
            case 'e':
              e.preventDefault();
              handleSave(); // Ctrl+E for save
              break;
            case 'f':
              e.preventDefault();
              setSearchOpen(true); // Ctrl+F for quick search
              break;
            case 'g':
              e.preventDefault();
              if (selectedNodeIds.length > 0 || selectedNodeId) {
                groupSelectedNodes(); // Ctrl+G for group selected nodes
              } else {
                openGroupDialog(); // Ctrl+G for add group when nothing selected
              }
              break;
            case 'd':
              e.preventDefault();
              handleDuplicateNode(); // Ctrl+D for duplicate node
              break;
          }
        } else {
          switch (e.key.toLowerCase()) {
            case 'n':
              e.preventDefault();
              addNodeAtCenter(); // N for add node at center
              toast.success('New node added');
              break;
            case 'g':
              e.preventDefault();
              openGroupDialog(); // G for add group
              break;
            case 'delete':
              if (selectedNodeIds.length > 1) {
                deleteNodes(selectedNodeIds);
                toast.success(`${selectedNodeIds.length} nodes deleted`);
              } else if (selectedNodeId) {
                deleteNode(selectedNodeId);
                toast.success('Node deleted');
              }
              break;
          }
        }
      } catch (error) {
        console.warn('Error in keyboard shortcut handler:', error);
      }
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        if (typeof document !== 'undefined' && document.removeEventListener) {
          document.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [deleteNode, deleteNodes, selectedNodeId, selectedNodeIds, undo, redo, handleSave, addNodeAtCenter, openGroupDialog, groupSelectedNodes, handleDuplicateNode, setSearchOpen]);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gray-100 dark:bg-gray-900" ref={canvasContainerRef} data-infinite-canvas>
      <InfiniteCanvas />
      
      {/* Real-time collaboration user cursors */}
      <UserCursors containerRef={canvasContainerRef} />
      
      {/* Collaboration status indicator */}
      <CollaborationStatus />
      
      {/* Conditional rendering based on mobile detection */}
      {isMobile ? (
        <>
          <MobileToolbar />
          <MobileActionMenu />
        </>
      ) : (
        <>
          <Toolbar />
          <EditableTitle />
          <DesktopChatButton />
        </>
      )}
      
      {!isMobile && <HelpPanel />}
      <NodeSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <AISuggestionsPanel />
      {/* <CollaborationDebug /> */}
      <Toaster position={isMobile ? "top-center" : "bottom-right"} />
    </div>
  );
}