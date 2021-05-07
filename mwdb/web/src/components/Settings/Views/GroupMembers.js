import React, { useEffect, useState, useCallback } from "react";
import { UserLink } from "./ShowUsers";
import api from "@mwdb-web/commons/api";
import { MemberList, getErrorMessage } from "@mwdb-web/commons/ui";
import { useHistory } from "react-router-dom";

export let GroupMemberList = (props) => (
    <MemberList nameKey="login" itemLinkClass={UserLink} {...props} />
);

export default function GroupMembers({ group, getGroup }) {
    const history = useHistory();
    const [allUsers, setAllUsers] = useState([]);

    async function addMember(login) {
        try {
            await api.addGroupMember(group.name, login);
            getGroup();
        } catch (error) {
            history.push({
                pathname: `/admin/group/${group.name}`,
                state: { error: getErrorMessage(error) },
            });
        }
    }

    async function removeMember(login) {
        try {
            await api.removeGroupMember(group.name, login);
            getGroup();
        } catch (error) {
            history.push({
                pathname: `/admin/group/${group.name}`,
                state: { error: getErrorMessage(error) },
            });
        }
    }
    async function setAdminMembership(login, membership) {
        try {
            await api.setGroupAdmin(group.name, login, membership);
            getGroup();
        } catch (error) {
            history.push({
                pathname: `/admin/group/${group.name}`,
                state: { error: getErrorMessage(error) },
            });
        }
    }

    async function updateAllUsers() {
        try {
            let response = await api.getUsers();
            setAllUsers(response.data.users);
        } catch (error) {
            history.push({
                pathname: `/admin/group/${group.name}`,
                state: { error: getErrorMessage(error) },
            });
        }
    }

    const getAllUsers = useCallback(updateAllUsers, []);

    useEffect(() => {
        getAllUsers();
    }, [getAllUsers]);

    if (Object.keys(group).length === 0) return [];

    let usersItems = group.users.map((user) => ({ login: user }));
    let allUsersItems = allUsers.filter(
        (v) => !usersItems.map((c) => c.login).includes(v.login)
    );

    return (
        <div className="container">
            <h2>Group members:</h2>
            <GroupMemberList
                items={usersItems}
                admins={group.admins}
                setAdminMembership={setAdminMembership}
                addMember={addMember}
                removeMember={removeMember}
                newMemberItems={allUsersItems}
                groupName={group.name}
            />
        </div>
    );
}
