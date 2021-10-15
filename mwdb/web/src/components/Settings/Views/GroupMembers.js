import React, { useEffect, useState, useCallback } from "react";
import api from "@mwdb-web/commons/api";
import { UserBadge, MemberList, useViewAlert } from "@mwdb-web/commons/ui";

export let GroupMemberList = (props) => (
    <MemberList
        nameKey="login"
        itemLinkClass={(user) => (
            <UserBadge user={user} clickable basePath="/settings" />
        )}
        {...props}
    />
);

export default function GroupMembers({ group, getGroup }) {
    const { setAlert } = useViewAlert();
    const [allUsers, setAllUsers] = useState([]);

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

    async function updateAllUsers() {
        try {
            let response = await api.getUsers();
            setAllUsers(response.data.users);
        } catch (error) {
            setAlert({ error });
        }
    }

    const getAllUsers = useCallback(updateAllUsers, [setAlert]);

    useEffect(() => {
        getAllUsers();
    }, [getAllUsers]);

    if (Object.keys(group).length === 0) return [];

    let usersItems = group.users
        .map((user) => ({ login: user }))
        .sort((userA, userB) => userA.login.localeCompare(userB.login));

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
