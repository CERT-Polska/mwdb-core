import React, { useEffect, useState, useCallback } from "react";
import api from "@mwdb-web/commons/api";
import { GroupBadge, MemberList, useViewAlert } from "@mwdb-web/commons/ui";

export let GroupMemberList = (props) => (
    <MemberList
        nameKey="name"
        itemLinkClass={(group) => (
            <GroupBadge group={group} clickable basePath="/settings" />
        )}
        {...props}
    />
);

export default function UserSingleGroups({ user, getUser }) {
    const { setAlert } = useViewAlert();
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

    async function updateAllGroups() {
        try {
            let response = await api.getGroups();
            setAllGroups(response.data.groups);
        } catch (error) {
            setAlert({ error });
        }
    }

    const getAllGroups = useCallback(updateAllGroups, [setAlert]);

    useEffect(() => {
        getAllGroups();
    }, [getAllGroups]);

    if (Object.keys(user).length === 0) return [];

    let groupItems = user.groups
        .filter((group) => group.name !== "public" && group.name !== user.login)
        .sort((groupA, groupB) => groupA.name.localeCompare(groupB.name));

    let allGroupItems = allGroups.filter(
        (group) =>
            !user.groups.map((g) => g.name).includes(group.name) &&
            !group.private &&
            group.name !== "public"
    );

    return (
        <div className="container">
            <h2>User groups:</h2>
            <GroupMemberList
                items={groupItems}
                addMember={addMember}
                removeMember={removeMember}
                newMemberItems={allGroupItems}
                userName={user.login}
            />
        </div>
    );
}
