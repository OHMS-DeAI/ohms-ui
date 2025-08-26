import React from 'react';
import type { ConnectionHandle as ConnectionHandleType } from '../../hooks/useConnectionManager';

interface ConnectionHandleProps {
  handle: ConnectionHandleType;
  isConnecting: boolean;
  isValidTarget: boolean;
  isHovered: boolean;
  isSnapping: boolean;
  onMouseDown: (handle: ConnectionHandleType, event: React.MouseEvent) => void;
  onMouseEnter: (handle: ConnectionHandleType) => void;
  onMouseLeave: () => void;
  className?: string;
}

export const ConnectionHandleComponent: React.FC<ConnectionHandleProps> = ({
  handle,
  isConnecting,
  isValidTarget,
  isHovered,
  isSnapping,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  className = ''
}) => {
  const getHandleClasses = () => {
    let classes = 'absolute w-4 h-4 rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-110 ';
    
    if (isSnapping) {
      classes += 'bg-green-400 border-green-400 shadow-lg scale-125 animate-pulse ';
    } else if (isConnecting && isValidTarget) {
      classes += 'bg-blue-400 border-blue-400 hover:scale-125 animate-pulse ';
    } else if (isConnecting && !isValidTarget) {
      classes += 'bg-gray-400 border-gray-400 cursor-not-allowed opacity-50 ';
    } else if (isHovered) {
      classes += 'bg-blue-400 border-blue-400 shadow-md scale-110 ';
    } else {
      classes += handle.type === 'input' 
        ? 'bg-white border-indigo-400 hover:bg-indigo-400 hover:border-indigo-400 '
        : 'bg-indigo-400 border-indigo-400 hover:bg-indigo-500 hover:border-indigo-500 ';
    }
    
    return classes + className;
  };

  const getTooltip = () => {
    if (isConnecting && isValidTarget) {
      return 'Drop to connect';
    } else if (isConnecting && !isValidTarget) {
      return 'Invalid target';
    } else {
      return handle.type === 'input' ? 'Connection input' : 'Drag to connect';
    }
  };

  return (
    <div
      className={getHandleClasses()}
      style={{
        left: handle.position.x - 8, // Center the 16px handle
        top: handle.position.y - 8
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (handle.type === 'output' || !isConnecting) {
          onMouseDown(handle, e);
        }
      }}
      onMouseEnter={() => onMouseEnter(handle)}
      onMouseLeave={onMouseLeave}
      title={getTooltip()}
    >
      {/* Inner dot for better visibility */}
      <div className={`absolute inset-1 rounded-full ${
        isSnapping ? 'bg-white' :
        handle.type === 'input' ? 'bg-indigo-400' : 'bg-white'
      }`} />
      
      {/* Connection indicator */}
      {isSnapping && (
        <div className="absolute -inset-2 rounded-full bg-green-400/30 animate-ping" />
      )}
    </div>
  );
};