import React from 'react';
import { GitBranch } from 'lucide-react';
import { createPanelDefinition, PanelCategories } from './BasePanelInterface';
import { App as EditorApp } from '@/components/App/App';
import '@/styles/globals.css';
import axios from 'axios';

// Create a dedicated API client for the Flowchart Panel backend
// This points to the Figma X6 Editor backend which has the MCP routes
const flowchartApiClient = axios.create({
    baseURL: import.meta.env.VITE_FLOWCHART_API_URL || 'http://localhost:3002',
});

// Wrapper component ensures the editor takes full height
function FlowchartPanelWrapper() {
    return (
        <div className="h-full w-full relative overflow-hidden bg-white">
            <EditorApp />
        </div>
    );
}

// Available shapes in the flowchart editor
const AVAILABLE_SHAPES = [
    'custom-rect',
    'custom-rounded-rect',
    'custom-ellipse',
    'custom-diamond',
    'custom-triangle',
    'custom-hexagon',
    'custom-star',
    'custom-pentagon',
    'custom-parallelogram',
    'custom-trapezoid',
    'custom-cylinder',
    'custom-document',
    'custom-note',
    'custom-cloud',
    'custom-callout',
    'custom-cube',
    'custom-arrow-right',
    'custom-actor',
];

const FlowchartPanel = createPanelDefinition({
    id: 'flowchart',
    name: 'Flowchart Editor',
    description: 'Professional diagram editor powered by X6',
    icon: GitBranch,
    category: PanelCategories.CREATION,

    renderMainView: (props) => <FlowchartPanelWrapper {...props} />,

    // We'll leave the state handling to the internal store for now,
    // but we can map it to the panel state later if needed for LLM interaction.
    getInitialState: () => ({}),

    /**
     * Get MCP tools exposed by the Flowchart Panel
     * These tools allow the LLM to manipulate the flowchart canvas
     */
    getMCPTools: async () => [
        {
            name: 'get_canvas_state',
            description: 'Get the current state of the canvas including all nodes, edges, viewport, and selected elements',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
        {
            name: 'create_shape',
            description: 'Create a new shape/node on the canvas',
            inputSchema: {
                type: 'object',
                properties: {
                    shape: {
                        type: 'string',
                        description: 'Shape type (e.g., custom-rect, custom-ellipse, custom-diamond)',
                        enum: AVAILABLE_SHAPES,
                    },
                    x: { type: 'number', description: 'X coordinate' },
                    y: { type: 'number', description: 'Y coordinate' },
                    width: { type: 'number', description: 'Width' },
                    height: { type: 'number', description: 'Height' },
                    label: { type: 'string', description: 'Label text' },
                    fill: { type: 'string', description: 'Fill color (hex)' },
                    stroke: { type: 'string', description: 'Stroke color (hex)' },
                    strokeWidth: { type: 'number', description: 'Stroke width' },
                    rx: { type: 'number', description: 'Border radius X' },
                    ry: { type: 'number', description: 'Border radius Y' },
                    labelFill: { type: 'string', description: 'Label text color (hex)' },
                    fontSize: { type: 'number', description: 'Font size' },
                    fontWeight: { type: 'number', description: 'Font weight' },
                },
                required: [],
            },
        },
        {
            name: 'update_shape',
            description: 'Update properties of an existing shape/node',
            inputSchema: {
                type: 'object',
                properties: {
                    nodeId: { type: 'string', description: 'ID of the node to update' },
                    shape: { type: 'string', enum: AVAILABLE_SHAPES },
                    x: { type: 'number' },
                    y: { type: 'number' },
                    width: { type: 'number' },
                    height: { type: 'number' },
                    label: { type: 'string' },
                    fill: { type: 'string' },
                    stroke: { type: 'string' },
                    strokeWidth: { type: 'number' },
                    rx: { type: 'number' },
                    ry: { type: 'number' },
                    labelFill: { type: 'string' },
                    fontSize: { type: 'number' },
                    fontWeight: { type: 'number' },
                },
                required: ['nodeId'],
            },
        },
        {
            name: 'delete_shape',
            description: 'Delete a shape/node from the canvas',
            inputSchema: {
                type: 'object',
                properties: {
                    nodeId: { type: 'string', description: 'ID of the node to delete' },
                },
                required: ['nodeId'],
            },
        },
        {
            name: 'create_edge',
            description: 'Create a connection/edge between two nodes',
            inputSchema: {
                type: 'object',
                properties: {
                    source: { type: 'string', description: 'Source node ID' },
                    target: { type: 'string', description: 'Target node ID' },
                    label: { type: 'string', description: 'Edge label' },
                    stroke: { type: 'string', description: 'Stroke color' },
                    strokeWidth: { type: 'number', description: 'Stroke width' },
                    strokeDasharray: { type: 'string', description: 'Dash pattern (e.g., "5,5" for dashed)' },
                },
                required: ['source', 'target'],
            },
        },
        {
            name: 'delete_edge',
            description: 'Delete an edge/connection',
            inputSchema: {
                type: 'object',
                properties: {
                    edgeId: { type: 'string', description: 'ID of the edge to delete' },
                },
                required: ['edgeId'],
            },
        },
        {
            name: 'clear_canvas',
            description: 'Clear all nodes and edges from the canvas',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
        {
            name: 'select_nodes',
            description: 'Select one or more nodes',
            inputSchema: {
                type: 'object',
                properties: {
                    nodeIds: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of node IDs to select',
                    },
                },
                required: ['nodeIds'],
            },
        },
        {
            name: 'get_node_info',
            description: 'Get detailed information about a specific node',
            inputSchema: {
                type: 'object',
                properties: {
                    nodeId: { type: 'string', description: 'ID of the node' },
                },
                required: ['nodeId'],
            },
        },
        {
            name: 'list_shapes',
            description: 'List all available shape types',
            inputSchema: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    ],

    /**
     * Execute MCP tools on this panel
     * Routes tool calls to the backend MCP API endpoints
     */
    executeMCPTool: async (name, args, panelState, updateState) => {
        try {
            let result;
            switch (name) {
                case 'get_canvas_state':
                    result = await flowchartApiClient.get('/api/mcp/canvas/state');
                    return { success: true, ...result.data };

                case 'create_shape':
                    result = await flowchartApiClient.post('/api/mcp/canvas/shapes', args);
                    return { success: true, ...result.data };

                case 'update_shape':
                    if (!args.nodeId) {
                        throw new Error('nodeId is required');
                    }
                    result = await flowchartApiClient.put(`/api/mcp/canvas/shapes/${args.nodeId}`, args);
                    return { success: true, ...result.data };

                case 'delete_shape':
                    if (!args.nodeId) {
                        throw new Error('nodeId is required');
                    }
                    result = await flowchartApiClient.delete(`/api/mcp/canvas/shapes/${args.nodeId}`);
                    return { success: true, ...result.data };

                case 'create_edge':
                    result = await flowchartApiClient.post('/api/mcp/canvas/edges', args);
                    return { success: true, ...result.data };

                case 'delete_edge':
                    if (!args.edgeId) {
                        throw new Error('edgeId is required');
                    }
                    result = await flowchartApiClient.delete(`/api/mcp/canvas/edges/${args.edgeId}`);
                    return { success: true, ...result.data };

                case 'clear_canvas':
                    result = await flowchartApiClient.post('/api/mcp/canvas/clear');
                    return { success: true, ...result.data };

                case 'select_nodes':
                    result = await flowchartApiClient.post('/api/mcp/canvas/select', args);
                    return { success: true, ...result.data };

                case 'get_node_info':
                    if (!args.nodeId) {
                        throw new Error('nodeId is required');
                    }
                    result = await flowchartApiClient.get(`/api/mcp/canvas/nodes/${args.nodeId}`);
                    return { success: true, ...result.data };

                case 'list_shapes':
                    result = await flowchartApiClient.get('/api/mcp/canvas/shapes');
                    return { success: true, ...result.data };

                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        } catch (error) {
            console.error(`FlowchartPanel MCP tool error (${name}):`, error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || 'Unknown error',
            };
        }
    },
});

export default FlowchartPanel;
