import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Pagination from "react-js-pagination";
import { isEmpty } from "lodash";

import { faTrash, faCrown, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { api } from "@mwdb-web/commons/api";
import {
    Autocomplete,
    ConfirmationModal,
    UserBadge,
} from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";

function AddMemberForm({ newMemberItems, addMember }) {
    const [newMember, setNewMember] = useState("");

    return (
        <div className="card">
            <div className="card-body">
                <Autocomplete
                    value={newMember}
                    getItemValue={(user) => user.login}
                    items={newMemberItems.filter(
                        (user) =>
                            user.login
                                .toLowerCase()
                                .indexOf(newMember.toLowerCase()) !== -1
                    )}
                    onChange={(value) => setNewMember(value)}
                    className="form-control"
                    placeholder="User login"
                />
                <button
                    className="btn btn-outline-success mt-2 mr-1"
                    disabled={newMember.length === 0}
                    onClick={() => {
                        addMember(newMember);
                        setNewMember("");
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} /> Add member
                </button>
            </div>
        </div>
    );
}

function MemberList({ members, admins, setAdminMembership, removeMember }) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalSpec, setModalSpec] = useState({});

    function setAdmin(member, membership) {
        const message = `Are you sure to change admin group permissions for ${member}?`;

        setModalSpec({
            message,
            action: () => {
                setModalOpen(false);
                setAdminMembership(member, membership);
            },
            buttonStyle: "bg-success",
            confirmText: "Yes",
        });
        setModalOpen(true);
    }

    function removeMembership(member) {
        const message = `Remove ${member} from this group`;

        setModalSpec({
            message,
            action: () => {
                setModalOpen(false);
                removeMember(member);
            },
            confirmText: "Remove",
        });
        setModalOpen(true);
    }

    return (
        <React.Fragment>
            {members.map((member, index) => (
                <tr key={index}>
                    <th className="col">
                        <UserBadge
                            user={member}
                            clickable
                            basePath="/settings"
                        />
                        {admins.includes(member.login) ? (
                            <span
                                data-toggle="tooltip"
                                title="Group admin user"
                            >
                                <FontAwesomeIcon
                                    className="navbar-icon"
                                    icon={faCrown}
                                />
                            </span>
                        ) : (
                            []
                        )}
                    </th>
                    <td className="col-auto">
                        <Link
                            to="#"
                            data-toggle="tooltip"
                            title="Remove user from group"
                            onClick={(ev) => {
                                ev.preventDefault();
                                removeMembership(
                                    member.login,
                                    !admins.includes(member.login)
                                );
                            }}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </Link>
                    </td>
                    <td className="col-auto">
                        <Link
                            to="#"
                            data-toggle="tooltip"
                            title="Give or revoke group admin permissions"
                            onClick={(ev) => {
                                ev.preventDefault();
                                setAdmin(
                                    member.login,
                                    !admins.includes(member.login)
                                );
                            }}
                        >
                            <FontAwesomeIcon icon={faCrown} />
                        </Link>
                    </td>
                </tr>
            ))}
            <ConfirmationModal
                isOpen={isModalOpen}
                onRequestClose={() => {
                    setModalOpen(false);
                    setModalSpec({});
                }}
                onConfirm={modalSpec.action}
                message={modalSpec.message}
                buttonStyle={modalSpec.buttonStyle}
                confirmText={modalSpec.confirmText}
            />
        </React.Fragment>
    );
}

export default function GroupMembers() {
    const { setAlert } = useViewAlert();
    const { group, getGroup } = useOutletContext();
    const [allUsers, setAllUsers] = useState([]);
    const [activePage, setActivePage] = useState(1);

    useEffect(() => {
        getAllUsers();
    }, []);

    async function addMember(login) {
        try {
            await api.addGroupMember(group.name, login);
            getGroup();
            setAlert({
                success: `Member '${login}' successfully added.`,
            });
        } catch (error) {
            setAlert({ error });
        }
    }

    async function removeMember(login) {
        try {
            await api.removeGroupMember(group.name, login);
            getGroup();
            setAlert({
                success: `Member '${login}' successfully removed.`,
            });
        } catch (error) {
            setAlert({ error });
        }
    }
    async function setAdminMembership(login, membership) {
        try {
            await api.setGroupAdmin(group.name, login, membership);
            getGroup();
            setAlert({
                success: `Member '${login}' successfully updated.`,
            });
        } catch (error) {
            setAlert({ error });
        }
    }

    async function getAllUsers() {
        try {
            let response = await api.getUsers();
            setAllUsers(response.data.users);
        } catch (error) {
            setAlert({ error });
        }
    }

    if (isEmpty(group)) return <></>;

    const usersItems = group.users
        .map((user) => ({ login: user }))
        .sort((userA, userB) => userA.login.localeCompare(userB.login));

    const allUsersItems = allUsers.filter(
        (v) => !usersItems.map((c) => c.login).includes(v.login)
    );

    return (
        <div className="container">
            <AddMemberForm
                newMemberItems={allUsersItems}
                addMember={addMember}
            />
            <table className="table table-bordered wrap-table">
                <tbody>
                    <MemberList
                        members={usersItems
                            .sort()
                            .slice((activePage - 1) * 10, activePage * 10)}
                        admins={group.admins}
                        setAdminMembership={setAdminMembership}
                        removeMember={removeMember}
                    />
                </tbody>
            </table>
            <Pagination
                activePage={activePage}
                itemsCountPerPage={10}
                totalItemsCount={usersItems.length}
                pageRangeDisplayed={5}
                onChange={setActivePage}
                itemClass="page-item"
                linkClass="page-link"
            />
        </div>
    );
}
