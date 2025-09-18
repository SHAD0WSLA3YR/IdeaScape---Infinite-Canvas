import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Node, useCanvasStore } from "../store/canvasStore";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { RichTextEditor } from "./RichTextEditor";
import { ImageMasonry } from "./ImageMasonry";
import { VideoMasonry } from "./VideoMasonry";
import { LinkManager } from "./LinkManager";
import { TagManager } from "./TagManager";
import { imgLineiconsComment1Text } from "../imports/svg-phjcw";

interface CanvasNodeProps {
  node: Node;
  isSelected: boolean;
  transform: { x: number; y: number; scale: number };
  onStartConnection: (nodeId: string, connectionPoint: string) => void;
  onCompleteConnection: (nodeId: string) => void;
  isConnectionTarget: boolean;
  isConnecting: boolean;
}

export function CanvasNode({
  node,
  isSelected,
  transform,
  onStartConnection,
  onCompleteConnection,
  isConnectionTarget,
  isConnecting,
}: CanvasNodeProps) {
  const { updateNode, groups, addComment, removeComment } = useCanvasStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isLinkDragActive, setIsLinkDragActive] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const nodeRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Find the group this node belongs to
  const nodeGroup = node.groupId
    ? groups.find((g) => g.id === node.groupId)
    : null;
  const borderColor = nodeGroup ? nodeGroup.color : "#d1d5db";

  const handleMouseDown = (e: React.MouseEvent) => {
    // If we're in connecting mode and this is a target node, complete the connection
    if (isConnecting && isConnectionTarget) {
      e.preventDefault();
      e.stopPropagation();
      onCompleteConnection(node.id);
      return;
    }

    // If node is in editing mode, don't start dragging
    if (isEditing) {
      return;
    }

    // If link drag mode is active, don't start node dragging
    if (isLinkDragActive) {
      return;
    }

    // Check if clicking on a connection dot - if so, don't start dragging the node
    if (
      (e.target as HTMLElement).classList.contains("connection-dot")
    ) {
      return;
    }

    // Check if clicking on an input field, button, or other interactive element
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'INPUT' || 
                                target.tagName === 'BUTTON' || 
                                target.tagName === 'A' ||
                                target.contentEditable === 'true' ||
                                target.closest('input') ||
                                target.closest('button') ||
                                target.closest('a') ||
                                target.closest('[contenteditable="true"]');
    
    if (isInteractiveElement) {
      return; // Don't prevent default or start dragging
    }

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragStart({
      x: e.clientX - node.x * transform.scale,
      y: e.clientY - node.y * transform.scale,
    });
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    // If we're in connecting mode and this is a target node, complete the connection
    if (isConnecting && isConnectionTarget) {
      e.preventDefault();
      e.stopPropagation();
      onCompleteConnection(node.id);
      return;
    }

    // Check if clicking on an interactive element - if so, don't interfere
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'INPUT' || 
                                target.tagName === 'BUTTON' || 
                                target.tagName === 'A' ||
                                target.contentEditable === 'true' ||
                                target.closest('input') ||
                                target.closest('button') ||
                                target.closest('a') ||
                                target.closest('[contenteditable="true"]');
    
    if (isInteractiveElement) {
      return; // Don't prevent default
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: node.width,
      height: node.height,
    });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isConnecting) return; // Don't allow editing during connection mode
    
    // Check if double-clicking on an interactive element - if so, don't interfere
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'INPUT' || 
                                target.tagName === 'BUTTON' || 
                                target.tagName === 'A' ||
                                target.contentEditable === 'true' ||
                                target.closest('input') ||
                                target.closest('button') ||
                                target.closest('a') ||
                                target.closest('[contenteditable="true"]');
    
    if (isInteractiveElement) {
      return; // Don't prevent default or enter editing mode
    }
    
    e.preventDefault();
    e.stopPropagation();
    if (node.content.type === "text") {
      setIsEditing(true);
    }
  };

  const handleContentChange = (value: string) => {
    updateNode(node.id, {
      content: { ...node.content, value },
    });
  };

  const handleContentBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Check if the key event is coming from an input field or other interactive element
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'INPUT' || 
                                target.tagName === 'BUTTON' || 
                                target.tagName === 'TEXTAREA' ||
                                target.contentEditable === 'true' ||
                                target.closest('input') ||
                                target.closest('button') ||
                                target.closest('textarea') ||
                                target.closest('[contenteditable="true"]');
    
    // If it's from an interactive element, only handle Escape for exiting editing mode
    if (isInteractiveElement && e.key !== "Escape") {
      return; // Let the input handle its own key events
    }

    if (e.key === "Enter" && !e.shiftKey && !isInteractiveElement) {
      e.preventDefault();
      setIsEditing(false);
    }
    if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleConnectionStart = (e: React.MouseEvent, connectionPoint: string) => {
    e.preventDefault();
    e.stopPropagation();
    onStartConnection(node.id, connectionPoint);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX =
          (e.clientX - dragStart.x) / transform.scale;
        const newY =
          (e.clientY - dragStart.y) / transform.scale;
        updateNode(node.id, { x: newX, y: newY });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(
          100,
          resizeStart.width + deltaX / transform.scale,
        );
        const newHeight = Math.max(
          60,
          resizeStart.height + deltaY / transform.scale,
        );
        updateNode(node.id, {
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener(
          "mousemove",
          handleMouseMove,
        );
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    isDragging,
    isResizing,
    dragStart,
    resizeStart,
    node.id,
    transform.scale,
    updateNode,
  ]);



  const handleImagesChange = (images: string[]) => {
    updateNode(node.id, {
      content: { ...node.content, images },
    });
  };

  const handleLinksChange = (links: Array<{ url: string; title: string }>) => {
    updateNode(node.id, {
      content: { ...node.content, links },
    });
  };

  const handleVideosChange = (videos: string[]) => {
    updateNode(node.id, {
      content: { ...node.content, videos },
    });
  };

  const handleCommentSave = (comment: string) => {
    if (comment.trim()) {
      addComment(node.id, comment.trim());
    } else {
      removeComment(node.id);
    }
    setIsEditingComment(false);
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSave((e.target as HTMLTextAreaElement).value);
    } else if (e.key === 'Escape') {
      setIsEditingComment(false);
    }
  };

  // Auto-focus comment input when editing starts
  useEffect(() => {
    if (isEditingComment && commentInputRef.current) {
      commentInputRef.current.focus();
      commentInputRef.current.select();
    }
  }, [isEditingComment]);

  const renderContent = () => {
    switch (node.content.type) {
      case "text":
        if (isEditing) {
          return (
            <RichTextEditor
              value={node.content.value}
              onChange={handleContentChange}
              onBlur={handleContentBlur}
              onSave={() => setIsEditing(false)}
              groupColor={borderColor}
              autoFocus
            />
          );
        }
        return (
          <div 
            className="p-3 text-sm break-words rich-text-content text-left tiptap-display text-gray-900 dark:text-gray-100"
            dangerouslySetInnerHTML={{ __html: node.content.value }}
          />
        );

      case "image":
        // Use multi-image support with drag and drop
        const images = node.content.images || (node.content.value ? [node.content.value] : []);
        return (
          <ImageMasonry
            images={images}
            onImagesChange={handleImagesChange}
            nodeWidth={node.width}
          />
        );

      case "link":
        // Use multi-link support with editable links
        const links = node.content.links || (node.content.value ? [{ url: node.content.value, title: node.content.title || node.content.value }] : []);
        return (
          <LinkManager
            links={links}
            onLinksChange={handleLinksChange}
            onDragModeChange={setIsLinkDragActive}
          />
        );

      case "video":
        // Use multi-video support with drag and drop
        const videos = node.content.videos || (node.content.value ? [node.content.value] : []);
        return (
          <VideoMasonry
            videos={videos}
            onVideosChange={handleVideosChange}
            onDoubleClick={handleDoubleClick}
          />
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className="absolute"
      style={{
        left: node.x,
        top: node.y,
      }}
      initial={node.isNew ? {
        opacity: 0,
        scale: 0.2,
      } : false}
      animate={node.isNew ? {
        opacity: 1,
        scale: 1,
      } : {}}
      transition={node.isNew ? {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        scale: {
          type: "spring",
          stiffness: 200,
          damping: 20
        }
      } : {}}
    >
      <div
        ref={nodeRef}
        className={`rounded-lg bg-white dark:bg-gray-800 shadow-lg border-2 transition-all group ${
          isDragging ? "opacity-80" : ""
        } ${isConnectionTarget ? "ring-2 ring-blue-400 ring-opacity-50 cursor-pointer" : ""} ${
          isSelected ? "ring-2 ring-blue-500 ring-opacity-75" : ""
        } ${
          isConnecting ? "cursor-crosshair" : isEditing ? "cursor-text" : isLinkDragActive ? "cursor-default" : "cursor-move select-none"
        }`}
        style={{
          width: node.width,
          height: node.height,
          borderColor: borderColor,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleNodeClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
      >
      {/* Connection points - shown when selected or when it's a connection target */}
      {(isSelected || isConnectionTarget) && (
        <>
          {/* Top center */}
          <div
            className="connection-dot absolute w-4 h-4 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors hover:scale-110"
            style={{
              top: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
            }}
            onClick={(e) => handleConnectionStart(e, "top")}
          />
          {/* Left center */}
          <div
            className="connection-dot absolute w-4 h-4 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors hover:scale-110"
            style={{
              top: "50%",
              left: "-8px",
              transform: "translateY(-50%)",
              zIndex: 10,
            }}
            onClick={(e) => handleConnectionStart(e, "left")}
          />
          {/* Right center */}
          <div
            className="connection-dot absolute w-4 h-4 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors hover:scale-110"
            style={{
              top: "50%",
              right: "-8px",
              transform: "translateY(-50%)",
              zIndex: 10,
            }}
            onClick={(e) => handleConnectionStart(e, "right")}
          />
          {/* Bottom center */}
          <div
            className="connection-dot absolute w-4 h-4 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors hover:scale-110"
            style={{
              bottom: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
            }}
            onClick={(e) => handleConnectionStart(e, "bottom")}
          />
        </>
      )}
      
      {/* Tags - positioned bottom-left, outside node, above comments */}
      {((node.tags && node.tags.length > 0) || isSelected) && (
        <div className={`absolute left-0 z-10 ${node.comment ? 'bottom-16' : 'bottom-0 translate-y-full pt-1'}`}>
          <TagManager nodeId={node.id} />
        </div>
      )}

      {/* Content */}
      <div className={`w-full ${node.comment ? 'h-[calc(100%-60px)]' : 'h-full'} overflow-hidden ${isEditing ? 'cursor-text' : ''}`}>
        {renderContent()}
      </div>

      {/* Comment Section */}
      {node.comment && (
        <div className="absolute bottom-0 left-0 right-0 min-h-10 max-h-20 bg-gray-300 dark:bg-gray-600 rounded-b-lg border-t border-gray-400 dark:border-gray-500 p-2">
          <div className="flex items-start gap-2">
            <img 
              className="w-3 h-3 flex-shrink-0 mt-0.5" 
              src={imgLineiconsComment1Text} 
              alt="Comment"
              style={{ filter: 'invert(0.4)' }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-black dark:text-white font-medium block mb-1">Comment:</span>
              {isEditingComment ? (
                <textarea
                  ref={commentInputRef}
                  defaultValue={node.comment}
                  className="w-full text-xs bg-transparent border-none outline-none text-black dark:text-white resize-none overflow-hidden"
                  rows={2}
                  style={{ minHeight: '2.5rem', maxHeight: '3.5rem' }}
                  onBlur={(e) => handleCommentSave(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSave((e.target as HTMLTextAreaElement).value);
                    } else if (e.key === 'Escape') {
                      setIsEditingComment(false);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div 
                  className="text-xs text-black dark:text-white cursor-pointer break-words leading-tight overflow-y-auto"
                  style={{ maxHeight: '3rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingComment(true);
                  }}
                >
                  {node.comment}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Resize handle - blue square in bottom right corner */}
      {isSelected && !isConnecting && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-br-md"
          onMouseDown={handleResizeStart}
        />
      )}
      </div>
    </motion.div>
  );
}