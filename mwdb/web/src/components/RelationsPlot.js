import React, { useState, useLayoutEffect, useContext } from "react";
import { useHistory } from "react-router";

import queryString from "query-string";

import { APIContext } from "@mwdb-web/commons/api/context";
import { capitalize } from "@mwdb-web/commons/helpers";

import DagreD3Plot from "./DagreD3Plot";
import { Tag } from "@mwdb-web/commons/ui";

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
                                href={`${props.remote}/${nodeType}/${props.node.id}`}
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

function RelationsPlot(props) {
    const api = useContext(APIContext);
    const history = useHistory();
    const { hash, height } = props;
    const defaultProps = {
        height: "900",
        width: "100%",
    };

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
        let params = queryString.parse(history.location.search, {
            arrayFormat: "bracket",
        });
        if (isNodeExpanded(node)) return;
        params.node = [...(params.node || []), node];
        expandNode(node);
        history.replace({
            search: queryString.stringify(params, { arrayFormat: "bracket" }),
        });
    };

    useLayoutEffect(() => {
        let params = queryString.parse(history.location.search, {
            arrayFormat: "bracket",
        });
        let expandedNodes = params.node || [];
        if (hash && !expandedNodes.includes(hash)) {
            expandedNodes.push(hash);
        }
        for (let node of expandedNodes) expandNode(node);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <DagreD3Plot
            width={defaultProps.width}
            height={height ? height : defaultProps.height}
            nodes={nodes.nodes}
            edges={nodes.edges}
            onNodeClick={onNodeClick}
            nodeComponent={RelationsNode}
        />
    );
}

export default RelationsPlot;
