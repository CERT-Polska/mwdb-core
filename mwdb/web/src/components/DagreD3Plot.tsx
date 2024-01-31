import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

import * as dagreD3 from "dagre-d3";
import * as d3 from "d3";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { Edge, NodeProp } from "@mwdb-web/types/types";

type RenderContext = {
    refCounter: number;
    slaveContainer: HTMLElement | null;
    svgClone: Node | null;
    transform: any;
};

type Props = {
    height: number;
    width: number | string;
    nodeComponent: React.ComponentType<any>;
    edges: Edge[];
    nodes: NodeProp[];
    onNodeClick: (id: string) => void;
};

export function DagreD3Plot(props: Props) {
    const remotePath = useRemotePath();

    const graph = new dagreD3.graphlib.Graph().setGraph({ compound: true });
    const renderer = new dagreD3.render();

    const masterContainer = useRef<HTMLDivElement | null>(null);
    const renderContext = useRef<RenderContext>({
        refCounter: 0,
        slaveContainer: null,
        svgClone: null,
        transform: null,
    });

    const nodeSvg = useRef<SVGSVGElement>(null);

    graph.graph().transition = (selection) =>
        selection.transition().duration(500);

    const zoomIdentity = () =>
        d3.zoomIdentity.translate(
            masterContainer!.current!.clientWidth / 2 - 200,
            props.height / 3 - 100
        );

    const renderNodeElement = async (node: NodeProp) => {
        // This method renders React element into HTML to meet DagreD3 requirements
        // Create container node and make React root
        const parentNode = document.createElement("div");
        const root = createRoot(parentNode);

        // render() doesn't provide any callback to notify when rendering is done
        // So we need to make wrapper with useEffect.
        // Unfortunately we can't use flushSync for that.
        await new Promise<void>((resolve) => {
            function NodeComponent() {
                const Node = props.nodeComponent as any;
                useEffect(() => {
                    resolve(undefined);
                }, []);
                return <Node node={node} remotePath={remotePath} />;
            }
            root.render(<NodeComponent />);
        });
        // Extract HTML when it's rendered and unmount root to unregister effects and
        // other React things
        const renderedNode = parentNode.outerHTML;
        root.unmount();
        return renderedNode;
    };

    const enterRenderContext = () => {
        const context = renderContext.current;
        // Get <g> element of current svg node
        //@ts-ignore
        const svgGroup = d3.select(nodeSvg?.current?.firstChild);
        if (!context.refCounter++) {
            // Render context initialization (for first subsequent render)
            // Create hidden slave container as masterContainer sibling
            context.slaveContainer = document.createElement("div");
            context.slaveContainer.style.visibility = "hidden";
            masterContainer!.current!.parentNode!.appendChild(
                context.slaveContainer
            );
            // Clone <svg> element and show cloned version in master at time of render
            context.svgClone = nodeSvg!.current!.cloneNode(true);
            masterContainer?.current?.replaceChild(
                context.svgClone!,
                nodeSvg.current!
            );
            context.slaveContainer.appendChild(nodeSvg.current!);
            // Now, we're operating on hidden node in slave container
            // Store and reset transform for time of rendering
            context.transform = svgGroup.attr("transform");
            if (!context.transform) context.transform = zoomIdentity();
            svgGroup.attr("transform", "");
        }
        return () => {
            if (!--context.refCounter) {
                // Render context commit (for last subsequent render)
                // After render: recover stored transform attribute value
                svgGroup.attr("transform", context.transform);
                // Swap cloned node with rendered node in master container
                masterContainer?.current?.replaceChild(
                    nodeSvg.current!,
                    context.svgClone!
                );
                // Detach and remove reference to slaveContainer
                masterContainer?.current?.parentNode?.removeChild(
                    context!.slaveContainer!
                );
            }
        };
    };

    const updateGraph = async () => {
        let applyRender = enterRenderContext();

        // Acquire d3 nodes
        const svg = d3.select(nodeSvg.current);
        //@ts-ignore
        const svgGroup = d3.select(nodeSvg?.current?.firstChild);

        // Render all node components
        let renderedNodes = await Promise.all(
            props.nodes.map(
                async (node) =>
                    [node, await renderNodeElement(node)] as [NodeProp, string]
            )
        );

        for (let [node, element] of renderedNodes) {
            graph.setNode(node.id, {
                labelType: "html",
                label: element,
                class: node.expanded ? "expanded-node" : "not-expanded-node",
            });
        }

        for (let edge of props.edges)
            graph.setEdge(edge.parent!, edge.child!, {
                label: "",
                lineInterpolate: "basis",
            });

        graph.nodes().forEach((v: any) => {
            let node = graph.node(v);

            node.rx = node.ry = 5;
            node.padding = 0;
        });

        //@ts-ignore
        graph.graph().rankDir = "LR";

        graph.edges().forEach((e: any) => graph.edge(e));

        const zoom = d3
            .zoom()
            .on("zoom", () =>
                svgGroup.attr("transform", d3.event.transform + zoomIdentity())
            );
        //@ts-ignore
        svg.call(zoom);

        // TODO:
        // This method may cause the browser to become unresponsive when dealing with large amounts of data,
        // so it should be improved in the future.

        //@ts-ignore
        renderer(svgGroup, graph);

        svg.selectAll(".dagre-d3 .node").on("click", (id) =>
            props.onNodeClick(id as string)
        );

        svg.attr("height", props.height);
        svg.attr("width", props.width);

        applyRender();
    };

    useEffect(() => {
        updateGraph();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.nodes, props.edges]);

    return (
        <div ref={masterContainer}>
            <svg
                className="dagre-d3"
                ref={nodeSvg}
                width={props.width}
                height={props.height}
            >
                <g />
            </svg>
        </div>
    );
}
