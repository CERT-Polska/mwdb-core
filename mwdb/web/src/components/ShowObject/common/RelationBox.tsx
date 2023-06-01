import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    IconDefinition,
    faPlus,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import {
    ObjectLink,
    ActionCopyToClipboard,
    ConfirmationModal,
    TagList,
} from "@mwdb-web/commons/ui";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { RelationsAddModal } from "../Actions/RelationsAddModal";
import { Capability, RelationItem } from "@mwdb-web/types/types";

type RelationToRemove = {
    relation: "parent" | "child";
    id: string;
};

type Props = {
    children?: RelationItem[];
    parents?: RelationItem[];
    header?: string;
    icon?: IconDefinition;
    updateRelationsActivePage?: () => void;
};

export function RelationsBox(props: Props) {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const remotePath = useRemotePath();
    const [isAttributeAddModalOpen, setAttributeAddModalOpen] =
        useState<boolean>(false);
    const [isAttributeDeleteModalOpen, setAttributeDeleteModalOpen] =
        useState<boolean>(false);
    const [disabledModalButton, setDisabledModalButton] =
        useState<boolean>(false);
    const [relationToRemove, setRelationToRemove] = useState<RelationToRemove>(
        {} as RelationToRemove
    );
    const updateRelationsActivePage = props.updateRelationsActivePage;

    async function addObjectRelations(relation: string, value: string) {
        try {
            if (relation === "child") {
                await api.addObjectRelation(context.object!.id!, value);
            }

            if (relation === "parent") {
                await api.addObjectRelation(value, context.object!.id!);
            }

            context.updateObject();
            setAttributeAddModalOpen(false);
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                toast("Object not found or incorrect SHA256 hash.", {
                    type: "error",
                });
            } else {
                toast(getErrorMessage(error), {
                    type: "error",
                });
            }
        }
    }

    async function removeObjectRelations(relation: string, value: string) {
        try {
            setDisabledModalButton(true);
            if (relation === "child") {
                await api.removeObjectRelation(context.object!.id!, value);
            }

            if (relation === "parent") {
                await api.removeObjectRelation(value, context.object!.id!);
            }

            context.updateObject();
            setAttributeDeleteModalOpen(false);
            setDisabledModalButton(false);
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                toast("Object not found or incorrect SHA256 hash.", {
                    type: "error",
                });
            } else {
                toast(getErrorMessage(error), {
                    type: "error",
                });
            }
            setDisabledModalButton(false);
        }
    }

    const parents = (props.parents || []).map((parent, index, array) => (
        <tr key={`parent-${parent.id}`} className="flickerable">
            <th>parent</th>
            <td>
                <span>
                    <ObjectLink {...parent} inline />
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
                                icon={faTrash}
                                size="sm"
                                style={{ cursor: "pointer" }}
                            />
                        </i>
                    </span>
                )}
            </td>
            <td>
                <TagList
                    tag=""
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
                    <ObjectLink {...child} inline />
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
                                icon={faTrash}
                                size="sm"
                                style={{ cursor: "pointer" }}
                            />
                        </i>
                    </span>
                )}
            </td>
            <td>
                <TagList tag="" tags={child.tags} />
            </td>
        </tr>
    ));
    return (
        <div className="card card-default">
            <div className="card-header">
                {props.icon && <FontAwesomeIcon icon={props.icon} size="1x" />}
                {props.header || "Relations"}
                {!api.remote ? (
                    <Link
                        to="#"
                        className="float-right"
                        onClick={(ev) => {
                            ev.preventDefault();
                            setAttributeAddModalOpen(true);
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} pull="left" size="1x" />
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
                onSubmit={addObjectRelations}
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
                    updateRelationsActivePage && updateRelationsActivePage();
                }}
                message="Are you sure you want to delete this relation?"
                buttonStyle="btn btn-danger"
                confirmText="yes"
                cancelText="no"
            />
        </div>
    );
}
