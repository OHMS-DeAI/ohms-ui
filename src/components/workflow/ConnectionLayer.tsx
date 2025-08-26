import React from 'react';
import type { DragConnection } from '../../hooks/useConnectionManager';

// Types
interface WorkflowNode {
  id: string;
  type: 'agent' | 'trigger' | 'action' | 'condition';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    agentId?: string;
    config?: Record<string, any>;
  };
}

interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: string;
  targetHandle?: string;
  path?: string;
}

interface ConnectionLayerProps {
  connections: WorkflowConnection[];
  nodes: WorkflowNode[];
  dragConnection: DragConnection | null;
  onDeleteConnection: (connectionId: string) => void;
  calculateConnectionPath: (sourceNode: WorkflowNode, targetNode: WorkflowNode) => string;
}

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
  connections,
  nodes,
  dragConnection,
  onDeleteConnection,
  calculateConnectionPath
}) => {
  // Calculate path for drag connection
  const getDragConnectionPath = () => {
    if (!dragConnection) return '';
    
    const { sourceHandle, targetPosition } = dragConnection;
    const sourceX = sourceHandle.position.x;
    const sourceY = sourceHandle.position.y;
    const targetX = targetPosition.x;
    const targetY = targetPosition.y;

    // Calculate control points for smooth curve
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const offset = Math.max(Math.min(distance * 0.4, 120), 60);

    // Adjust control points based on handle type and position
    const isVerticalFlow = Math.abs(dy) > Math.abs(dx);
    
    let cp1x, cp1y, cp2x, cp2y;
    
    if (isVerticalFlow) {
      // Vertical flow
      cp1x = sourceX;
      cp1y = sourceY + (dy > 0 ? offset : -offset);
      cp2x = targetX;
      cp2y = targetY - (dy > 0 ? offset : -offset);
    } else {
      // Horizontal flow
      cp1x = sourceX + (dx > 0 ? offset : -offset);
      cp1y = sourceY;
      cp2x = targetX - (dx > 0 ? offset : -offset);
      cp2y = targetY;
    }

    return `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;
  };

  return (
    <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 1 }}>
      <defs>
        {/* Regular connection arrow */}
        <marker id="arrowhead" markerWidth="12" markerHeight="8"
               refX="11" refY="4" orient="auto">
          <polygon points="0 0, 12 4, 0 8" fill="#6366f1" />
        </marker>
        
        {/* Drag connection arrow */}
        <marker id="dragArrowhead" markerWidth="12" markerHeight="8"
               refX="11" refY="4" orient="auto">
          <polygon points="0 0, 12 4, 0 8" fill="#10b981" />
        </marker>
        
        {/* Connection glow filter */}
        <filter id="connectionGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Render existing connections */}
      {connections.map((connection) => {
        const sourceNode = nodes.find(n => n.id === connection.sourceId);
        const targetNode = nodes.find(n => n.id === connection.targetId);

        if (!sourceNode || !targetNode) return null;

        const path = calculateConnectionPath(sourceNode, targetNode);
        const midX = (sourceNode.position.x + targetNode.position.x) / 2 + 80;
        const midY = (sourceNode.position.y + targetNode.position.y) / 2 + 40;

        return (
          <g key={connection.id}>
            {/* Shadow for better visibility */}
            <path
              d={path}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="6"
              fill="none"
              transform="translate(2,2)"
            />
            
            {/* Main connection path */}
            <path
              d={path}
              stroke="#6366f1"
              strokeWidth="3"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="hover:stroke-blue-400 transition-colors duration-200"
              filter="url(#connectionGlow)"
            />
            
            {/* Interactive delete button */}
            <g className="pointer-events-auto cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-200">
              {/* Delete button background */}
              <circle
                cx={midX}
                cy={midY}
                r="12"
                fill="rgba(239, 68, 68, 0.9)"
                className="hover:scale-110 transition-transform duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConnection(connection.id);
                }}
              />
              
              {/* Delete icon */}
              <text
                x={midX}
                y={midY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-white font-bold pointer-events-none select-none"
              >
                ×
              </text>
            </g>
            
            {/* Connection label on hover */}
            <g className="pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200">
              <rect
                x={midX - 30}
                y={midY - 20}
                width="60"
                height="16"
                rx="8"
                fill="rgba(0,0,0,0.8)"
              />
              <text
                x={midX}
                y={midY - 12}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-white"
              >
                Connection
              </text>
            </g>
          </g>
        );
      })}

      {/* Render drag connection */}
      {dragConnection && (
        <g>
          {/* Animated background path */}
          <path
            d={getDragConnectionPath()}
            stroke="rgba(16, 185, 129, 0.3)"
            strokeWidth="8"
            fill="none"
            strokeDasharray="12,8"
            className="animate-pulse"
          />
          
          {/* Main drag path */}
          <path
            d={getDragConnectionPath()}
            stroke="#10b981"
            strokeWidth="3"
            fill="none"
            strokeDasharray="8,4"
            markerEnd="url(#dragArrowhead)"
            className="animate-pulse"
          >
            {/* Animate the dash offset for flowing effect */}
            <animate
              attributeName="stroke-dashoffset"
              values="0;-24"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>
          
          {/* Connection indicator at target */}
          <circle
            cx={dragConnection.targetPosition.x}
            cy={dragConnection.targetPosition.y}
            r="8"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            className="animate-ping"
          />
          <circle
            cx={dragConnection.targetPosition.x}
            cy={dragConnection.targetPosition.y}
            r="4"
            fill="#10b981"
          />
        </g>
      )}
    </svg>
  );
};