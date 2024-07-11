import ELK, {
    ElkEdge,
    ElkExtendedEdge,
    ElkNode,
} from "elkjs/lib/elk.bundled.js";
import React, {
    ComponentType,
    FunctionComponent,
    useCallback,
    useLayoutEffect,
} from "react";
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    Panel,
    useNodesState,
    useEdgesState,
    useReactFlow,
    Node as XYFlowNode,
    Edge as XYFlowEdge,
    Handle,
    Position,
    MarkerType,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { Tag } from "@mwdb-web/types/types";

const elk = new ELK();

const elkOptions = {
    "elk.algorithm": "layered",
    "elk.layered.spacing.nodeNodeBetweenLayers": "100",
    "elk.spacing.nodeNode": "80",
    "elk.direction": "RIGHT",
};

type XYFlowGraph = {
    nodes: XYFlowNode[];
    edges: XYFlowEdge[];
};

type LayoutedNodeType = ElkNode & XYFlowNode;

async function layoutElements({
    nodes,
    edges,
}: XYFlowGraph): Promise<XYFlowGraph> {
    const graph: ElkNode = {
        id: "root",
        layoutOptions: elkOptions,
        children: nodes.map((node) => ({
            ...node,
            targetPosition: "left",
            sourcePosition: "top",
            width: 200,
            height: 210,
        })),
        edges: edges.map((edge) => ({
            ...edge,
            sources: [edge.source],
            targets: [edge.target],
        })),
    };

    const layoutedGraph = (await elk.layout(graph)) as LayoutedNodeType;
    const layoutedNodes = layoutedGraph.children as LayoutedNodeType[];
    return {
        nodes: layoutedNodes.map((node) => ({
            ...node,
            position: { x: node.x as number, y: node.y as number },
        })),
        edges: edges,
    };
}

type MWDBPlotNode = {
    id: string;
    expanded: boolean;
    object: {
        tags: Tag[];
        type: string;
        upload_time: string;
    };
};

type MWDBPlotEdge = {
    child: string;
    parent: string;
};

type MWDBGraph = {
    nodes: MWDBPlotNode[];
    edges: MWDBPlotEdge[];
};

type LayoutFlowNodeProps = {
    data: any;
    isConnectable: boolean;
};

function LayoutFlowNode({ data, isConnectable }: LayoutFlowNodeProps) {
    const NodeComponent = data.nodeComponent;
    return (
        <div
            style={{
                width: "fit-content",
                height: "fit-content",
                position: "relative",
            }}
        >
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
            />
            <NodeComponent node={{ ...data }} />
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
            />
        </div>
    );
}

type LayoutFlowProps = {
    nodeComponent: any;
    onNodeClick: (id: string) => void;
    width: number | string;
    height: number | string;
} & MWDBGraph;

function LayoutFlow({
    nodes,
    edges,
    nodeComponent,
    onNodeClick,
    width,
    height,
}: LayoutFlowProps) {
    const [xyNodes, setXYNodes, onXYNodesChange] = useNodesState<XYFlowNode>(
        []
    );
    const [xyEdges, setXYEdges, onXYEdgesChange] = useEdgesState<XYFlowEdge>(
        []
    );
    const { fitView } = useReactFlow();

    const doLayout = useCallback(
        async (mwdbGraph: MWDBGraph) => {
            console.log("relayouting");
            const getPosition = (node: MWDBPlotNode) => {
                // Preserve position of nodes on update
                const xynode = xyNodes.find((xynode) => xynode.id == node.id);
                return xynode ? xynode.position : { x: 0, y: 0 };
            };
            const xyGraph = {
                nodes: nodes.map((node) => ({
                    id: node.id,
                    type: "node",
                    data: {
                        ...node,
                        onClick: () => onNodeClick(node.id),
                        nodeComponent: nodeComponent,
                    },
                    position: getPosition(node),
                })),
                edges: edges.map((edge) => ({
                    id: `e${edge.parent}_${edge.child}`,
                    source: edge.parent,
                    target: edge.child,
                    type: "smoothstep",
                    markerEnd: {
                        type: MarkerType.Arrow,
                    },
                })),
            };
            console.log(xyGraph);
            const layoutedGraph = await layoutElements(xyGraph);
            setXYNodes(layoutedGraph.nodes);
            setXYEdges(layoutedGraph.edges);
        },
        [setXYNodes, setXYEdges, xyNodes, xyEdges, onNodeClick, nodeComponent]
    );

    // Calculate the initial layout on mount.
    useLayoutEffect(() => {
        doLayout({ nodes, edges }).then(() => fitView());
    }, [nodes, edges, onNodeClick, nodeComponent]);

    console.log(xyNodes[0]);

    return (
        <div style={{ width, height }}>
            <ReactFlow
                nodes={xyNodes}
                edges={xyEdges}
                onNodesChange={onXYNodesChange}
                onEdgesChange={onXYEdgesChange}
                fitView
                nodesConnectable={false}
                nodeTypes={{
                    node: LayoutFlowNode,
                }}
            />
        </div>
    );
}

export default (props: LayoutFlowProps) => (
    <ReactFlowProvider>
        <LayoutFlow {...props} />
    </ReactFlowProvider>
);
