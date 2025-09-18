import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { Tag, X, Plus } from 'lucide-react';

interface TagManagerProps {
  nodeId: string;
  className?: string;
}

export function TagManager({ nodeId, className = '' }: TagManagerProps) {
  const { nodes, addTagToNode, removeTagFromNode } = useCanvasStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const node = nodes.find(n => n.id === nodeId);
  const nodeTags = node?.tags || [];
  
  // Get all tags from all nodes (memoized to prevent infinite loops)
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    nodes.forEach(node => {
      if (node.tags) {
        node.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [nodes]);

  // Calculate suggestions based on current input
  const suggestions = useMemo(() => {
    if (!newTag.trim()) {
      return [];
    }
    return allTags.filter(tag => 
      tag.toLowerCase().includes(newTag.toLowerCase()) && 
      !nodeTags.includes(tag)
    ).slice(0, 5);
  }, [newTag, allTags, nodeTags]);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !nodeTags.includes(tag.trim())) {
      addTagToNode(nodeId, tag.trim());
      setNewTag('');
      setIsAdding(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    removeTagFromNode(nodeId, tag);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleAddTag(suggestions[0]);
      } else {
        handleAddTag(newTag);
      }
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTag('');
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {nodeTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full ml-2"
        >
          <Tag size={10} />
          {tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTag(tag);
            }}
            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      
      {isAdding ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={(e) => {
              // Delay blur to allow clicking on suggestions
              setTimeout(() => {
                if (!newTag.trim()) {
                  setIsAdding(false);
                }
              }, 150);
            }}
            placeholder="Add tag..."
            className="text-xs px-2 py-1 border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-20 focus:w-24 transition-all"
            onClick={(e) => e.stopPropagation()}
          />
          
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50 min-w-24">
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddTag(tag);
                  }}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsAdding(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-dashed border-gray-300 dark:border-gray-600 rounded-full hover:border-gray-400 dark:hover:border-gray-500"
        >
          <Plus size={10} />
          Add tag
        </button>
      )}
    </div>
  );
}