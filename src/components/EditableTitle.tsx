import React, { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';

export function EditableTitle() {
  const { canvasName, setCanvasName } = useCanvasStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(canvasName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempName(canvasName);
  }, [canvasName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (tempName.trim()) {
      setCanvasName(tempName.trim());
    } else {
      setTempName(canvasName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setTempName(canvasName);
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempName(e.target.value);
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={tempName}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent outline-none border-none text-lg font-medium text-center min-w-[120px] max-w-[300px] border-b-2 border-blue-400 text-gray-900 dark:text-gray-100"
          style={{ width: `${Math.max(120, tempName.length * 12)}px` }}
        />
      ) : (
        <h1 
          onClick={handleClick}
          className="text-lg font-medium cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded px-2 py-1 transition-colors border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600 text-gray-900 dark:text-gray-100"
          title="Click to edit canvas name"
        >
          {canvasName}
        </h1>
      )}
    </div>
  );
}