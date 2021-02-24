import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { APIContext } from "@mwdb-web/commons/api/context";
import { ObjectContext } from "@mwdb-web/commons/context";
import {
    ObjectLink,
    ActionCopyToClipboard,
    TagList,
} from "@mwdb-web/commons/ui";
import RelationsAddModal from "../Actions/RelationsAddModal";

function RelationsBox(props) {
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);
    const [isAttributeAddModalOpen, setAttributeAddModalOpen] = useState(false);
    const [modalError, setModalError] = useState("");

    async function addObjectRelations(relation, value) {
        try {
            if (relation === "child")
                await api.addObjectRelation(context.object.id, value);
            else if (relation === "parent")
                await api.addObjectRelation(value, context.object.id);
            context.updateObject();
            setAttributeAddModalOpen(false);
        } catch (error) {
            if (error.response && error.response.status === 404)
                setModalError("Object not found or incorrect SHA256 hash.");
            else setModalError(error);
        }
    }

    const parents = (props.parents || []).map((parent, index, array) => (
        <tr key={`parent-${parent.id}`} className="flickerable">
            <th>parent</th>
            <td>
                <span>
                    <ObjectLink
                        {...parent}
                        diffWith={
                            parent.type === "text_blob" &&
                            (array[index + 1] || {}).id
                        }
                        inline
                    />
                </span>
                <span className="ml-2">
                    <ActionCopyToClipboard
                        text={parent.id}
                        tooltipMessage="Copy sha256 to clipboard"
                    />
                </span>
            </td>
            <td>
                <TagList tags={parent.tags} />
            </td>
        </tr>
    ));

    const children = (props.children || []).map((child, index, array) => (
        <tr key={`child-${child.id}`} className="flickerable">
            <th>child</th>
            <td>
                <span>
                    <ObjectLink
                        {...child}
                        diffWith={
                            child.type === "text_blob" &&
                            (array[index + 1] || {}).id
                        }
                        inline
                    />
                </span>
                <span className="ml-2">
                    <ActionCopyToClipboard
                        text={child.id}
                        tooltipMessage="Copy sha256 to clipboard"
                    />
                </span>
            </td>
            <td>
                <TagList tags={child.tags} />
            </td>
        </tr>
    ));
    return (
        <div className="card card-default">
            <div className="card-header">
                {props.header || "Relations"}
                {!api.remote ? (
                    <Link
                        to="#"
                        className="float-right"
                        onClick={(ev) => {
                            ev.preventDefault();
                            setAttributeAddModalOpen(true);
                            setModalError("");
                        }}
                    >
                        <FontAwesomeIcon icon="plus" pull="left" size="1x" />
                        Add
                    </Link>
                ) : (
                    []
                )}
            </div>
            {parents.length + children.length > 0 ? (
                <table
                    className="table table-striped table-bordered table-hover"
                    id="rel_table"
                >
                    <tbody id="rel_body">
                        {parents}
                        {children}
                    </tbody>
                </table>
            ) : (
                <div className="card-body text-muted">
                    No relations to display
                </div>
            )}
            <RelationsAddModal
                isOpen={isAttributeAddModalOpen}
                error={modalError}
                onSubmit={addObjectRelations}
                onError={setModalError}
                onRequestModalClose={() => setAttributeAddModalOpen(false)}
            />
        </div>
    );
}

function TypedRelationsBox(props) {
    const parents = props.parents.filter((e) => e.type === props.type);
    const children = props.children.filter((e) => e.type === props.type);
    if (parents.length + children.length > 0)
        return (
            <RelationsBox header={props.header} {...{ parents, children }} />
        );
    else return <div />;
}

export default function MultiRelationsBox() {
    const context = useContext(ObjectContext);
    let parents = context.object.parents;
    let children = context.object.children;
    return parents && children && parents.length + children.length > 0 ? (
        <div>
            <TypedRelationsBox
                header="Related samples"
                type="file"
                {...{ parents, children }}
            />
            <TypedRelationsBox
                header="Related configs"
                type="static_config"
                {...{ parents, children }}
            />
            <TypedRelationsBox
                header="Related blobs"
                type="text_blob"
                {...{ parents, children }}
            />
        </div>
    ) : (
        <RelationsBox />
    );
}
