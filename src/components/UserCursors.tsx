import React, { useEffect, useState } from 'react';
import { useCollaborationStore } from '../stores/collaborationStore';
import { motion, AnimatePresence } from 'motion/react';

interface UserCursorsProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export function UserCursors({ containerRef }: UserCursorsProps) {
  const { getOtherParticipants, updatePresence, isCollaborating } = useCollaborationStore();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const otherParticipants = getOtherParticipants();

  // Track mouse movement and send to other users
  useEffect(() => {
    if (!isCollaborating || !containerRef.current) return;

    const container = containerRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePosition({ x, y });
      
      // Send cursor position to other users (throttled)
      updatePresence({ cursor: { x, y } });
    };

    const handleMouseLeave = () => {
      // Remove cursor when mouse leaves canvas
      updatePresence({ cursor: undefined });
    };

    // Throttle mouse move events to reduce network traffic
    let lastUpdate = 0;
    const throttledMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate > 50) { // Update every 50ms max
        handleMouseMove(e);
        lastUpdate = now;
      }
    };

    container.addEventListener('mousemove', throttledMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', throttledMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isCollaborating, containerRef, updatePresence]);

  if (!isCollaborating) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {otherParticipants.map((participant) => {
          if (!participant.cursor) return null;

          return (
            <motion.div
              key={participant.userId}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute flex items-center gap-1"
              style={{
                left: participant.cursor.x,
                top: participant.cursor.y,
                transform: 'translate(-2px, -2px)'
              }}
            >
              {/* Cursor pointer */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className="drop-shadow-md"
              >
                <path
                  d="M2 2L14 8L8 10L6 14L2 2Z"
                  fill={participant.color}
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>
              
              {/* User name label */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap ml-1 mt-4"
                style={{ backgroundColor: participant.color }}
              >
                {participant.userName}
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}