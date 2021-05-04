import React, {useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";

import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { capabilitiesList } from "@mwdb-web/commons/auth";
import { intersperse } from "@mwdb-web/commons/helpers";
import { Autocomplete, BootstrapSelect, ConfirmationModal, GroupBadge, ShowIf } from "@mwdb-web/commons/ui";

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

function CapabilitiesSelect({value, onChange}) {
    const capabilities = Object.keys(capabilitiesList);
    const selectedCaps = value || [];
    return (
        <BootstrapSelect data-multiple-separator={""}
                         data-live-search="true"
                         data-none-selected-text={
                             value === undefined
                             ? "Provide existing group name"
                             : "No additional capabilities enabled"
                         }
                         className={"form-control"} multiple
                         disabled={value === undefined}
                         onChange={(e, clickedIndex, isSelected) => {
            if(isSelected)
                onChange(selectedCaps.concat(capabilities[clickedIndex]));
            else
                onChange(selectedCaps.filter(cap => cap !== capabilities[clickedIndex]))
        }}>
            {
                capabilities.map((cap) => (
                    <option data-content={`<span class='badge badge-success'>${cap}</span>`}
                            selected={selectedCaps.indexOf(cap) !== -1}>
                        {cap}
                    </option>
                ))
            }
        </BootstrapSelect>
    )
}


function CapabilityChangeCard({ groups, onSubmit }) {
    const [groupName, setGroupName] = useState("");
    const [capabilities, setCapabilities] = useState();

    useEffect(() => {
        const matchedGroup = groups.find(group => group.name === groupName) || {};
        setCapabilities(matchedGroup.capabilities);
    }, [groups, groupName])
    return (
        <div className="card">
            <div className="card-body">
                <Autocomplete
                    value={groupName}
                    getItemValue={(group) => group.name}
                    items={groups.filter(group => group.name.toLowerCase().indexOf(groupName.toLowerCase()) !== -1)}
                    onChange={(value) => setGroupName(value)}
                    className="form-control"
                    placeholder="Group name"
                    renderItem={({item}) => (
                        <GroupBadge group={item} />
                    )}
                />
                <CapabilitiesSelect value={capabilities} onChange={(caps) => setCapabilities(caps)}/>
                <Link>
                    <FontAwesomeIcon icon={faPlus} />{" "}
                    Update capabilities
                </Link>
            </div>
        </div>
    )
}

export default function AccessControl() {
    const [groups, setGroups] = useState(null);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    // const [isAddModalOpen, setAddModalOpen] = useState(false);
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
            <CapabilityChangeCard groups={groups} />
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
