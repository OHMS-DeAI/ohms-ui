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

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: type as any,
      position,
      data: {
        label: nodeType.label,
        description: `${nodeType.label} node`,
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
  }, [selectedWorkflow, nodeTypes]);

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

          {/* Main Canvas */}
          <div className="col-span-9">
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

              {/* Canvas Area */}
              <div className="relative h-96 overflow-hidden">
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
                          className={`absolute w-32 h-20 rounded-xl border border-border shadow-lg cursor-move bg-gradient-to-r ${nodeType?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white font-semibold text-sm`}
                          style={{
                            left: node.position.x,
                            top: node.position.y,
                            transform: 'translate(-50%, -50%)',
                          }}
                          draggable
                          onDragStart={() => handleNodeDragStart(node)}
                        >
                          <div className="text-center">
                            <div className="text-lg mb-1">{nodeType?.icon}</div>
                            <div className="text-xs">{node.data.label}</div>
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

                        return (
                          <line
                            key={connection.id}
                            x1={sourceNode.position.x}
                            y1={sourceNode.position.y}
                            x2={targetNode.position.x}
                            y2={targetNode.position.y}
                            stroke="var(--color-secondary)"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                          />
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
      </div>
    </div>
  );
};

export default Coordinator;
