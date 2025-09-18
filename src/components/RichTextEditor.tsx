import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Highlighter,
    Type,
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    onSave?: () => void;
    groupColor: string;
    autoFocus?: boolean;
}

const DEFAULT_FONT_SIZE = 14;
const LARGE_FONT_SIZE = 18;

export function RichTextEditor({
    value,
    onChange,
    onBlur,
    onSave,
    groupColor,
    autoFocus = false,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
    const [currentSelection, setCurrentSelection] = useState<Range | null>(null);



    const execCommand = (command: string, value?: string) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        // Save the current selection before executing command
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;
        const endContainer = range.endContainer;
        const endOffset = range.endOffset;
        
        document.execCommand(command, false, value);
        
        // Restore the selection after the command
        try {
            const newRange = document.createRange();
            newRange.setStart(startContainer, startOffset);
            newRange.setEnd(endContainer, endOffset);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } catch (e) {
            // If we can't restore the exact selection, just place cursor at end
            const newRange = document.createRange();
            newRange.selectNodeContents(editorRef.current!);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
        
        handleInput();
    };

    const updateFontSize = useCallback(() => {
        if (editorRef.current) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const parentElement = range.commonAncestorContainer.parentElement;
                if (parentElement) {
                    const computedStyle = window.getComputedStyle(parentElement);
                    const size = parseFloat(computedStyle.fontSize);
                    if (!isNaN(size)) {
                         setFontSize(size);
                    }
                }
            }
        }
    }, []);

    // Initialize editor content and set up event listeners
    useEffect(() => {
        const editorElement = editorRef.current;
        if (!editorElement) return;

        // Sync initial content
        if (value !== editorElement.innerHTML) {
            // Ensure we have proper content structure
            const content = value || '<div style="font-size: 14px;">Double-click to edit</div>';
            editorElement.innerHTML = content;
        }

        // Auto focus and select
        if (autoFocus) {
            editorElement.focus();
            if (editorElement.textContent === 'Double-click to edit') {
                const range = document.createRange();
                range.selectNodeContents(editorElement);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
    }, [value, autoFocus]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!editorRef.current?.contains(e.target as Node)) return;

            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSave?.();
            }
            
            // Allow Shift+Enter to work naturally - don't prevent default
            // The browser will handle line breaks correctly by itself
            
            if (e.key === 'Escape') {
                onSave?.();
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        execCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        execCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        execCommand('underline');
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onSave, currentSelection]);

    const handleInput = () => {
        if (editorRef.current) {
            const content = editorRef.current.innerHTML;
            const textContent = editorRef.current.textContent;
            
            if (!textContent?.trim()) {
                onChange('<div style="font-size: 14px;">Double-click to edit</div>');
            } else {
                // Just pass through content as the browser creates it
                onChange(content);
            }
        }
    };

    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            setShowToolbar(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();

        if (selectedText && editorRef.current?.contains(range.commonAncestorContainer)) {
            setCurrentSelection(range.cloneRange());
            const rect = range.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            setToolbarPosition({
                x: rect.left + rect.width / 2 + scrollX,
                y: rect.top + scrollY - 50
            });
            setShowToolbar(true);
            updateFontSize();
        } else {
            setShowToolbar(false);
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (relatedTarget && relatedTarget.closest('.formatting-toolbar')) {
            return;
        }
        
        setTimeout(() => {
            setShowToolbar(false);
            onBlur();
        }, 150);
    };

    const toggleFontSize = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            return;
        }

        const range = selection.getRangeAt(0);
        const parentElement = range.commonAncestorContainer.parentElement;
        if (!parentElement) return;

        // Save selection details before modification
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;
        const endContainer = range.endContainer;
        const endOffset = range.endOffset;

        const currentSize = parseFloat(window.getComputedStyle(parentElement).fontSize);
        const newSize = currentSize === LARGE_FONT_SIZE ? DEFAULT_FONT_SIZE : LARGE_FONT_SIZE;
        
        const span = document.createElement('span');
        span.style.fontSize = `${newSize}px`;

        try {
            range.surroundContents(span);
        } catch (e) {
            // Fallback for complex selections that can't be surrounded
            const extractedContents = range.extractContents();
            span.appendChild(extractedContents);
            range.insertNode(span);
        }
        
        // Restore the selection to the formatted text
        try {
            const newRange = document.createRange();
            newRange.setStart(startContainer, startOffset);
            newRange.setEnd(endContainer, endOffset);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } catch (e) {
            // If we can't restore selection, just collapse to end
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
        
        setFontSize(newSize);
        handleInput();
    };

    const handleGroupColorHighlight = () => {
        const alphaColor = groupColor + '40';
        execCommand('backColor', alphaColor);
    };

    const clearHighlight = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;
        
        // Remove background color by setting it to transparent
        execCommand('backColor', 'transparent');
    };

    return (
        <div className="relative w-full h-full">
            {showToolbar && (
                <div
                    className="formatting-toolbar fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-2 flex gap-1 items-center"
                    style={{
                        left: toolbarPosition.x - 100,
                        top: toolbarPosition.y,
                        pointerEvents: 'auto'
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {/* Bold Button */}
                    <button
                        onMouseDown={() => execCommand('bold')}
                        className="p-2 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        title="Bold (Ctrl+B)"
                    >
                        <Bold size={16} />
                    </button>

                    {/* Italic Button */}
                    <button
                        onMouseDown={() => execCommand('italic')}
                        className="p-2 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        title="Italic (Ctrl+I)"
                    >
                        <Italic size={16} />
                    </button>

                    {/* Underline Button */}
                    <button
                        onMouseDown={() => execCommand('underline')}
                        className="p-2 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        title="Underline (Ctrl+U)"
                    >
                        <UnderlineIcon size={16} />
                    </button>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* Font Size Toggle */}
                    <button
                        onMouseDown={toggleFontSize}
                        className="p-2 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        title={`Toggle font size (${fontSize}px)`}
                    >
                        <Type size={16} />
                    </button>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                    {/* Group Color Highlight */}
                    <button
                        onMouseDown={handleGroupColorHighlight}
                        className="p-2 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        title="Highlight with group color"
                    >
                        <Highlighter size={16} style={{ color: groupColor }} />
                    </button>

                    {/* Clear Highlight Button */}
                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            clearHighlight();
                        }}
                        className="p-1.5 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-xs text-gray-900 dark:text-gray-100"
                        title="Clear highlight"
                    >
                        ✕
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                    
                    {/* Close Toolbar Button */}
                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setShowToolbar(false);
                            onSave?.();
                        }}
                        className="p-1.5 rounded transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 text-xs text-red-600 dark:text-red-400"
                        title="Close editor"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onMouseUp={handleMouseUp}
                onBlur={handleBlur}
                onFocus={(e) => {
                    const element = e.target as HTMLElement;
                    if (element.textContent === 'Double-click to edit') {
                        setTimeout(() => {
                            const range = document.createRange();
                            range.selectNodeContents(element);
                            const selection = window.getSelection();
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                        }, 0);
                    }
                }}
                className="w-full h-full outline-none overflow-auto cursor-text select-text rich-text-editor-content text-gray-900 dark:text-gray-100"
                style={{
                    minHeight: '60px',
                    lineHeight: '1.4'
                }}
                suppressContentEditableWarning={true}
            />

            <div className="absolute bottom-1 right-4 text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
                Select text to format • Enter to save
            </div>
        </div>
    );
}