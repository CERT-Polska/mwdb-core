import React, { useEffect, useState, useCallback } from "react";
import api from "@mwdb-web/commons/api";
import { GroupBadge, MemberList, getErrorMessage } from "@mwdb-web/commons/ui";
import { useHistory } from "react-router-dom";

export let GroupMemberList = (props) => (
    <MemberList
        nameKey="name"
        itemLinkClass={(group) => <GroupBadge group={group} />}
        {...props}
    />
);

export default function UserSingleGroups({ user, getUser }) {
    const history = useHistory();
    const [allGroups, setAllGroups] = useState([]);

    async function addMember(group) {
        try {
            await api.addGroupMember(group, user.login);
            getUser();
        } catch (error) {
            history.push({
                pathname: `/admin/user/${user.login}`,
                state: { error: getErrorMessage(error) },
            });
        }
    }

    async function removeMember(group) {
        try {
            await api.removeGroupMember(group, user.login);
            getUser();
        } catch (error) {
            history.push({
                pathname: `/admin/user/${user.login}`,
                state: { error: getErrorMessage(error) },
            });
        }
    }

    async function updateAllGroups() {
        try {
            let response = await api.getGroups();
            setAllGroups(response.data.groups);
        } catch (error) {
            history.push({
                pathname: `/admin/user/${user.login}`,
                state: { error: getErrorMessage(error) },
            });
        }
    }

    const getAllGroups = useCallback(updateAllGroups, []);

    useEffect(() => {
        getAllGroups();
    }, [getAllGroups]);

    if (Object.keys(user).length === 0) return [];

    let groupItems = user.groups.filter(
        (group) => group.name !== "public" && group.name !== user.login
    );

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
