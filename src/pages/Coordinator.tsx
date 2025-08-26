import React, { useState, useRef, useCallback } from 'react';
import { useAgent } from '../context/AgentContext';

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
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<WorkflowNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Available node types for the workflow
  const nodeTypes = [
    { type: 'trigger', label: 'Trigger', icon: '⚡', color: 'from-yellow-500 to-orange-500' },
    { type: 'agent', label: 'AI Agent', icon: '🤖', color: 'from-blue-500 to-purple-500' },
    { type: 'condition', label: 'Condition', icon: '🔀', color: 'from-green-500 to-teal-500' },
    { type: 'action', label: 'Action', icon: '⚙️', color: 'from-red-500 to-pink-500' },
  ];

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
    const sourceX = sourceNode.position.x + 80; // Node width / 2
    const sourceY = sourceNode.position.y + 40; // Node height / 2
    const targetX = targetNode.position.x + 80;
    const targetY = targetNode.position.y + 40;

    // Calculate control points for curved line
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Control point offset based on distance
    const offset = Math.min(distance * 0.3, 100);

    const cp1x = sourceX + offset;
    const cp1y = sourceY;
    const cp2x = targetX - offset;
    const cp2y = targetY;

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
  const handleNodeConnectionStart = useCallback((node: WorkflowNode) => {
    setConnectingFrom(node);
    setIsConnecting(true);
  }, []);

  // Handle node connection end
  const handleNodeConnectionEnd = useCallback((node: WorkflowNode) => {
    if (connectingFrom && connectingFrom.id !== node.id) {
      createConnection(connectingFrom, node);
    }
    setConnectingFrom(null);
    setIsConnecting(false);
  }, [connectingFrom, createConnection]);

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

  // Calculate optimal position for new node to avoid overlap
  const calculateOptimalPosition = useCallback((basePosition: { x: number; y: number }) => {
    if (!selectedWorkflow) return basePosition;

    const nodeWidth = 160; // Node width + padding
    const nodeHeight = 96; // Node height + padding
    let position = { ...basePosition };
    let attempts = 0;
    const maxAttempts = 50;

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

      // Try next position in a spiral pattern
      const angle = attempts * 0.5;
      const radius = 50 + attempts * 20;
      position.x = basePosition.x + Math.cos(angle) * radius;
      position.y = basePosition.y + Math.sin(angle) * radius;
      attempts++;
    }

    return position;
  }, [selectedWorkflow]);

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
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Node Palette */}
          <div className="col-span-3">
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

          {/* Main Canvas - Made Wider */}
          <div className="col-span-10 lg:col-span-11">
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

              {/* Canvas Area - Made Taller and Wider */}
              <div className="relative h-[600px] w-full overflow-auto">
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
                  >
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
                                {node.type === 'agent' && node.data.agentId ? 'Configured' :
                                 node.data.description || 'Click to configure'}
                              </div>
                            </div>
                          </div>

                          {/* Connection Points */}
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            <div
                              className="w-3 h-3 bg-white rounded-full border-2 border-gray-600 cursor-pointer hover:bg-secondary transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNodeConnectionStart(node);
                              }}
                            />
                          </div>
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                            <div
                              className="w-3 h-3 bg-white rounded-full border-2 border-gray-600 cursor-pointer hover:bg-secondary transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNodeConnectionEnd(node);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Connection Lines */}
                    <svg className="absolute inset-0 pointer-events-none">
                      {selectedWorkflow.connections.map((connection) => {
                        const sourceNode = selectedWorkflow.nodes.find(n => n.id === connection.sourceId);
                        const targetNode = selectedWorkflow.nodes.find(n => n.id === connection.targetId);

                        if (!sourceNode || !targetNode) return null;

                        // Calculate curved path
                        const path = calculateConnectionPath(sourceNode, targetNode);

                        return (
                          <g key={connection.id}>
                            <path
                              d={path}
                              stroke="var(--color-secondary)"
                              strokeWidth="2"
                              fill="none"
                              markerEnd="url(#arrowhead)"
                              className="hover:stroke-blue-400 transition-colors"
                            />
                            {/* Connection label */}
                            <text
                              x={(sourceNode.position.x + targetNode.position.x) / 2}
                              y={(sourceNode.position.y + targetNode.position.y) / 2 - 10}
                              textAnchor="middle"
                              className="text-xs fill-text-secondary pointer-events-auto cursor-pointer hover:fill-secondary"
                              onClick={() => {
                                // Remove connection
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
                        <marker id="arrowhead" markerWidth="10" markerHeight="7"
                               refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-secondary)" />
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
                      <button className="px-4 py-2 bg-accent-success/20 text-accent-success rounded-lg hover:bg-accent-success/30 transition-colors">
                        Run Workflow
                      </button>
                      <button className="px-4 py-2 bg-accent-warning/20 text-accent-warning rounded-lg hover:bg-accent-warning/30 transition-colors">
                        Pause
                      </button>
                      <button className="px-4 py-2 bg-accent-error/20 text-accent-error rounded-lg hover:bg-accent-error/30 transition-colors">
                        Stop
                      </button>
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
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Agent ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-primary border border-border rounded-lg text-text-primary"
                      placeholder="Enter agent ID"
                      value={selectedNode?.data?.agentId || ''}
                      onChange={(e) => {
                        const newConfig = { ...(selectedNode?.data?.config || {}), agentId: e.target.value };
                        updateNodeConfig(selectedNode?.id || '', newConfig);
                      }}
                    />
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
      </div>
    </div>
  );
};

export default Coordinator;
