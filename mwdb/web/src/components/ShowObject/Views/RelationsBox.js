import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import Pagination from "react-js-pagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { APIContext } from "@mwdb-web/commons/api/context";
import { Capability } from "@mwdb-web/commons/auth";
import { AuthContext } from "@mwdb-web/commons/auth/context";
import { ObjectContext } from "@mwdb-web/commons/context";
import {
    ObjectLink,
    ActionCopyToClipboard,
    ConfirmationModal,
    TagList,
} from "@mwdb-web/commons/ui";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import RelationsAddModal from "../Actions/RelationsAddModal";
import { updateActivePage } from "@mwdb-web/commons/helpers";

function paginateParentChildren(
    parents,
    children,
    activePage,
    itemsCountPerPage
) {
    const elementFrom = (activePage - 1) * itemsCountPerPage;
    const elementTo = activePage * itemsCountPerPage;
    const parentsFrom = elementFrom;
    const parentsTo = elementTo;
    let childrenFrom;
    let childrenTo;

    if (parents.length < elementTo) {
        childrenFrom = elementFrom - parents.length;
        if (childrenFrom < 0) {
            childrenFrom = 0;
        }
        childrenTo = elementTo - parents.length;
    } else {
        childrenFrom = 0;
        childrenTo = 0;
    }

    const selectedParents = parents.slice(parentsFrom, parentsTo);
    const selectedChildren = children.slice(childrenFrom, childrenTo);

    return [selectedParents, selectedChildren];
}

function RelationsBox(props) {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const remotePath = useRemotePath();
    const [isAttributeAddModalOpen, setAttributeAddModalOpen] = useState(false);
    const [isAttributeDeleteModalOpen, setAttributeDeleteModalOpen] =
        useState(false);
    const [disabledModalButton, setDisabledModalButton] = useState(false);
    const [relationToRemove, setRelationToRemove] = useState({});
    const [modalError, setModalError] = useState("");
    const updateRelationsActivePage = props.updateRelationsActivePage;

    async function addObjectRelations(relation, value) {
        try {
            if (relation === "child")
                await api.addObjectRelation(context.object.id, value);
            else if (relation === "parent")
                await api.addObjectRelation(value, context.object.id);
        } catch (error) {
            if (error.response && error.response.status === 404)
                setModalError("Object not found or incorrect SHA256 hash.");
            else setModalError(error);
        } finally {
            context.updateObject();
            setAttributeAddModalOpen(false);
        }
    }

    async function removeObjectRelations(relation, value) {
        try {
            setDisabledModalButton(true);
            if (relation === "child")
                await api.removeObjectRelation(context.object.id, value);
            else if (relation === "parent")
                await api.removeObjectRelation(value, context.object.id);
        } catch (error) {
            if (error.response && error.response.status === 404)
                setModalError("Object not found or incorrect SHA256 hash.");
            else setModalError(error);
            setDisabledModalButton(false);
        } finally {
            context.updateObject();
            setAttributeDeleteModalOpen(false);
            setDisabledModalButton(false);
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
                {auth.hasCapability(Capability.removingParents) && (
                    <span
                        className="ml-2"
                        data-toggle="tooltip"
                        title="Remove relation to parent object."
                        onClick={() => {
                            setRelationToRemove({
                                relation: "parent",
                                id: parent.id,
                            });
                            setAttributeDeleteModalOpen(true);
                        }}
                    >
                        <i>
                            <FontAwesomeIcon
                                icon={"trash"}
                                size="sm"
                                style={{ cursor: "pointer" }}
                            />
                        </i>
                    </span>
                )}
            </td>
            <td>
                <TagList
                    tags={parent.tags}
                    searchEndpoint={`${remotePath}/search`}
                />
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
                {auth.hasCapability(Capability.removingParents) && (
                    <span
                        className="ml-2"
                        data-toggle="tooltip"
                        title="Remove relation to child object."
                        onClick={() => {
                            setRelationToRemove({
                                relation: "child",
                                id: child.id,
                            });
                            setAttributeDeleteModalOpen(true);
                        }}
                    >
                        <i>
                            <FontAwesomeIcon
                                icon={"trash"}
                                size="sm"
                                style={{ cursor: "pointer" }}
                            />
                        </i>
                    </span>
                )}
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
            <ConfirmationModal
                isOpen={isAttributeDeleteModalOpen}
                disabled={disabledModalButton}
                onRequestClose={() => setAttributeDeleteModalOpen(false)}
                onConfirm={() => {
                    removeObjectRelations(
                        relationToRemove.relation,
                        relationToRemove.id
                    );
                    updateRelationsActivePage();
                }}
                message="Are you sure you want to delete this relation?"
                buttonStyle="btn btn-danger"
                confirmText="yes"
                cancelText="no"
            />
        </div>
    );
}

function TypedRelationsBox(props) {
    const parentsFiltered = props.parents.filter((e) => e.type === props.type);
    const childrenFiltered = props.children.filter(
        (e) => e.type === props.type
    );

    const itemsCountPerPage = props.itemsCountPerPage;
    const [activePage, setActivePage] = useState(1);

    let [parents, children] = paginateParentChildren(
        parentsFiltered,
        childrenFiltered,
        activePage,
        itemsCountPerPage
    );

    let typedRelationsCount = parentsFiltered.length + childrenFiltered.length;

    if (typedRelationsCount > 0)
        return (
            <div>
                <RelationsBox
                    header={`${props.header}: ${typedRelationsCount}`}
                    updateRelationsActivePage={() =>
                        updateActivePage(
                            activePage,
                            typedRelationsCount,
                            itemsCountPerPage,
                            setActivePage
                        )
                    }
                    {...{ parents, children }}
                />
                {typedRelationsCount > itemsCountPerPage && (
                    <Pagination
                        activePage={activePage}
                        itemsCountPerPage={itemsCountPerPage}
                        totalItemsCount={typedRelationsCount}
                        pageRangeDisplayed={5}
                        onChange={setActivePage}
                        itemClass="page-item"
                        linkClass="page-link"
                    />
                )}
            </div>
        );
    else return <div />;
}

export default function MultiRelationsBox() {
    const context = useContext(ObjectContext);
    let parents = context.object.parents;
    let children = context.object.children;
    const itemsCountPerPage = 5;

    return parents && children && parents.length + children.length > 0 ? (
        <div>
            <TypedRelationsBox
                header="Related samples"
                type="file"
                itemsCountPerPage={itemsCountPerPage}
                {...{ parents, children }}
            />
            <TypedRelationsBox
                header="Related configs"
                type="static_config"
                itemsCountPerPage={itemsCountPerPage}
                {...{ parents, children }}
            />
            <TypedRelationsBox
                header="Related blobs"
                type="text_blob"
                itemsCountPerPage={itemsCountPerPage}
                {...{ parents, children }}
            />
        </div>
    ) : (
        <RelationsBox />
    );
}
