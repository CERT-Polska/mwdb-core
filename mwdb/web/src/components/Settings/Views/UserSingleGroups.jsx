import React, { useEffect, useState } from "react";
import { isEmpty } from "lodash";

import { api } from "@mwdb-web/commons/api";
import {
    Autocomplete,
    ConfirmationModal,
    GroupBadge,
    useViewAlert,
} from "@mwdb-web/commons/ui";
import { faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useOutletContext } from "react-router-dom";

function AddGroupForm({ newGroupsItems, addGroup }) {
    const [newGroup, setNewGroup] = useState("");
    const [isModalOpen, setModalOpen] = useState(false);

    return (
        <div className="card">
            <div className="card-body">
                <Autocomplete
                    value={newGroup}
                    getItemValue={(group) => group.name}
                    items={newGroupsItems.filter(
                        (group) =>
                            group.name
                                .toLowerCase()
                                .indexOf(newGroup.toLowerCase()) !== -1
                    )}
                    onChange={(value) => setNewGroup(value)}
                    className="form-control"
                    placeholder="Group name"
                />
                <button
                    className="btn btn-outline-success mt-2 mr-1"
                    disabled={newGroup.length === 0}
                    onClick={() => {
                        setModalOpen(true);
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} /> Add group
                </button>
                <ConfirmationModal
                    isOpen={isModalOpen}
                    onRequestClose={() => {
                        setModalOpen(false);
                    }}
                    onConfirm={() => {
                        addGroup(newGroup);
                        setNewGroup("");
                        setModalOpen(false);
                    }}
                    message={`Are you sure you want to add current user to ${newGroup} group?`}
                    buttonStyle="btn-success"
                    confirmText="Add"
                />
            </div>
        </div>
    );
}

function GroupsList({ groups, removeMember }) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [removeGroup, setRemoveGroup] = useState("");

    return (
        <React.Fragment>
            {groups.map((group) => (
                <tr key={group.name}>
                    <th className="col">
                        <GroupBadge
                            group={group}
                            clickable
                            basePath="/settings"
                        />
                    </th>
                    <td className="col-auto">
                        <Link
                            to="#"
                            data-toggle="tooltip"
                            title="Remove user from group"
                            onClick={(ev) => {
                                ev.preventDefault();
                                setModalOpen(true);
                                setRemoveGroup(group.name);
                            }}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </Link>
                    </td>
                </tr>
            ))}
            <ConfirmationModal
                isOpen={isModalOpen}
                onRequestClose={() => {
                    setModalOpen(false);
                    setRemoveGroup("");
                }}
                onConfirm={() => {
                    removeMember(removeGroup);
                    setModalOpen(false);
                }}
                message={`Are you sure you want to remove user from ${removeGroup} group?`}
                confirmText="Remove"
            />
        </React.Fragment>
    );
}

export default function UserSingleGroups() {
    const { setAlert } = useViewAlert();
    const { user, getUser } = useOutletContext();
    const [allGroups, setAllGroups] = useState([]);

    async function addMember(group) {
        try {
            await api.addGroupMember(group, user.login);
            getUser();
            setAlert({
                success: `User successfully added to '${group}' group.`,
            });
        } catch (error) {
            setAlert({ error });
        }
    }

    async function removeMember(group) {
        try {
            await api.removeGroupMember(group, user.login);
            getUser();
            setAlert({
                success: `User successfully removed from '${group}' group.`,
            });
        } catch (error) {
            setAlert({ error });
        }
    }

    async function getAllGroups() {
        try {
            let response = await api.getGroups();
            setAllGroups(response.data.groups);
        } catch (error) {
            setAlert({ error });
        }
    }

    useEffect(() => {
        getAllGroups();
    }, []);

    if (isEmpty(user)) return <></>;

    const groupItems = user.groups
        .filter((group) => group.name !== "public" && group.name !== user.login)
        .sort((groupA, groupB) => groupA.name.localeCompare(groupB.name));

    const allGroupItems = allGroups.filter(
        (group) =>
            !user.groups.map((g) => g.name).includes(group.name) &&
            !group.private &&
            group.name !== "public"
    );

    return (
        <div className="container">
            <AddGroupForm newGroupsItems={allGroupItems} addGroup={addMember} />
            <table className="table table-bordered wrap-table">
                <tbody>
                    <GroupsList
                        groups={groupItems}
                        removeMember={removeMember}
                    />
                </tbody>
            </table>
        </div>
    );
}
