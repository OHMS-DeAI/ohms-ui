import { useState, useCallback, useRef } from 'react';

export interface ConnectionHandle {
  id: string;
  nodeId: string;
  type: 'input' | 'output';
  position: { x: number; y: number };
}

export interface DragConnection {
  sourceHandle: ConnectionHandle;
  targetPosition: { x: number; y: number };
  isActive: boolean;
}

export interface SnapTarget {
  handle: ConnectionHandle;
  distance: number;
  isValid: boolean;
}

export const useConnectionManager = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragConnection, setDragConnection] = useState<DragConnection | null>(null);
  const [snapTarget, setSnapTarget] = useState<SnapTarget | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Start dragging a connection from a handle
  const startConnection = useCallback((
    handle: ConnectionHandle, 
    mousePosition: { x: number; y: number }
  ) => {
    setIsDragging(true);
    setDragConnection({
      sourceHandle: handle,
      targetPosition: mousePosition,
      isActive: true
    });
    dragStartRef.current = mousePosition;
  }, []);

  // Update connection during drag
  const updateConnection = useCallback((
    mousePosition: { x: number; y: number },
    availableHandles: ConnectionHandle[]
  ) => {
    if (!dragConnection) return;

    // Update target position
    setDragConnection(prev => prev ? {
      ...prev,
      targetPosition: mousePosition
    } : null);

    // Find potential snap targets
    const SNAP_DISTANCE = 30;
    let bestTarget: SnapTarget | null = null;

    for (const handle of availableHandles) {
      // Skip if same node or wrong type
      if (handle.nodeId === dragConnection.sourceHandle.nodeId) continue;
      if (handle.type === dragConnection.sourceHandle.type) continue;

      const distance = Math.sqrt(
        Math.pow(handle.position.x - mousePosition.x, 2) +
        Math.pow(handle.position.y - mousePosition.y, 2)
      );

      if (distance <= SNAP_DISTANCE) {
        if (!bestTarget || distance < bestTarget.distance) {
          bestTarget = {
            handle,
            distance,
            isValid: true
          };
        }
      }
    }

    setSnapTarget(bestTarget);
  }, [dragConnection]);

  // Complete connection
  const completeConnection = useCallback((
    onConnect: (sourceHandle: ConnectionHandle, targetHandle: ConnectionHandle) => void
  ) => {
    if (dragConnection && snapTarget?.isValid) {
      onConnect(dragConnection.sourceHandle, snapTarget.handle);
    }
    
    // Reset state
    setIsDragging(false);
    setDragConnection(null);
    setSnapTarget(null);
    setHoveredHandle(null);
    dragStartRef.current = null;
  }, [dragConnection, snapTarget]);

  // Cancel connection
  const cancelConnection = useCallback(() => {
    setIsDragging(false);
    setDragConnection(null);
    setSnapTarget(null);
    setHoveredHandle(null);
    dragStartRef.current = null;
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isDragging) {
      cancelConnection();
    }
  }, [isDragging, cancelConnection]);

  return {
    // State
    isDragging,
    dragConnection,
    snapTarget,
    hoveredHandle,
    
    // Actions
    startConnection,
    updateConnection,
    completeConnection,
    cancelConnection,
    setHoveredHandle,
    
    // Utils
    handleKeyDown
  };
};