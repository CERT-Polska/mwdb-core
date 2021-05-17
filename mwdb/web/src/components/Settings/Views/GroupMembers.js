import React, { useEffect, useState, useCallback } from "react";
import api from "@mwdb-web/commons/api";
import { UserBadge, MemberList, useViewAlert } from "@mwdb-web/commons/ui";

export let GroupMemberList = (props) => (
    <MemberList
        nameKey="login"
        itemLinkClass={(user) => (
            <UserBadge user={user} clickable basePath="/admin" />
        )}
        {...props}
    />
);

export default function GroupMembers({ group, getGroup }) {
    const viewAlert = useViewAlert();
    const [allUsers, setAllUsers] = useState([]);

    async function addMember(login) {
        try {
            await api.addGroupMember(group.name, login);
            getGroup();
            viewAlert.setAlert({
                success: `Member '${login}' successfully added.`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function removeMember(login) {
        try {
            await api.removeGroupMember(group.name, login);
            getGroup();
            viewAlert.setAlert({
                success: `Member '${login}' successfully removed.`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }
    async function setAdminMembership(login, membership) {
        try {
            await api.setGroupAdmin(group.name, login, membership);
            getGroup();
            viewAlert.setAlert({
                success: `Member '${login}' successfully updated.`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function updateAllUsers() {
        try {
            let response = await api.getUsers();
            setAllUsers(response.data.users);
        } catch (error) {
            viewAlert.setAlert({ error });
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
