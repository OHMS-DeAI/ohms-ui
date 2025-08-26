import React, { memo } from 'react';
import type { ConnectionHandle } from '../../hooks/useConnectionManager';
import { ConnectionHandleComponent } from './ConnectionHandle';

// Types
interface WorkflowNodeType {
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

interface NodeType {
  type: string;
  label: string;
  icon: string;
  color: string;
}

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  nodeType: NodeType | undefined;
  handles: ConnectionHandle[];
  isConnecting: boolean;
  hoveredHandle: string | null;
  snapTarget: { handle: { id: string } } | null;
  onNodeClick: (node: WorkflowNodeType) => void;
  onNodeDragStart: (node: WorkflowNodeType) => void;
  onConnectionStart: (handle: ConnectionHandle, event: React.MouseEvent) => void;
  onHandleMouseEnter: (handleId: string) => void;
  onHandleMouseLeave: () => void;
}

export const WorkflowNodeComponent = memo<WorkflowNodeProps>(({
  node,
  nodeType,
  handles,
  isConnecting,
  hoveredHandle,
  snapTarget,
  onNodeClick,
  onNodeDragStart,
  onConnectionStart,
  onHandleMouseEnter,
  onHandleMouseLeave
}) => {
  return (
    <div key={node.id}>
      {/* Node */}
      <div
        className={`absolute w-40 h-24 rounded-xl border border-border shadow-lg cursor-pointer bg-gradient-to-r ${
          nodeType?.color || 'from-gray-500 to-gray-600'
        } flex flex-col items-center justify-center text-white font-semibold text-sm hover:shadow-xl transition-all duration-300`}
        style={{
          left: node.position.x,
          top: node.position.y,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isConnecting) {
            onNodeClick(node);
          }
        }}
        draggable={!isConnecting}
        onDragStart={() => !isConnecting && onNodeDragStart(node)}
      >
        {/* Node Header */}
        <div className="flex items-center justify-between w-full px-3 py-1 border-b border-white/20">
          <span className="text-xs font-medium">{node.data.label}</span>
          <div className="text-sm">{nodeType?.icon}</div>
        </div>

        {/* Node Content */}
        <div className="flex-1 flex items-center justify-center px-3 py-2">
          <div className="text-center">
            <div className="text-xs opacity-90">
              {node.type === 'agent' && node.data.config?.agentId ? (
                <div className="flex items-center gap-1 justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    node.data.config?.status === 'running' ? 'bg-green-400 animate-pulse' : 
                    node.data.config?.status === 'stopped' ? 'bg-red-400' : 
                    'bg-blue-400'
                  }`}></div>
                  <span>
                    {node.data.config?.status === 'running' ? 'Running' : 
                     node.data.config?.status === 'stopped' ? 'Stopped' : 
                     'Ready'}
                  </span>
                </div>
              ) : node.type === 'agent' && node.data.config?.instructions ? (
                'Configured'
              ) : (
                'Click to configure'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Handles */}
      {handles.map((handle) => (
        <ConnectionHandleComponent
          key={handle.id}
          handle={handle}
          isConnecting={isConnecting}
          isValidTarget={
            isConnecting && 
            handle.nodeId !== node.id &&
            handle.type === 'input' // Only inputs can be valid targets
          }
          isHovered={hoveredHandle === handle.id}
          isSnapping={snapTarget?.handle.id === handle.id}
          onMouseDown={onConnectionStart}
          onMouseEnter={(handle) => onHandleMouseEnter(handle.id)}
          onMouseLeave={onHandleMouseLeave}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.position.x === nextProps.node.position.x &&
    prevProps.node.position.y === nextProps.node.position.y &&
    prevProps.node.data.label === nextProps.node.data.label &&
    JSON.stringify(prevProps.node.data.config) === JSON.stringify(nextProps.node.data.config) &&
    prevProps.isConnecting === nextProps.isConnecting &&
    prevProps.hoveredHandle === nextProps.hoveredHandle &&
    prevProps.snapTarget?.handle.id === nextProps.snapTarget?.handle.id
  );
});

WorkflowNodeComponent.displayName = 'WorkflowNode';