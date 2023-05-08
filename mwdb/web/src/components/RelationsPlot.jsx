import React, {
    Suspense,
    useState,
    useLayoutEffect,
    useContext,
    useEffect,
} from "react";
import { isEmpty } from "lodash";
import { useSearchParams } from "react-router-dom";

import { APIContext } from "@mwdb-web/commons/api";
import { capitalize } from "@mwdb-web/commons/helpers";

import { Tag } from "@mwdb-web/commons/ui";

const DagreD3Plot = React.lazy(() => import("./DagreD3Plot"));

const nodeStatuses = {
    initial: "initial",
    showGraph: "showGraph",
    showWarning: "showWarning",
};

function RelationsNode(props) {
    const typeMapping = {
        file: "file",
        config: "config",
        static_config: "config",
        text_blob: "blob",
    };

    const styleMapping = {
        file: "bg-danger",
        config: "bg-success",
        blob: "bg-info",
    };

    const nodeType = typeMapping[props.node.object.type];
    const nodeStyle = styleMapping[nodeType];
    const nodeHeaderStyle = props.node.expanded
        ? "node-header-expanded"
        : "node-header-active";

    return (
        <div className="mainNode">
            <div className="card" style={{ width: "13rem", cursor: "pointer" }}>
                <div
                    className={`card-header ${nodeHeaderStyle} ${nodeStyle}`}
                    style={{ paddingTop: "11px", paddingBottom: "11px" }}
                >
                    {capitalize(nodeType)}{" "}
                    <span className="date">
                        {new Date(
                            props.node.object.upload_time
                        ).toLocaleDateString()}
                    </span>
                </div>
                <div className="card-body">
                    <p className="card-text">
                        <small className="text-muted">
                            <a
                                href={`${props.remotePath}/${nodeType}/${props.node.id}`}
                            >
                                {props.node.id.substr(0, 16)}
                            </a>
                        </small>
                    </p>
                </div>
                <div
                    className="card-footer bg-transparent tags"
                    style={{ maxWidth: "13rem", whiteSpace: "pre-wrap" }}
                >
                    {props.node.object.tags.map((tag) => (
                        <Tag tag={tag.tag} searchable={false} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function RelationToManyNode({ setNodesStatus, nodesLength }) {
    console.log({ setNodesStatus, nodesLength });
    return (
        <>
            <div
                className="alert alert-warning"
                style={{ margin: "10px 20px", fontSize: 18 }}
            >
                The relationships for a given object will amount to{" "}
                <span className="font-weight-bold">{nodesLength}</span>{" "}
                elements, displaying such a quantity of connections may affect
                the application's performance.
            </div>
            <div class="text-center mb-2">
                <button
                    className="btn btn-warning"
                    onClick={() => setNodesStatus(nodeStatuses.showGraph)}
                >
                    Show relations anyway
                </button>
            </div>
        </>
    );
}

function RelationsPlot(props) {
    const api = useContext(APIContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const { hash, height } = props;
    const defaultProps = {
        height: "900",
        width: "100%",
    };

    const [nodesStatus, setNodesStatus] = useState("initial");

    const [nodes, setNodes] = useState({
        nodes: [],
        edges: [],
    });

    const convertObject = (obj, expanded) => {
        let node = {
            id: obj.id,
            object: {
                type: obj.type,
                upload_time: obj.upload_time,
                tags: obj.tags,
            },
            expanded,
        };
        return node;
    };

    const isNodeExpanded = (hash) => {
        let node = nodes.nodes.find((n) => n.id === hash);
        return node && node.expanded;
    };

    const addNodes = (prevNodesState, newNode, newEdge = false) => {
        const getNode = (hash) => {
            return prevNodesState.nodes.find((n) => n.id === hash);
        };

        const getEdge = (edge) => {
            return prevNodesState.edges.find(
                (e) => e.parent === edge.parent && e.child === edge.child
            );
        };

        let newNodesState = {};
        let existingNode = getNode(newNode.id);
        if (!existingNode) {
            // Append new node and mark node as expanded if no edge is added.
            newNode = convertObject(newNode, !newEdge);
            newNodesState.nodes = [...prevNodesState.nodes, newNode];
        } else {
            // Update node in the same place
            if ((!existingNode.expanded && !newEdge) || existingNode.expanded)
                newNode = convertObject(newNode, true);
            else newNode = convertObject(newNode, false);
            newNodesState.nodes = prevNodesState.nodes.reduce(
                (nodesList, node) => {
                    if (node.id === newNode.id) return [...nodesList, newNode];
                    else return [...nodesList, node];
                },
                []
            );
        }
        if (newEdge && !getEdge(newEdge)) {
            newNodesState.edges = [...prevNodesState.edges, newEdge];
        } else {
            newNodesState.edges = [...prevNodesState.edges];
        }
        return newNodesState;
    };

    const updateObject = (obj, type = null, edgeId = null) => {
        if (type === "parent") {
            setNodes((prevNodes) =>
                addNodes(prevNodes, obj, { parent: obj.id, child: edgeId })
            );
        } else if (type === "children") {
            setNodes((prevNodes) =>
                addNodes(prevNodes, obj, { parent: edgeId, child: obj.id })
            );
        } else {
            setNodes((prevNodes) => addNodes(prevNodes, obj));
        }
    };

    const expandNode = async (hash, expanded = false) => {
        let objectInfo = await api.getObject("object", hash);
        let obj = objectInfo.data;
        updateObject(obj);
        if (obj.parents.length > 0) {
            obj.parents.forEach((o) => {
                updateObject(o, "parent", obj.id);
            });
        }
        if (obj.children.length > 0) {
            obj.children.forEach((o) => {
                updateObject(o, "children", obj.id);
            });
        }
    };

    const onNodeClick = (node) => {
        let nodes = searchParams.getAll("node");
        if (isNodeExpanded(node)) return;
        nodes = [...(nodes || []), node];
        expandNode(node);
        setSearchParams(
            new URLSearchParams(nodes.map((node) => ["node", node])),
            { replace: true }
        );
    };

    useLayoutEffect(() => {
        let nodes = searchParams.getAll("node");
        let expandedNodes = nodes || [];
        if (hash && !expandedNodes.includes(hash)) {
            expandedNodes.push(hash);
        }
        for (let node of expandedNodes) expandNode(node);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const limit = 500;
        if (!isEmpty(nodes.nodes) || !isEmpty(nodes.edges)) {
            const elementsLength = Math.max(
                nodes.nodes.length,
                nodes.edges.length
            );
            setNodesStatus(
                elementsLength < limit
                    ? nodeStatuses.showGraph
                    : nodeStatuses.showWarning
            );
        }
    }, [nodes]);

    return (
        <Suspense fallback={<div />}>
            {nodesStatus === nodeStatuses.showGraph && (
                <DagreD3Plot
                    width={defaultProps.width}
                    height={height ? height : defaultProps.height}
                    nodes={nodes.nodes}
                    edges={nodes.edges}
                    onNodeClick={onNodeClick}
                    nodeComponent={RelationsNode}
                />
            )}
            {nodesStatus === nodeStatuses.showWarning && (
                <RelationToManyNode
                    setNodesStatus={setNodesStatus}
                    nodesLength={Math.max(
                        nodes.nodes.length,
                        nodes.edges.length
                    )}
                />
            )}
        </Suspense>
    );
}

export default RelationsPlot;
