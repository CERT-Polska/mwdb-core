import React, { useState, useCallback, useEffect } from "react";
import Autocomplete from "react-autocomplete";
import { Link } from "react-router-dom";

import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { capabilitiesList } from "@mwdb-web/commons/auth";
import { intersperse } from "@mwdb-web/commons/helpers";
import { ConfirmationModal, GroupBadge, ShowIf } from "@mwdb-web/commons/ui";

function GroupAppliesTo({ group }) {
    if (group["name"] === "public")
        return (
            <small className="text-muted">
                Applies to all users in MWDB system
            </small>
        );
    return (
        <div>
            <small className="text-muted">
                Applies to{" "}
                {intersperse(
                    group["users"]
                        .slice(0, 3)
                        .map((user) => (
                            <Link to={`/admin/user/${user}`}>{user}</Link>
                        )),
                    ", "
                )}
                {group["users"].length > 3
                    ? ` and ${group["users"].length - 3}  more...`
                    : []}
            </small>
        </div>
    );
}

function CapabilitiesHeader({ group }) {
    return (
        <tr className="bg-light">
            <th colSpan="3" className="col">
                <GroupBadge group={group} />
                <ShowIf condition={!group["private"]}>
                    <GroupAppliesTo group={group} />
                </ShowIf>
            </th>
        </tr>
    );
}

function CapabilitiesList({ capabilities, onDelete }) {
    return capabilities.map((cap) => (
        <tr>
            <td className="col-auto">
                <Link onClick={(ev) => {
                    ev.preventDefault();
                    onDelete(cap);
                }}>
                    <FontAwesomeIcon icon={faTimes} />
                </Link>
            </td>
            <th className="col-1">
                <span className="badge badge-success">{cap}</span>
            </th>
            <td className="col">
                {capabilitiesList[cap] || "Undocumented. Possibly internal and required by plugin."}
            </td>
        </tr>
    ));
}

function GroupInputField({groups, value, onValueUpdate}) {
    return (
        <Autocomplete
            value={value}
            getItemValue={(group) => group.name}
            shouldItemRender={(group, value) => {
                return (
                    group.name.toLowerCase().indexOf(value.toLowerCase()) !== -1
                );
            }}
            items={groups}
            onChange={(event) => onValueUpdate(event.target.value)}
            onSelect={(value) => onValueUpdate(value)}
            renderInput={(props) => (
                <input
                    {...props}
                    className="form-control"
                    placeholder="Group name"
                />
            )}
            wrapperStyle={{ display: "block" }}
            renderMenu={(children) => {
                console.log(children)
                return (
                    <div className="dropdown">
                        <div className="dropdown-menu show">
                            {children}
                        </div>
                    </div>
                )
            }}
            renderItem={(group, isHighlighted) => (
                <div
                    className="dropdown-item"
                    key={group.name}
                >
                    <GroupBadge group={group} />
                </div>
            )}
        />
    )
}

export default function AccessControl() {
    const [groups, setGroups] = useState(null);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [disabledModalButton, setDisabledModalButton] = useState(false);
    const [capabilityToDelete, setCapabilityToDelete] = useState({});

    async function updateGroups() {
        try {
            const response = await api.getGroups();
            const groupList = response.data["groups"].sort(
                (a, b) =>
                    (b["name"] === "public") - (a["name"] === "public") ||
                    a["private"] - b["private"] ||
                    a["name"].localeCompare(b["name"])
            );
            setGroups(groupList);
        } catch (error) {
            console.error(error);
        }
    }

    async function addCapabilities() {

    }

    async function deleteCapability({group, capability}) {
        try {
            setDisabledModalButton(true);
            const response = await api.getGroup(group);
            const newCapabilities = response.data.capabilities.filter(item => item !== capability)
            await api.updateGroup(group, undefined, newCapabilities);
            await updateGroups();
        } catch(e) {}
        finally {
            setDisabledModalButton(false);
            setDeleteModalOpen(false);
        }
    }

    const getGroups = useCallback(updateGroups, []);

    useEffect(() => {
        getGroups();
    }, [getGroups]);

    if (!groups) return [];

    return (
        <div>
            <h5>Access control</h5>
            <Link>
                <FontAwesomeIcon icon={faPlus} />{" "}
                Add capabilities
            </Link>
            <GroupInputField groups={groups} value={""} onValueUpdate={()=>{}}/>
            <table className="table table-bordered wrap-table">
                <tbody>
                    {groups
                        .filter((group) => group.capabilities.length > 0)
                        .map((group) => [
                            <CapabilitiesHeader group={group} />,
                            <CapabilitiesList
                                capabilities={group.capabilities}
                                onDelete={(capability) => {
                                    setCapabilityToDelete({
                                        group: group.name, capability
                                    });
                                    setDeleteModalOpen(true);
                                }}
                            />,
                        ])}
                </tbody>
            </table>
            <ConfirmationModal
                buttonStyle="badge-success"
                confirmText="Yes"
                message={`Are you sure you want to remove ${capabilityToDelete.capability}
                          capability from '${capabilityToDelete.group}'?`}
                isOpen={isDeleteModalOpen}
                disabled={disabledModalButton}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    deleteCapability(capabilityToDelete);
                }}
            />
        </div>
    );
}
