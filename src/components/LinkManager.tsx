// LinkManager.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { Plus, ExternalLink, Edit, Trash, Send, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'sonner@2.0.3';

interface LinkItem {
    url: string;
    title: string;
}

interface LinkManagerProps {
    links: LinkItem[];
    onLinksChange: (links: LinkItem[]) => void;
    onInsertLink?: (url: string, title: string) => void;
    onDragModeChange?: (active: boolean) => void; // NEW
}

interface DragItem {
    type: string;
    index: number;
}

interface DraggableLinkProps {
    link: LinkItem;
    index: number;
    editingIndex: number | null;
    editUrl: string;
    editTitle: string;
    setEditUrl: (url: string) => void;
    setEditTitle: (title: string) => void;
    startEditing: (index: number) => void;
    updateLink: (index: number) => void;
    removeLink: (index: number) => void;
    cancelEditing: () => void;
    onInsertLink?: (url: string, title: string) => void;
    moveLink: (dragIndex: number, hoverIndex: number) => void;
    dragActiveIndex: number | null;
    setDragActiveIndex: (index: number | null) => void;
}

// Individual draggable link component
function DraggableLink({ 
    link, 
    index, 
    editingIndex, 
    editUrl, 
    editTitle, 
    setEditUrl, 
    setEditTitle, 
    startEditing, 
    updateLink, 
    removeLink, 
    cancelEditing, 
    onInsertLink, 
    moveLink,
    dragActiveIndex,
    setDragActiveIndex
}: DraggableLinkProps) {
    const isDragActive = dragActiveIndex === index;
    
    const [{ isDragging }, drag, preview] = useDrag({
        type: 'link',
        item: { type: 'link', index },
        canDrag: () => isDragActive,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        end: () => {
            setDragActiveIndex(null);
        }
    });

    const [, drop] = useDrop({
        accept: 'link',
        hover: (item: DragItem, monitor) => {
            if (!monitor.isOver({ shallow: true })) {
                return;
            }

            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex) {
                return;
            }

            moveLink(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    return (
        <div 
            ref={(node) => {
                if (isDragActive) {
                    drag(drop(node));
                } else {
                    drop(node);
                }
            }}
            className={`border border-gray-200 rounded-lg p-2 ${isDragging ? 'opacity-50' : ''} ${
                isDragActive ? 'ring-2 ring-blue-200 border-blue-300 bg-blue-50/30 cursor-move' : 'cursor-default'
            } transition-all duration-300 transform-gpu`}
            style={{
                transform: isDragging ? 'scale(1.02) rotate(2deg)' : 'scale(1) rotate(0deg)',
                boxShadow: isDragging ? '0 8px 25px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                zIndex: isDragging ? 1000 : 1,
            }}
        >
            {isDragActive && (
                <div className="text-xs text-blue-600 mb-2 font-medium bg-blue-50 p-2 rounded border border-blue-200">
                    🔄 Drag mode active - Click and drag anywhere on this item to reorder
                </div>
            )}
            {editingIndex === index ? (
                <div className="space-y-2">
                    <Input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="Enter URL..."
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const titleInput = e.currentTarget.parentElement?.querySelector('input[type="text"]') as HTMLInputElement;
                                if (titleInput) {
                                    titleInput.focus();
                                }
                            } else if (e.key === 'Tab') {
                                return;
                            }
                        }}
                    />
                    <Input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Enter title (optional)..."
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter' && editUrl.trim()) {
                                e.preventDefault();
                                updateLink(index);
                            } else if (e.key === 'Tab') {
                                return;
                            }
                        }}
                    />
                    <div className="flex gap-1">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                updateLink(index);
                            }}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                            disabled={!editUrl.trim()}
                        >
                            Save
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                cancelEditing();
                            }}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                        >
                            Cancel
                        </Button>
                        {onInsertLink && (
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onInsertLink(editUrl, editTitle);
                                    cancelEditing();
                                }}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
                                disabled={!editUrl.trim()}
                                title="Insert into editor"
                            >
                                <Send size={12} />
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isDragActive) {
                                    setDragActiveIndex(null);
                                } else {
                                    setDragActiveIndex(index);
                                }
                            }}
                            className={`cursor-pointer transition-colors ${
                                isDragActive 
                                    ? 'text-blue-600 bg-blue-100 rounded p-1' 
                                    : 'text-gray-400 hover:text-gray-600 p-1'
                            }`}
                            title={isDragActive ? "Click to deactivate drag mode" : "Click to activate drag mode"}
                        >
                            <GripVertical size={14} />
                        </div>
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 text-xs truncate flex-1 min-w-0 ${
                                isDragActive 
                                    ? 'text-blue-500 pointer-events-none' 
                                    : 'text-blue-600 hover:text-blue-800'
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isDragActive) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            <ExternalLink size={12} />
                            <span className="truncate">{link.title}</span>
                        </a>
                    </div>
                    <div className="flex gap-1 ml-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isDragActive) {
                                    startEditing(index);
                                }
                            }}
                            className={`p-1 transition-colors ${
                                isDragActive 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-500 hover:text-blue-600'
                            }`}
                            title={isDragActive ? "Deactivate drag mode to edit" : "Edit link"}
                            disabled={isDragActive}
                        >
                            <Edit size={12} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isDragActive) {
                                    removeLink(index);
                                }
                            }}
                            className={`p-1 transition-colors ${
                                isDragActive 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-500 hover:text-red-600'
                            }`}
                            title={isDragActive ? "Deactivate drag mode to delete" : "Delete link"}
                            disabled={isDragActive}
                        >
                            <Trash size={12} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function LinkManager({ links, onLinksChange, onInsertLink, onDragModeChange }: LinkManagerProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [dragActiveIndex, setDragActiveIndex] = useState<number | null>(null);

    // 🔄 NEW: Notify parent when drag mode toggles
    useEffect(() => {
        onDragModeChange?.(dragActiveIndex !== null);
    }, [dragActiveIndex, onDragModeChange]);

    // URL validation function
    const isValidUrl = (url: string): boolean => {
        try {
            const normalizedUrl = url.startsWith('http://') || url.startsWith('https://') 
                ? url 
                : `https://${url}`;
            new URL(normalizedUrl);
            // Additional checks for valid domain structure
            const urlObj = new URL(normalizedUrl);
            const domain = urlObj.hostname;
            // Must have at least one dot and valid TLD
            return domain.includes('.') && domain.length > 3 && !/^[.\-]|[.\-]$/.test(domain);
        } catch {
            return false;
        }
    };

    const addLink = () => {
        if (editUrl.trim()) {
            if (!isValidUrl(editUrl.trim())) {
                toast.error('Please enter a valid URL (e.g., example.com or https://example.com)');
                return;
            }
            
            const newLink: LinkItem = {
                url: editUrl.trim(),
                title: editTitle.trim() || editUrl.trim()
            };
            onLinksChange([...links, newLink]);
            setEditUrl('');
            setEditTitle('');
            setShowAddForm(false);
        }
    };

    const updateLink = (index: number) => {
        if (editUrl.trim()) {
            if (!isValidUrl(editUrl.trim())) {
                toast.error('Please enter a valid URL (e.g., example.com or https://example.com)');
                return;
            }
            
            const updatedLinks = [...links];
            updatedLinks[index] = {
                url: editUrl.trim(),
                title: editTitle.trim() || editUrl.trim()
            };
            onLinksChange(updatedLinks);
            setEditingIndex(null);
            setEditUrl('');
            setEditTitle('');
        }
    };

    const removeLink = (index: number) => {
        const updatedLinks = links.filter((_, i) => i !== index);
        onLinksChange(updatedLinks);
    };

    const startEditing = (index: number) => {
        const link = links[index];
        setEditingIndex(index);
        setEditUrl(link.url);
        setEditTitle(link.title);
    };

    const cancelEditing = () => {
        setEditingIndex(null);
        setShowAddForm(false);
        setEditUrl('');
        setEditTitle('');
        setDragActiveIndex(null); // Also deactivate any drag mode
    };

    const moveLink = useCallback((dragIndex: number, hoverIndex: number) => {
        const newLinks = [...links];
        const draggedLink = newLinks[dragIndex];
        newLinks.splice(dragIndex, 1);
        newLinks.splice(hoverIndex, 0, draggedLink);
        onLinksChange(newLinks);
    }, [links, onLinksChange]);

    if (links.length === 0 && !showAddForm) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowAddForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <Plus size={16} />
                    Add Link
                </Button>
            </div>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="w-full h-full p-3 overflow-auto link-manager">
                <div className="space-y-2 transition-all duration-300">
                {links.map((link, index) => (
                    <DraggableLink
                        key={`${link.url}-${link.title}-${index}`}
                        link={link}
                        index={index}
                        editingIndex={editingIndex}
                        editUrl={editUrl}
                        editTitle={editTitle}
                        setEditUrl={setEditUrl}
                        setEditTitle={setEditTitle}
                        startEditing={startEditing}
                        updateLink={updateLink}
                        removeLink={removeLink}
                        cancelEditing={cancelEditing}
                        onInsertLink={onInsertLink}
                        moveLink={moveLink}
                        dragActiveIndex={dragActiveIndex}
                        setDragActiveIndex={setDragActiveIndex}
                    />
                ))}
                </div>

            {showAddForm && (
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                    <div className="space-y-2">
                        <Input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="Enter URL..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const titleInput = e.currentTarget.parentElement?.querySelector('input[type="text"]') as HTMLInputElement;
                                    if (titleInput) {
                                        titleInput.focus();
                                    }
                                } else if (e.key === 'Tab') {
                                    return;
                                }
                            }}
                        />
                        <Input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Enter title (optional)..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter' && editUrl.trim()) {
                                    e.preventDefault();
                                    addLink();
                                } else if (e.key === 'Tab') {
                                    return;
                                }
                            }}
                        />
                        <div className="flex gap-1">
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addLink();
                                }}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                                disabled={!editUrl.trim()}
                            >
                                Add
                            </Button>
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    cancelEditing();
                                }}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {!showAddForm && (
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowAddForm(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 border border-dashed border-gray-300 rounded-lg text-sm hover:bg-gray-200 hover:border-gray-400 hover:text-gray-800 transition-colors"
                >
                    <Plus size={16} />
                    Add Link
                </Button>
            )}
            </div>
        </DndProvider>
    );
}
