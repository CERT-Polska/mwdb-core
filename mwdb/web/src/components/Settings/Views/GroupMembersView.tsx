import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Pagination from "react-js-pagination";
import { isEmpty } from "lodash";

import { api } from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { AddMemberForm } from "../common/AddMemberForm";
import { MemberList } from "../common/MemberList";
import { GroupOutletContext } from "@mwdb-web/types/context";
import { User } from "@mwdb-web/types/types";

export function GroupMembersView() {
    const { setAlert } = useViewAlert();
    const { group, getGroup }: GroupOutletContext = useOutletContext();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [activePage, setActivePage] = useState<number>(1);

    useEffect(() => {
        getAllUsers();
    }, []);

    async function addMember(login: string) {
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

    async function removeMember(login: string) {
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
    async function setAdminMembership(login: string, membership: boolean) {
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
