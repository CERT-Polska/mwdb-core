import { capitalize } from "@mwdb-web/commons/helpers";
import { Tag } from "@mwdb-web/commons/ui";
import { ObjectLegacyType, ObjectType } from "@mwdb-web/types/types";

function nodeTypeMapping(type: ObjectLegacyType): ObjectType {
    switch (type) {
        case "file": {
            return "file";
        }
        case "text_blob": {
            return "blob";
        }
        default: {
            return "config";
        }
    }
}

function styleMapping(type: ObjectType) {
    switch (type) {
        case "file": {
            return "bg-danger";
        }
        case "blob": {
            return "bg-info";
        }
        default: {
            return "bg-success";
        }
    }
}

type Props = {
    remotePath: string;
    node: {
        id: string;
        expanded: boolean;
        object: {
            tags: {
                tag: string;
            }[];
            type: ObjectLegacyType;
            upload_time: string;
        };
    };
};

export function RelationsNode(props: Props) {
    const nodeType = nodeTypeMapping(
        props.node.object.type as ObjectLegacyType
    );
    const nodeStyle = styleMapping(nodeType);
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
                        <Tag key={tag.tag} tag={tag.tag} searchable={false} />
                    ))}
                </div>
            </div>
        </div>
    );
}
