import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useIsMobile } from './ui/use-mobile';
import { CanvasNode } from './CanvasNode';
import { Connection } from './Connection';
import { ContextMenu } from './ContextMenu';
import { MultiSelectContextMenu } from './MultiSelectContextMenu';
import { MobileRichTextEditor } from './MobileRichTextEditor';
import { Maximize2, Plus, Minus, Undo, Redo } from 'lucide-react';

export function InfiniteCanvas() {
  const {
    nodes,
    connections,
    transform,
    selectedNodeId,
    selectedNodeIds,
    selectionBox,
    isConnecting,
    connectingFromNodeId,
    highlightedGroupId,
    addNode,
    selectNode,
    setTransform,
    addConnection,
    setConnecting,
    fitToScreen,
    zoomIn,
    zoomOut,
    startSelectionBox,
    updateSelectionBox,
    endSelectionBox,
    clearSelection,
    setHighlightedGroup,
    undo,
    redo,
    history,
  } = useCanvasStore();

  const isMobile = useIsMobile();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string; canvasPosition?: { x: number; y: number } } | null>(null);
  const [multiSelectContextMenu, setMultiSelectContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [connectingFromPoint, setConnectingFromPoint] = useState<string>('center');
  const [previewConnection, setPreviewConnection] = useState<{ x: number; y: number } | null>(null);
  
  // Mobile-specific state
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mobileRichTextVisible, setMobileRichTextVisible] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    return {
      x: (screenX - rect.left - transform.x) / transform.scale,
      y: (screenY - rect.top - transform.y) / transform.scale,
    };
  }, [transform]);

  // Get connection point coordinates for a node
  const getConnectionPoint = useCallback((node: any, point: string) => {
    switch (point) {
      case 'top':
        return { x: node.x + node.width / 2, y: node.y };
      case 'right':
        return { x: node.x + node.width, y: node.y + node.height / 2 };
      case 'bottom':
        return { x: node.x + node.width / 2, y: node.y + node.height };
      case 'left':
        return { x: node.x, y: node.y + node.height / 2 };
      default:
        return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
    }
  }, []);

  // Determine the best connection point on target node based on source connection point
  const getBestTargetConnectionPoint = useCallback((sourceNode: any, targetNode: any, sourcePoint: string) => {
    const sourceCenterX = sourceNode.x + sourceNode.width / 2;
    const sourceCenterY = sourceNode.y + sourceNode.height / 2;
    const targetCenterX = targetNode.x + targetNode.width / 2;
    const targetCenterY = targetNode.y + targetNode.height / 2;

    // Calculate relative position
    const deltaX = targetCenterX - sourceCenterX;
    const deltaY = targetCenterY - sourceCenterY;

    // If using a specific source point, try to use the opposite point on target
    if (sourcePoint === 'right' && deltaX > 0) return 'left';
    if (sourcePoint === 'left' && deltaX < 0) return 'right';
    if (sourcePoint === 'bottom' && deltaY > 0) return 'top';
    if (sourcePoint === 'top' && deltaY < 0) return 'bottom';

    // Otherwise, choose based on the strongest directional difference
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'left' : 'right';
    } else {
      return deltaY > 0 ? 'top' : 'bottom';
    }
  }, []);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Get mouse position relative to canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom delta
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(3, transform.scale * delta));
      
      // Calculate the world coordinates of the mouse position before zoom
      const worldMouseX = (mouseX - transform.x) / transform.scale;
      const worldMouseY = (mouseY - transform.y) / transform.scale;
      
      // Calculate new transform to keep the world point under the mouse
      const newX = mouseX - worldMouseX * newScale;
      const newY = mouseY - worldMouseY * newScale;

      setTransform({ x: newX, y: newY, scale: newScale });
    } else {
      // Pan
      setTransform({
        x: transform.x - e.deltaX,
        y: transform.y - e.deltaY,
      });
    }
  }, [transform, setTransform]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setContextMenu(null);
    setMultiSelectContextMenu(null);

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+left mouse for panning
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    } else if (e.button === 0 && !isConnecting) {
      // Left mouse - start selection or deselect
      const target = e.target as HTMLElement;
      const isCanvasBackground = target === canvasRef.current || 
                                target.classList.contains('canvas-background');
      
      if (isCanvasBackground && !target.closest('[data-canvas-node]')) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setIsSelecting(true);
        startSelectionBox(canvasPos.x, canvasPos.y);
        // Clear existing selection
        if (selectedNodeId || selectedNodeIds.length > 0) {
          clearSelection();
        }
      }
    } else if (e.button === 0 && isConnecting) {
      // If in connecting mode and clicking on empty space, cancel connection
      if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
        setConnecting(false);
        setConnectingFromPoint('center');
        setPreviewConnection(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTransform({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }

    if (isSelecting && selectionBox.isActive) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      updateSelectionBox(canvasPos.x, canvasPos.y);
    }

    if (isConnecting && connectingFromNodeId) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setPreviewConnection(canvasPos);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isSelecting) {
      if (selectionBox.isActive) {
        endSelectionBox();
      }
      setIsSelecting(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Check if we're clicking on the canvas background (not on a node)
    const target = e.target as HTMLElement;
    const isCanvasBackground = target === canvasRef.current || 
                              target.classList.contains('canvas-background');
    
    if (isCanvasBackground && !isConnecting) {
      e.preventDefault();
      e.stopPropagation();
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      addNode(canvasPos.x, canvasPos.y);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Cancel connection mode if active
    if (isConnecting) {
      setConnecting(false);
      setConnectingFromPoint('center');
      setPreviewConnection(null);
      return;
    }

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    
    // Check if right-clicking on a node
    const target = e.target as HTMLElement;
    const nodeElement = target.closest('[data-canvas-node]');
    const nodeId = nodeElement?.getAttribute('data-node-id');
    
    // Check if we have multiple nodes selected and are right-clicking in empty space
    if (selectedNodeIds.length > 1 && !nodeId) {
      setMultiSelectContextMenu({ x: e.clientX, y: e.clientY });
      return;
    }
    
    setContextMenu({ 
      x: e.clientX, 
      y: e.clientY, 
      nodeId: nodeId || undefined,
      canvasPosition: nodeId ? undefined : canvasPos
    });
  };

  const handleStartConnection = (nodeId: string, connectionPoint: string) => {
    setConnecting(true, nodeId);
    setConnectingFromPoint(connectionPoint);
  };

  const handleCompleteConnection = (targetNodeId: string) => {
    if (isConnecting && connectingFromNodeId && connectingFromNodeId !== targetNodeId) {
      const sourceNode = nodes.find(n => n.id === connectingFromNodeId);
      const targetNode = nodes.find(n => n.id === targetNodeId);

      if (sourceNode && targetNode) {
        const targetPoint = getBestTargetConnectionPoint(sourceNode, targetNode, connectingFromPoint);
        addConnection(connectingFromNodeId, targetNodeId, connectingFromPoint, targetPoint);
      }

      setConnecting(false);
      setConnectingFromPoint('center');
      setPreviewConnection(null);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (isConnecting && connectingFromNodeId && connectingFromNodeId !== nodeId) {
      handleCompleteConnection(nodeId);
    } else if (!isConnecting) {
      selectNode(nodeId);
      // Clear multi-selection when selecting a single node
      if (selectedNodeIds.length > 1) {
        clearSelection();
        selectNode(nodeId);
      }
    }
  };

  const handleFitToScreen = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      fitToScreen({ width: rect.width, height: rect.height });
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    
    // Handle different types of dropped content
    if (e.dataTransfer.files.length > 0) {
      // Handle file drops (images)
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          addNode(canvasPos.x, canvasPos.y);
          // Update the newly created node with image content
          const newNodes = useCanvasStore.getState().nodes;
          const newNode = newNodes[newNodes.length - 1];
          if (newNode) {
            useCanvasStore.getState().updateNode(newNode.id, {
              content: {
                type: 'image',
                value: imageUrl,
                title: file.name.replace(/\.[^/.]+$/, "")
              }
            });
          }
        };
        reader.readAsDataURL(file);
      }
    } else if (e.dataTransfer.getData('text/plain')) {
      // Handle text/link drops
      const droppedText = e.dataTransfer.getData('text/plain');
      
      // Check if it's a URL
      const urlPattern = /^(https?:\/\/|www\.)/i;
      if (urlPattern.test(droppedText)) {
        // Extract domain name for title
        try {
          const url = droppedText.startsWith('http') ? droppedText : `https://${droppedText}`;
          const domain = new URL(url).hostname.replace('www.', '');
          
          addNode(canvasPos.x, canvasPos.y);
          const newNodes = useCanvasStore.getState().nodes;
          const newNode = newNodes[newNodes.length - 1];
          if (newNode) {
            useCanvasStore.getState().updateNode(newNode.id, {
              content: {
                type: 'link',
                value: url,
                title: domain,
                links: [{ url: url, title: domain }]
              }
            });
          }
        } catch {
          // If URL parsing fails, treat as text
          addNode(canvasPos.x, canvasPos.y);
          const newNodes = useCanvasStore.getState().nodes;
          const newNode = newNodes[newNodes.length - 1];
          if (newNode) {
            useCanvasStore.getState().updateNode(newNode.id, {
              content: {
                type: 'text',
                value: droppedText,
                title: droppedText.substring(0, 50) + (droppedText.length > 50 ? '...' : '')
              }
            });
          }
        }
      } else {
        // Regular text
        addNode(canvasPos.x, canvasPos.y);
        const newNodes = useCanvasStore.getState().nodes;
        const newNode = newNodes[newNodes.length - 1];
        if (newNode) {
          useCanvasStore.getState().updateNode(newNode.id, {
            content: {
              type: 'text',
              value: droppedText,
              title: droppedText.substring(0, 50) + (droppedText.length > 50 ? '...' : '')
            }
          });
        }
      }
    }
  };

  // Mobile touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    const target = e.target as HTMLElement;
    const nodeElement = target.closest('[data-canvas-node]');
    
    setContextMenu(null);
    setMultiSelectContextMenu(null);
    setDragStartPos({ x: touch.clientX, y: touch.clientY });

    if (nodeElement) {
      // Start long press detection for context menu
      const timeout = setTimeout(() => {
        setIsLongPressing(true);
        const nodeId = nodeElement.getAttribute('data-node-id');
        if (nodeId) {
          setContextMenu({ 
            x: touch.clientX, 
            y: touch.clientY, 
            nodeId 
          });
        }
      }, 500); // 500ms long press
      
      setLongPressTimeout(timeout);
    } else if (!isConnecting) {
      // Handle canvas background touch
      const isCanvasBackground = target === canvasRef.current || 
                                target.classList.contains('canvas-background');
      
      if (isCanvasBackground && !target.closest('[data-canvas-node]')) {
        const canvasPos = screenToCanvas(touch.clientX, touch.clientY);
        setIsSelecting(true);
        startSelectionBox(canvasPos.x, canvasPos.y);
        if (selectedNodeId || selectedNodeIds.length > 0) {
          clearSelection();
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !dragStartPos) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - dragStartPos.x);
    const deltaY = Math.abs(touch.clientY - dragStartPos.y);
    
    // If moved significantly, cancel long press
    if (longPressTimeout && (deltaX > 10 || deltaY > 10)) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
      setIsLongPressing(false);
    }

    if (isPanning) {
      setTransform({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y,
      });
    }

    if (isSelecting && selectionBox.isActive) {
      const canvasPos = screenToCanvas(touch.clientX, touch.clientY);
      updateSelectionBox(canvasPos.x, canvasPos.y);
    }

    if (isConnecting && connectingFromNodeId) {
      const canvasPos = screenToCanvas(touch.clientX, touch.clientY);
      setPreviewConnection(canvasPos);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }

    if (!isLongPressing) {
      // Handle tap events (similar to click)
      const target = e.target as HTMLElement;
      const nodeElement = target.closest('[data-canvas-node]');
      
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-node-id');
        if (nodeId) {
          handleNodeClick(nodeId);
        }
      }
    }

    setIsLongPressing(false);
    setDragStartPos(null);

    if (isPanning) {
      setIsPanning(false);
    }

    if (isSelecting) {
      if (selectionBox.isActive) {
        endSelectionBox();
      }
      setIsSelecting(false);
    }
  };

  // Handle mobile rich text editor
  const handleMobileTextSelection = () => {
    if (isMobile) {
      setMobileRichTextVisible(true);
    }
  };

  const handleMobileFormatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Add wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Handle ESC key to cancel connection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConnecting) {
        setConnecting(false);
        setConnectingFromPoint('center');
        setPreviewConnection(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isConnecting, setConnecting]);

  // Listen for multi-select context menu events from keyboard shortcuts
  useEffect(() => {
    const handleShowMultiSelectContextMenu = (event: CustomEvent) => {
      const nodeIds = event.detail?.nodeIds || [];
      if (nodeIds.length > 1) {
        // Show the multi-select context menu at center of screen
        setMultiSelectContextMenu({ 
          x: window.innerWidth / 2, 
          y: window.innerHeight / 2 
        });
      }
    };

    window.addEventListener('showMultiSelectContextMenu', handleShowMultiSelectContextMenu);
    return () => window.removeEventListener('showMultiSelectContextMenu', handleShowMultiSelectContextMenu);
  }, []);

  // Listen for group highlighting events from toolbar
  useEffect(() => {
    const handleHighlightGroup = (event: CustomEvent) => {
      const groupId = event.detail?.groupId;
      if (groupId) {
        // Toggle highlighting: if same group is clicked, clear highlight
        if (highlightedGroupId === groupId) {
          setHighlightedGroup(null);
        } else {
          setHighlightedGroup(groupId);
        }
        
        // Auto-clear highlight after 5 seconds
        setTimeout(() => {
          setHighlightedGroup(null);
        }, 5000);
      }
    };

    window.addEventListener('highlightGroup', handleHighlightGroup);
    return () => window.removeEventListener('highlightGroup', handleHighlightGroup);
  }, [highlightedGroupId, setHighlightedGroup]);

  return (
    <>
      <div
        ref={canvasRef}
        data-infinite-canvas
        className="w-full h-full overflow-hidden bg-gray-50 dark:bg-[#1B1D1E] cursor-grab relative"
        style={{ cursor: isPanning ? 'grabbing' : isConnecting ? 'crosshair' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-8 canvas-background pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(229 231 235 / 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(229 231 235 / 0.4) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`,
          }}
        />
        <div
          className="absolute inset-0 opacity-8 canvas-background pointer-events-none dark:block hidden"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(107 114 128 / 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(107 114 128 / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
            backgroundPosition: `${transform.x}px ${transform.y}px`,
          }}
        />

        {/* Canvas content container */}
        <div
          className="absolute canvas-background"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%'
          }}
        >
          {/* Render connections */}
          {connections.map(connection => {
            const fromNode = nodes.find(n => n.id === connection.fromNodeId);
            const toNode = nodes.find(n => n.id === connection.toNodeId);
            
            if (!fromNode || !toNode) return null;
            
            return (
              <Connection
                key={connection.id}
                connection={connection}
                fromNode={fromNode}
                toNode={toNode}
                transform={transform}
              />
            );
          })}

          {/* Render preview connection line while in connecting mode */}
          {isConnecting && connectingFromNodeId && previewConnection && (
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {(() => {
                const fromNode = nodes.find(n => n.id === connectingFromNodeId);
                if (!fromNode) return null;
                
                const startPoint = getConnectionPoint(fromNode, connectingFromPoint);
                
                const dx = previewConnection.x - startPoint.x;
                const dy = previewConnection.y - startPoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const curvature = Math.min(distance * 0.5, 100);
                
                let controlX1, controlY1, controlX2, controlY2;
                
                // Adjust control points based on the connection point direction
                switch (connectingFromPoint) {
                  case 'top':
                    controlX1 = startPoint.x;
                    controlY1 = startPoint.y - curvature;
                    controlX2 = previewConnection.x;
                    controlY2 = previewConnection.y + curvature;
                    break;
                  case 'bottom':
                    controlX1 = startPoint.x;
                    controlY1 = startPoint.y + curvature;
                    controlX2 = previewConnection.x;
                    controlY2 = previewConnection.y - curvature;
                    break;
                  case 'left':
                    controlX1 = startPoint.x - curvature;
                    controlY1 = startPoint.y;
                    controlX2 = previewConnection.x + curvature;
                    controlY2 = previewConnection.y;
                    break;
                  case 'right':
                    controlX1 = startPoint.x + curvature;
                    controlY1 = startPoint.y;
                    controlX2 = previewConnection.x - curvature;
                    controlY2 = previewConnection.y;
                    break;
                  default:
                    controlX1 = startPoint.x + curvature;
                    controlY1 = startPoint.y;
                    controlX2 = previewConnection.x - curvature;
                    controlY2 = previewConnection.y;
                }
                
                const pathData = `M ${startPoint.x} ${startPoint.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${previewConnection.x} ${previewConnection.y}`;
                
                return (
                  <path
                    d={pathData}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="8,4"
                    fill="none"
                    className="opacity-70"
                  />
                );
              })()}
            </svg>
          )}

          {/* Render nodes */}
          {nodes.map(node => {
            // Calculate highlight effect
            const isHighlighted = highlightedGroupId && node.groupId === highlightedGroupId;
            const shouldDim = highlightedGroupId && node.groupId !== highlightedGroupId;
            
            return (
              <div 
                key={node.id} 
                onClick={() => handleNodeClick(node.id)} 
                data-canvas-node 
                data-node-id={node.id}
                style={{
                  opacity: shouldDim ? 0.3 : 1,
                  transition: 'opacity 0.3s ease-in-out',
                  filter: isHighlighted ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))' : 'none',
                }}
              >
                <CanvasNode
                  node={node}
                  isSelected={node.id === selectedNodeId || selectedNodeIds.includes(node.id)}
                  transform={transform}
                  onStartConnection={handleStartConnection}
                  onCompleteConnection={handleCompleteConnection}
                  isConnectionTarget={isConnecting && connectingFromNodeId !== node.id}
                  isConnecting={isConnecting}
                />
              </div>
            );
          })}

          {/* Selection box */}
          {selectionBox.isActive && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
              style={{
                left: Math.min(selectionBox.startX, selectionBox.endX),
                top: Math.min(selectionBox.startY, selectionBox.endY),
                width: Math.abs(selectionBox.endX - selectionBox.startX),
                height: Math.abs(selectionBox.endY - selectionBox.startY),
              }}
            />
          )}
        </div>

        {/* Zoom and Fit Controls - Desktop only */}
        {!isMobile && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <button
              onClick={handleFitToScreen}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100"
              title="Fit to Screen"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={zoomIn}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100"
              title="Zoom In"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={zoomOut}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100"
              title="Zoom Out"
            >
              <Minus size={18} />
            </button>
          </div>
        )}

        {/* Mobile Undo/Redo Controls - Top left */}
        {isMobile && (
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={undo}
              disabled={history.past.length === 0}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={redo}
              disabled={history.future.length === 0}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo size={18} />
            </button>
          </div>
        )}



        {/* Connection mode indicator */}
        {isConnecting && (
          <div className="absolute top-18 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              Connection Mode Active - Click target node to connect
            </div>
          </div>
        )}


      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          canvasPosition={contextMenu.canvasPosition}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Multi-select context menu */}
      {multiSelectContextMenu && selectedNodeIds.length > 1 && (
        <MultiSelectContextMenu
          x={multiSelectContextMenu.x}
          y={multiSelectContextMenu.y}
          selectedNodeIds={selectedNodeIds}
          onClose={() => setMultiSelectContextMenu(null)}
        />
      )}
    </>
  );
}