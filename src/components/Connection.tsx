import React from 'react';
import { Connection as ConnectionType, Node } from '../store/canvasStore';

interface ConnectionProps {
  connection: ConnectionType;
  fromNode: Node;
  toNode: Node;
  transform: { x: number; y: number; scale: number };
}

export function Connection({ connection, fromNode, toNode }: ConnectionProps) {
  // Get connection point coordinates for a node
  const getConnectionPoint = (node: Node, point?: string) => {
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
        // Fallback to smart connection points based on relative position
        return getSmartConnectionPoint(node);
    }
  };

  // Fallback smart connection point calculation (for older connections without stored points)
  const getSmartConnectionPoint = (node: Node) => {
    const fromCenterX = fromNode.x + fromNode.width / 2;
    const fromCenterY = fromNode.y + fromNode.height / 2;
    const toCenterX = toNode.x + toNode.width / 2;
    const toCenterY = toNode.y + toNode.height / 2;

    // Calculate angle between centers
    const angle = Math.atan2(toCenterY - fromCenterY, toCenterX - fromCenterX);
    const degrees = (angle * 180) / Math.PI;

    // Determine connection point based on angle
    if (node === fromNode) {
      if (degrees >= -45 && degrees <= 45) {
        return { x: node.x + node.width, y: node.y + node.height / 2 }; // right
      } else if (degrees > 45 && degrees <= 135) {
        return { x: node.x + node.width / 2, y: node.y + node.height }; // bottom
      } else if (degrees > 135 || degrees <= -135) {
        return { x: node.x, y: node.y + node.height / 2 }; // left
      } else {
        return { x: node.x + node.width / 2, y: node.y }; // top
      }
    } else {
      // For target node, use opposite direction
      const toAngle = angle + Math.PI;
      const toDegrees = (toAngle * 180) / Math.PI;
      
      if (toDegrees >= -45 && toDegrees <= 45) {
        return { x: node.x + node.width, y: node.y + node.height / 2 }; // right
      } else if (toDegrees > 45 && toDegrees <= 135) {
        return { x: node.x + node.width / 2, y: node.y + node.height }; // bottom
      } else if (toDegrees > 135 || toDegrees <= -135) {
        return { x: node.x, y: node.y + node.height / 2 }; // left
      } else {
        return { x: node.x + node.width / 2, y: node.y }; // top
      }
    }
  };

  // Get the actual connection points
  const fromPoint = getConnectionPoint(fromNode, connection.fromPoint);
  const toPoint = getConnectionPoint(toNode, connection.toPoint);

  // Create smooth curved path
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Control points for smooth curve based on connection directions
  const controlOffset = Math.min(distance * 0.4, 120);
  
  let controlX1, controlY1, controlX2, controlY2;
  
  // Adjust control points based on the specific connection points
  const fromPointType = connection.fromPoint || 'auto';
  const toPointType = connection.toPoint || 'auto';
  
  // Calculate control points based on connection point directions
  switch (fromPointType) {
    case 'top':
      controlX1 = fromPoint.x;
      controlY1 = fromPoint.y - controlOffset;
      break;
    case 'bottom':
      controlX1 = fromPoint.x;
      controlY1 = fromPoint.y + controlOffset;
      break;
    case 'left':
      controlX1 = fromPoint.x - controlOffset;
      controlY1 = fromPoint.y;
      break;
    case 'right':
      controlX1 = fromPoint.x + controlOffset;
      controlY1 = fromPoint.y;
      break;
    default:
      // Auto-determine based on relative position
      if (Math.abs(dx) > Math.abs(dy)) {
        controlX1 = fromPoint.x + (dx > 0 ? controlOffset : -controlOffset);
        controlY1 = fromPoint.y;
      } else {
        controlX1 = fromPoint.x;
        controlY1 = fromPoint.y + (dy > 0 ? controlOffset : -controlOffset);
      }
  }

  switch (toPointType) {
    case 'top':
      controlX2 = toPoint.x;
      controlY2 = toPoint.y - controlOffset;
      break;
    case 'bottom':
      controlX2 = toPoint.x;
      controlY2 = toPoint.y + controlOffset;
      break;
    case 'left':
      controlX2 = toPoint.x - controlOffset;
      controlY2 = toPoint.y;
      break;
    case 'right':
      controlX2 = toPoint.x + controlOffset;
      controlY2 = toPoint.y;
      break;
    default:
      // Auto-determine based on relative position
      if (Math.abs(dx) > Math.abs(dy)) {
        controlX2 = toPoint.x - (dx > 0 ? controlOffset : -controlOffset);
        controlY2 = toPoint.y;
      } else {
        controlX2 = toPoint.x;
        controlY2 = toPoint.y - (dy > 0 ? controlOffset : -controlOffset);
      }
  }

  const pathData = `M ${fromPoint.x} ${fromPoint.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toPoint.x} ${toPoint.y}`;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible'
      }}
    >
      <path
        d={pathData}
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="drop-shadow-sm text-black dark:text-white"
      />
      
      {/* Connection point indicators (small circles at connection points) */}
      <circle
        cx={fromPoint.x}
        cy={fromPoint.y}
        r="2"
        fill="currentColor"
        className="opacity-30 text-black dark:text-white"
      />
      <circle
        cx={toPoint.x}
        cy={toPoint.y}
        r="2"
        fill="currentColor"
        className="opacity-30 text-black dark:text-white"
      />
    </svg>
  );
}