import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAgent } from '../context/AgentContext';
import { 
  createAgentsFromInstructions, 
  executeCoordinatorWorkflow, 
  sendMessageToAgent, 
  bindAgentAndWireRoutes 
} from '../services/canisterService';

// Types for the workflow system
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
  path?: string; // SVG path for the connection line
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  status: 'draft' | 'active' | 'paused';
  created_at: Date;
  updated_at: Date;
}

const Coordinator: React.FC = () => {
  const { isConnected } = useAgent();
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<WorkflowNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [temporaryLine, setTemporaryLine] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);
  const [draggedNodePosition, setDraggedNodePosition] = useState<{id: string, x: number, y: number} | null>(null);
  const [showInteractionPanel, setShowInteractionPanel] = useState(false);
  const [selectedAgentForInteraction, setSelectedAgentForInteraction] = useState<string | null>(null);
  const [interactionMessage, setInteractionMessage] = useState('');
  const [interactionHistory, setInteractionHistory] = useState<{role: string, message: string, timestamp: Date}[]>([]);

  // Available node types for the workflow
  const nodeTypes = [
    { type: 'trigger', label: 'Trigger', icon: '⚡', color: 'from-yellow-500 to-orange-500' },
    { type: 'agent', label: 'AI Agent', icon: '🤖', color: 'from-blue-500 to-purple-500' },
    { type: 'condition', label: 'Condition', icon: '🔀', color: 'from-green-500 to-teal-500' },
    { type: 'action', label: 'Action', icon: '⚙️', color: 'from-red-500 to-pink-500' },
  ];

  // Calculate optimal position for new node to avoid overlap
  const calculateOptimalPosition = useCallback((basePosition: { x: number; y: number }) => {
    if (!selectedWorkflow) return basePosition;

    const nodeWidth = 180; // Node width + padding
    const nodeHeight = 120; // Node height + padding
    let position = { ...basePosition };
    let attempts = 0;
    const maxAttempts = 100;

    // Ensure minimum distance from edges
    const minX = nodeWidth / 2 + 20;
    const minY = nodeHeight / 2 + 20;
    const maxX = (canvasRef.current?.offsetWidth || 1200) - nodeWidth / 2 - 20;
    const maxY = (canvasRef.current?.offsetHeight || 800) - nodeHeight / 2 - 20;

    position.x = Math.max(minX, Math.min(maxX, position.x));
    position.y = Math.max(minY, Math.min(maxY, position.y));

    while (attempts < maxAttempts) {
      let hasOverlap = false;

      for (const node of selectedWorkflow.nodes) {
        const dx = Math.abs(position.x - node.position.x);
        const dy = Math.abs(position.y - node.position.y);

        if (dx < nodeWidth && dy < nodeHeight) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        return position;
      }

      // Try next position in a grid pattern first, then spiral
      if (attempts < 20) {
        const gridSize = 200;
        const row = Math.floor(attempts / 5);
        const col = attempts % 5;
        position.x = minX + col * gridSize;
        position.y = minY + row * gridSize;
      } else {
        // Spiral pattern for remaining attempts
        const angle = (attempts - 20) * 0.8;
        const radius = 100 + (attempts - 20) * 30;
        position.x = basePosition.x + Math.cos(angle) * radius;
        position.y = basePosition.y + Math.sin(angle) * radius;
      }

      // Keep within bounds
      position.x = Math.max(minX, Math.min(maxX, position.x));
      position.y = Math.max(minY, Math.min(maxY, position.y));
      
      attempts++;
    }

    return position;
  }, [selectedWorkflow]);

  // Create new workflow
  const createWorkflow = useCallback(() => {
    const newWorkflow: Workflow = {
      id: `wf_${Date.now()}`,
      name: 'New Workflow',
      description: 'A new multi-agent workflow',
      nodes: [],
      connections: [],
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date(),
    };
    setWorkflows(prev => [...prev, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    setIsCreating(false);
  }, []);

  // Add node to workflow
  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    if (!selectedWorkflow) return;

    const nodeType = nodeTypes.find(nt => nt.type === type);
    if (!nodeType) return;

    // Calculate optimal position to avoid overlap
    const optimalPosition = calculateOptimalPosition(position);

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: type as any,
      position: optimalPosition,
      data: {
        label: nodeType.label,
        description: `${nodeType.label} node`,
        config: {}, // Initialize config as empty object
      },
    };

    setSelectedWorkflow(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nodes: [...prev.nodes, newNode],
        updated_at: new Date(),
      };
    });
  }, [selectedWorkflow, nodeTypes, calculateOptimalPosition]);

  // Handle canvas drop
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    addNode(draggedNode.type, position);
    setDraggedNode(null);
  }, [draggedNode, addNode]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle node drag start
  const handleNodeDragStart = useCallback((node: WorkflowNode) => {
    setDraggedNode(node);
  }, []);

  // Calculate connection path between two nodes
  const calculateConnectionPath = useCallback((sourceNode: WorkflowNode, targetNode: WorkflowNode) => {
    // Use node center positions (nodes are 160px wide, 80px high)
    const sourceX = sourceNode.position.x + 80;
    const sourceY = sourceNode.position.y + 80; // Bottom of source node
    const targetX = targetNode.position.x + 80;
    const targetY = targetNode.position.y; // Top of target node

    // Calculate control points for smooth curved line
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Control point offset based on distance (minimum 60px for nice curves)
    const offset = Math.max(Math.min(distance * 0.4, 120), 60);

    // Control points for vertical flow
    const cp1x = sourceX;
    const cp1y = sourceY + offset;
    const cp2x = targetX;
    const cp2y = targetY - offset;

    return `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;
  }, []);

  // Create connection between nodes
  const createConnection = useCallback((sourceNode: WorkflowNode, targetNode: WorkflowNode) => {
    if (!selectedWorkflow || sourceNode.id === targetNode.id) return;

    const connectionId = `conn_${sourceNode.id}_${targetNode.id}`;
    const path = calculateConnectionPath(sourceNode, targetNode);

    const newConnection: WorkflowConnection = {
      id: connectionId,
      sourceId: sourceNode.id,
      targetId: targetNode.id,
      path,
    };

    setSelectedWorkflow(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        connections: [...prev.connections, newConnection],
        updated_at: new Date(),
      };
    });

    setIsConnecting(false);
    setConnectingFrom(null);
  }, [selectedWorkflow, calculateConnectionPath]);

  // Handle node connection start
  const handleNodeConnectionStart = useCallback((e: React.MouseEvent, node: WorkflowNode) => {
    e.stopPropagation();
    
    if (isConnecting && connectingFrom) {
      // If already connecting, cancel the current connection
      setConnectingFrom(null);
      setIsConnecting(false);
      setTemporaryLine(null);
      return;
    }
    
    // Start new connection
    setConnectingFrom(node);
    setIsConnecting(true);
    
    // Set up temporary line from node center
    const nodeX = node.position.x + 80; // Center of 160px wide node
    const nodeY = node.position.y + 40; // Center of 80px high node
    
    setTemporaryLine({
      x1: nodeX,
      y1: nodeY,
      x2: nodeX,
      y2: nodeY
    });
  }, [isConnecting, connectingFrom]);

  // Handle node connection end
  const handleNodeConnectionEnd = useCallback((e: React.MouseEvent, node: WorkflowNode) => {
    e.stopPropagation();
    
    if (!isConnecting || !connectingFrom) {
      return;
    }
    
    if (connectingFrom.id === node.id) {
      return;
    }
    
    // Create the connection
    createConnection(connectingFrom, node);
    
    // Reset connection state
    setConnectingFrom(null);
    setIsConnecting(false);
    setTemporaryLine(null);
  }, [isConnecting, connectingFrom, createConnection]);

  // Handle canvas mouse move for temporary line
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isConnecting || !connectingFrom || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setTemporaryLine(prev => prev ? { ...prev, x2: x, y2: y } : null);
  }, [isConnecting, connectingFrom]);

  // Handle node click for configuration
  const handleNodeClick = useCallback((node: WorkflowNode) => {
    setSelectedNode(node);
    setShowConfigPanel(true);
  }, []);

  // Update node configuration
  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, any>) => {
    if (!selectedWorkflow) return;

    setSelectedWorkflow(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nodes: prev.nodes.map(node =>
          node.id === nodeId ? { ...node, data: { ...node.data, config } } : node
        ),
        updated_at: new Date(),
      };
    });
  }, [selectedWorkflow]);

  // Execute workflow with real agents
  const executeWorkflow = useCallback(async () => {
    if (!selectedWorkflow) return;

    // Update workflow status
    setSelectedWorkflow(prev => {
      if (!prev) return prev;
      return { ...prev, status: 'active' as const };
    });

    try {
      // Use the new coordinator workflow execution service
      const result = await executeCoordinatorWorkflow(selectedWorkflow);

      if (result.success) {
        // Update nodes with agent IDs and responses
        setSelectedWorkflow(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            nodes: prev.nodes.map(node => {
              const nodeResult = result.results.find((r: any) => r.nodeId === node.id);
              if (nodeResult) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    config: {
                      ...node.data.config,
                      agentId: nodeResult.agentId,
                      status: 'running',
                      lastResponse: nodeResult.response
                    }
                  }
                };
              }
              return node;
            }),
            updated_at: new Date(),
          };
        });
      }
    } catch (error) {      
      // Update workflow status to error
      setSelectedWorkflow(prev => {
        if (!prev) return prev;
        return { ...prev, status: 'paused' as const };
      });
      
      // Show user-friendly error
      alert(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedWorkflow]);

  // Stop workflow execution
  const stopWorkflow = useCallback(() => {
    if (!selectedWorkflow) return;

    setSelectedWorkflow(prev => {
      if (!prev) return prev;
      return { 
        ...prev, 
        status: 'paused' as const,
        nodes: prev.nodes.map(node => ({
          ...node,
          data: { ...node.data, status: 'stopped' }
        }))
      };
    });
  }, [selectedWorkflow]);

  // Interact with agent
  const handleAgentInteraction = useCallback(async (agentId: string) => {
    if (!interactionMessage.trim()) return;

    const userMessage = interactionMessage.trim();
    setInteractionMessage('');

    // Add user message to history
    setInteractionHistory(prev => [
      ...prev,
      { role: 'user', message: userMessage, timestamp: new Date() }
    ]);

    try {
      const response = await sendMessageToAgent(agentId, userMessage);
      
      // Add agent response to history
      setInteractionHistory(prev => [
        ...prev,
        { role: 'agent', message: response.response, timestamp: new Date() }
      ]);

    } catch (error) {
      // Add error message to history
      setInteractionHistory(prev => [
        ...prev,
        { 
          role: 'system', 
          message: `Error: ${error instanceof Error ? error.message : 'Failed to communicate with agent'}`,
          timestamp: new Date() 
        }
      ]);
    }
  }, [interactionMessage]);

  // Open interaction panel for specific agent
  const openAgentInteraction = useCallback((agentId: string) => {
    setSelectedAgentForInteraction(agentId);
    setShowInteractionPanel(true);
    setInteractionHistory([]);
  }, []);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Coordinator Access Required</h1>
          <p className="text-text-secondary mb-6">
            Please authenticate to access the multi-agent coordinator interface.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <div className="border-b border-border bg-surface-light">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">Multi-Agent Coordinator</h1>
                <p className="text-sm text-text-secondary">Design and orchestrate complex AI workflows</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={createWorkflow}
                className="px-4 py-2 bg-gradient-to-r from-secondary to-accent text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Workflow
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar - Node Palette */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-surface rounded-2xl p-6 border border-border">
              <h3 className="text-lg font-bold text-text-primary mb-4">Node Palette</h3>

              <div className="space-y-3">
                {nodeTypes.map((nodeType) => (
                  <div
                    key={nodeType.type}
                    draggable
                    onDragStart={() => setDraggedNode({
                      id: '',
                      type: nodeType.type as any,
                      position: { x: 0, y: 0 },
                      data: { label: nodeType.label },
                    })}
                    className={`p-4 rounded-xl border border-border cursor-move hover:shadow-lg transition-all duration-300 bg-gradient-to-r ${nodeType.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{nodeType.icon}</span>
                      <div>
                        <div className="font-semibold text-white">{nodeType.label}</div>
                        <div className="text-xs text-white/80">Drag to canvas</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Workflow List */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-bold text-text-primary mb-3">Your Workflows</h4>
                <div className="space-y-2">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      onClick={() => setSelectedWorkflow(workflow)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedWorkflow?.id === workflow.id
                          ? 'bg-secondary/20 border border-secondary/30'
                          : 'hover:bg-surface-light'
                      }`}
                    >
                      <div className="font-medium text-text-primary text-sm">{workflow.name}</div>
                      <div className="text-xs text-text-secondary">
                        {workflow.nodes.length} nodes • {workflow.status}
                      </div>
                    </div>
                  ))}
                  {workflows.length === 0 && (
                    <div className="text-center text-text-secondary py-4">
                      <p className="text-sm">No workflows yet</p>
                      <p className="text-xs mt-1">Create your first workflow above</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Canvas - Full Width */}
          <div className="flex-1 min-w-0">
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              {/* Canvas Header */}
              <div className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">
                      {selectedWorkflow ? selectedWorkflow.name : 'Select or Create Workflow'}
                    </h2>
                    {selectedWorkflow && (
                      <p className="text-sm text-text-secondary">
                        {selectedWorkflow.nodes.length} nodes • {selectedWorkflow.connections.length} connections
                      </p>
                    )}
                  </div>

                  {selectedWorkflow && (
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedWorkflow.status === 'active'
                          ? 'bg-accent-success/20 text-accent-success'
                          : selectedWorkflow.status === 'paused'
                          ? 'bg-accent-warning/20 text-accent-warning'
                          : 'bg-text-secondary/20 text-text-secondary'
                      }`}>
                        {selectedWorkflow.status}
                      </span>

                      <button className="px-4 py-2 bg-secondary text-white rounded-lg hover:shadow-lg transition-all duration-300">
                        Save Workflow
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Canvas Area - Full Height */}
              <div className="relative h-[calc(100vh-350px)] w-full overflow-hidden">
                {!selectedWorkflow ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-text-primary mb-2">No Workflow Selected</h3>
                      <p className="text-text-secondary mb-4">Create or select a workflow to start building</p>
                      <button
                        onClick={createWorkflow}
                        className="px-6 py-3 bg-gradient-to-r from-secondary to-accent text-white rounded-lg hover:shadow-lg transition-all duration-300"
                      >
                        Create New Workflow
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={canvasRef}
                    className="w-full h-full bg-gradient-to-br from-primary/50 to-primary relative"
                    onDrop={handleCanvasDrop}
                    onDragOver={handleDragOver}
                    onMouseMove={handleCanvasMouseMove}
                  >
                    {/* Connection Status Indicator */}
                    {isConnecting && connectingFrom && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-accent-success/90 text-white px-4 py-2 rounded-lg shadow-lg z-10 flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                        <span className="text-sm font-medium">
                          Connecting from "{connectingFrom.data.label}" - Click a target node
                        </span>
                        <button
                          onClick={() => {
                            setIsConnecting(false);
                            setConnectingFrom(null);
                            setTemporaryLine(null);
                          }}
                          className="text-white hover:text-gray-200"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-20">
                      <svg width="100%" height="100%" className="text-border">
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>

                    {/* Render Nodes */}
                    {selectedWorkflow.nodes.map((node) => {
                      const nodeType = nodeTypes.find(nt => nt.type === node.type);
                      return (
                        <div
                          key={node.id}
                          className={`absolute w-40 h-24 rounded-xl border border-border shadow-lg cursor-pointer bg-gradient-to-r ${nodeType?.color || 'from-gray-500 to-gray-600'} flex flex-col items-center justify-center text-white font-semibold text-sm hover:shadow-xl transition-all duration-300`}
                          style={{
                            left: node.position.x,
                            top: node.position.y,
                            transform: 'translate(-50%, -50%)',
                          }}
                          onClick={() => handleNodeClick(node)}
                          draggable
                          onDragStart={() => handleNodeDragStart(node)}
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

                          {/* Connection Points */}
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            <div
                              className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all duration-200 ${
                                isConnecting && connectingFrom?.id === node.id
                                  ? 'bg-secondary border-secondary shadow-lg scale-125'
                                  : isConnecting && connectingFrom && connectingFrom.id !== node.id
                                  ? 'bg-accent-success border-accent-success hover:scale-110 animate-pulse'
                                  : 'bg-white border-gray-600 hover:bg-secondary hover:border-secondary hover:scale-110'
                              }`}
                              onClick={(e) => {
                                handleNodeConnectionStart(e, node);
                              }}
                              title="Click to start connection"
                            />
                          </div>
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                            <div
                              className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all duration-200 ${
                                isConnecting && connectingFrom && connectingFrom.id !== node.id
                                  ? 'bg-accent-success border-accent-success hover:scale-110 animate-pulse'
                                  : isConnecting && connectingFrom?.id === node.id
                                  ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                                  : 'bg-white border-gray-600 hover:bg-accent-success hover:border-accent-success hover:scale-110'
                              }`}
                              onClick={(e) => {
                                handleNodeConnectionEnd(e, node);
                              }}
                              title={isConnecting ? "Click to complete connection" : "Connection target"}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Connection Lines */}
                    <svg 
                      ref={svgRef}
                      className="absolute inset-0 pointer-events-none w-full h-full"
                      style={{ zIndex: 1 }}
                    >
                      {/* Temporary connection line */}
                      {temporaryLine && (
                        <g>
                          <line
                            x1={temporaryLine.x1}
                            y1={temporaryLine.y1}
                            x2={temporaryLine.x2}
                            y2={temporaryLine.y2}
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeDasharray="8,4"
                            className="animate-pulse"
                          />
                          {/* Connection indicator at end */}
                          <circle
                            cx={temporaryLine.x2}
                            cy={temporaryLine.y2}
                            r="6"
                            fill="#10b981"
                            className="animate-ping"
                          />
                          <circle
                            cx={temporaryLine.x2}
                            cy={temporaryLine.y2}
                            r="3"
                            fill="#ffffff"
                          />
                        </g>
                      )}
                      
                      {selectedWorkflow.connections.map((connection) => {
                        const sourceNode = selectedWorkflow.nodes.find(n => n.id === connection.sourceId);
                        const targetNode = selectedWorkflow.nodes.find(n => n.id === connection.targetId);

                        if (!sourceNode || !targetNode) return null;

                        // Calculate curved path
                        const path = calculateConnectionPath(sourceNode, targetNode);

                        return (
                          <g key={connection.id}>
                            {/* Shadow for better visibility */}
                            <path
                              d={path}
                              stroke="rgba(0,0,0,0.2)"
                              strokeWidth="4"
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
                              className="hover:stroke-blue-400 transition-colors cursor-pointer"
                            />
                            {/* Connection delete button */}
                            <circle
                              cx={(sourceNode.position.x + targetNode.position.x) / 2 + 80}
                              cy={(sourceNode.position.y + targetNode.position.y) / 2 + 40}
                              r="10"
                              fill="rgba(239, 68, 68, 0.9)"
                              className="pointer-events-auto cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setSelectedWorkflow(prev => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    connections: prev.connections.filter(c => c.id !== connection.id),
                                    updated_at: new Date(),
                                  };
                                });
                              }}
                            />
                            <text
                              x={(sourceNode.position.x + targetNode.position.x) / 2 + 80}
                              y={(sourceNode.position.y + targetNode.position.y) / 2 + 45}
                              textAnchor="middle"
                              className="text-xs fill-white pointer-events-auto cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setSelectedWorkflow(prev => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    connections: prev.connections.filter(c => c.id !== connection.id),
                                    updated_at: new Date(),
                                  };
                                });
                              }}
                            >
                              ×
                            </text>
                          </g>
                        );
                      })}
                      <defs>
                        <marker id="arrowhead" markerWidth="12" markerHeight="8"
                               refX="11" refY="4" orient="auto">
                          <polygon points="0 0, 12 4, 0 8" fill="#6366f1" />
                        </marker>
                      </defs>
                    </svg>

                    {/* Empty State */}
                    {selectedWorkflow.nodes.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-text-secondary">
                          <p className="text-lg mb-2">Drag nodes here to build your workflow</p>
                          <p className="text-sm">Start with a trigger, add agents, and connect them with actions</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Workflow Controls */}
              {selectedWorkflow && (
                <div className="border-t border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {selectedWorkflow.status === 'active' ? (
                        <>
                          <div className="px-4 py-2 bg-accent-success/20 text-accent-success rounded-lg flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent-success rounded-full animate-pulse"></div>
                            Running
                          </div>
                          <button 
                            onClick={stopWorkflow}
                            className="px-4 py-2 bg-accent-error/20 text-accent-error rounded-lg hover:bg-accent-error/30 transition-colors"
                          >
                            Stop Workflow
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={executeWorkflow}
                          disabled={selectedWorkflow.nodes.length === 0}
                          className="px-4 py-2 bg-accent-success/20 text-accent-success rounded-lg hover:bg-accent-success/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-4h1M4 7h22M4 7a2 2 0 012-2h12a2 2 0 012 2M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7H2a2 2 0 00-2 2v10a2 2 0 002 2h2" />
                          </svg>
                          Execute Workflow
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <span>Execution Time: 0s</span>
                      <span>•</span>
                      <span>Status: Ready</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        {showConfigPanel && selectedNode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">
                  Configure {selectedNode?.data?.label || 'Node'}
                </h3>
                <button
                  onClick={() => setShowConfigPanel(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Node-specific configuration */}
                {selectedNode?.type === 'agent' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Agent Instructions
                      </label>
                      <textarea
                        className="w-full px-3 py-2 bg-primary border border-border rounded-lg text-text-primary"
                        placeholder="Enter detailed instructions for the agent..."
                        rows={4}
                        value={selectedNode?.data?.config?.instructions || ''}
                        onChange={(e) => {
                          const newConfig = { ...(selectedNode?.data?.config || {}), instructions: e.target.value };
                          updateNodeConfig(selectedNode?.id || '', newConfig);
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Agent Capabilities
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-primary border border-border rounded-lg text-text-primary"
                        placeholder="e.g., data_analysis, communication, automation"
                        value={(selectedNode?.data?.config?.capabilities || []).join(', ')}
                        onChange={(e) => {
                          const capabilities = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                          const newConfig = { ...(selectedNode?.data?.config || {}), capabilities };
                          updateNodeConfig(selectedNode?.id || '', newConfig);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Priority Level
                      </label>
                      <select
                        className="w-full px-3 py-2 bg-primary border border-border rounded-lg text-text-primary"
                        value={selectedNode?.data?.config?.priority || 'normal'}
                        onChange={(e) => {
                          const newConfig = { ...(selectedNode?.data?.config || {}), priority: e.target.value };
                          updateNodeConfig(selectedNode?.id || '', newConfig);
                        }}
                      >
                        <option value="low">Low Priority</option>
                        <option value="normal">Normal Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    {selectedNode?.data?.config?.agentId && (
                      <div className="p-3 bg-accent-success/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-accent-success rounded-full"></div>
                              <span className="text-sm text-accent-success font-medium">Agent Created</span>
                            </div>
                            <p className="text-xs text-accent-success mt-1">
                              ID: {selectedNode.data.config.agentId}
                            </p>
                          </div>
                          <button
                            onClick={() => openAgentInteraction(selectedNode.data.config?.agentId || '')}
                            className="px-3 py-1 bg-accent-success/30 text-accent-success rounded text-xs hover:bg-accent-success/40 transition-colors"
                          >
                            Chat
                          </button>
                        </div>
                        {selectedNode.data.config.lastResponse && (
                          <div className="mt-2 p-2 bg-primary/50 rounded text-xs">
                            <div className="text-text-secondary mb-1">Last Response:</div>
                            <div className="text-text-primary">{selectedNode.data.config.lastResponse}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedNode?.type === 'trigger' && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Trigger Type
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-primary border border-border rounded-lg text-text-primary"
                      value={selectedNode?.data?.config?.triggerType || 'manual'}
                      onChange={(e) => {
                        const newConfig = { ...(selectedNode?.data?.config || {}), triggerType: e.target.value };
                        updateNodeConfig(selectedNode?.id || '', newConfig);
                      }}
                    >
                      <option value="manual">Manual</option>
                      <option value="timer">Timer</option>
                      <option value="webhook">Webhook</option>
                      <option value="event">Event</option>
                    </select>
                  </div>
                )}

                {selectedNode?.type === 'condition' && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Condition Expression
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-primary border border-border rounded-lg text-text-primary"
                      placeholder="Enter condition logic"
                      rows={3}
                      value={selectedNode?.data?.config?.condition || ''}
                      onChange={(e) => {
                        const newConfig = { ...(selectedNode?.data?.config || {}), condition: e.target.value };
                        updateNodeConfig(selectedNode?.id || '', newConfig);
                      }}
                    />
                  </div>
                )}

                {selectedNode?.type === 'action' && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Action Type
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-primary border border-border rounded-lg text-text-primary"
                      value={selectedNode?.data?.config?.actionType || 'http'}
                      onChange={(e) => {
                        const newConfig = { ...(selectedNode?.data?.config || {}), actionType: e.target.value };
                        updateNodeConfig(selectedNode?.id || '', newConfig);
                      }}
                    >
                      <option value="http">HTTP Request</option>
                      <option value="email">Send Email</option>
                      <option value="database">Database Query</option>
                      <option value="notification">Send Notification</option>
                    </select>
                  </div>
                )}

                {/* Common configuration */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 bg-primary border border-border rounded-lg text-text-primary"
                    placeholder="Enter description"
                    rows={2}
                    value={selectedNode?.data?.description || ''}
                    onChange={(e) => {
                      setSelectedWorkflow(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          nodes: prev.nodes.map(node =>
                            node.id === selectedNode?.id
                              ? { ...node, data: { ...node.data, description: e.target.value } }
                              : node
                          ),
                          updated_at: new Date(),
                        };
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConfigPanel(false)}
                  className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Save Configuration
                </button>
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    setShowConfigPanel(false);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agent Interaction Panel */}
        {showInteractionPanel && selectedAgentForInteraction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full mx-4 h-[600px] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-lg font-bold text-text-primary">
                  Chat with Agent: {selectedAgentForInteraction}
                </h3>
                <button
                  onClick={() => setShowInteractionPanel(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {interactionHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-text-secondary">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p>Start a conversation with your agent</p>
                      <p className="text-sm mt-1">Ask questions or give it tasks to complete</p>
                    </div>
                  </div>
                ) : (
                  interactionHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user' 
                          ? 'bg-secondary text-white' 
                          : msg.role === 'system' 
                          ? 'bg-accent-error/20 text-accent-error'
                          : 'bg-surface-light text-text-primary border border-border'
                      }`}>
                        <div className="text-sm">{msg.message}</div>
                        <div className={`text-xs mt-1 ${
                          msg.role === 'user' ? 'text-white/70' : 'text-text-secondary'
                        }`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-border p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={interactionMessage}
                    onChange={(e) => setInteractionMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAgentInteraction(selectedAgentForInteraction);
                      }
                    }}
                    placeholder="Type your message to the agent..."
                    className="flex-1 px-3 py-2 bg-primary border border-border rounded-lg text-text-primary"
                  />
                  <button
                    onClick={() => handleAgentInteraction(selectedAgentForInteraction)}
                    disabled={!interactionMessage.trim()}
                    className="px-4 py-2 bg-secondary text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
                <div className="text-xs text-text-secondary mt-2">
                  Press Enter to send or click the Send button
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Coordinator;
