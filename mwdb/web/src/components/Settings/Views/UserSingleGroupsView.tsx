import { useEffect, useState } from "react";
import { isEmpty } from "lodash";

import { api } from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { useOutletContext } from "react-router-dom";
import { AddGroupForm } from "../common/AddGroupForm";
import { GroupsList } from "../common/GroupsList";
import { UserOutletContext } from "@mwdb-web/types/context";
import { Group } from "@mwdb-web/types/types";

export function UserSingleGroupsView() {
    const { setAlert } = useViewAlert();
    const { user, getUser }: UserOutletContext = useOutletContext();
    const [allGroups, setAllGroups] = useState<Group[]>([]);

    async function addMember(group: string) {
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

    async function removeMember(group: string) {
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
