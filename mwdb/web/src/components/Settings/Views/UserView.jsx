import React, { useEffect, useState } from "react";
import { useParams, Outlet, Link, Route, Routes } from "react-router-dom";
import { isEmpty, find } from "lodash";

import { api } from "@mwdb-web/commons/api";
import { useViewAlert, ConfirmationModal } from "@mwdb-web/commons/ui";

export default function UserView() {
    const { setAlert } = useViewAlert();
    const { login } = useParams();
    const [user, setUser] = useState({});
    const [capabilitiesToDelete, setCapabilitiesToDelete] = useState("");

    const getUser = useCallback(updateUser, [login, setAlert]);

    useEffect(() => {
        getUser();
    }, [login]);

    async function getUser() {
        try {
            const response = await api.getUser(login);
            setUser(response.data);
        } catch (error) {
            setAlert({ error });
        }
    }

    async function changeCapabilities(capability) {
        try {
            const foundUserCapabilities = find(user.groups, {
                name: user.login,
            }).capabilities;
            const capabilities = foundUserCapabilities.filter(
                (item) => item !== capability
            );
            await api.updateGroup(user.login, { capabilities });
            setCapabilitiesToDelete("");
            setAlert({
                success: `Capabilities for ${user.login} successfully changed`,
            });
        } catch (error) {
            setAlert({ error });
        }
    }

   if (isEmpty(user)) return <></>;

    function BreadcrumbItems({ elements = [] }) {
        return [
            <li className="breadcrumb-item" key="account-details">
                <strong>Account details: </strong>
                {elements.length > 0 ? (
                    <Link to={`/settings/user/${user.login}`}>
                        {user.login}
                    </Link>
                ) : (
                    <span>{user.login}</span>
                )}
            </li>,
            ...elements.map((element, index) => (
                <li
                    key={index}
                    className={`breadcrumb-item ${
                        index === elements.length - 1 ? "active" : ""
                    }`}
                >
                    {element}
                </li>
            )),
        ];
    }

    return (
        <div className="container">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <Routes>
                        <Route index element={<BreadcrumbItems />} />
                        <Route
                            path="capabilities"
                            element={
                                <BreadcrumbItems elements={["Capabilities"]} />
                            }
                        />
                        <Route
                            path="api-keys"
                            element={
                                <BreadcrumbItems elements={["API keys"]} />
                            }
                        />
                        <Route
                            path="password"
                            element={
                                <BreadcrumbItems
                                    elements={["Reset password"]}
                                />
                            }
                        />
                        <Route
                            path="groups"
                            element={<BreadcrumbItems elements={["Groups"]} />}
                        />
                    </Routes>
                </ol>
            </nav>
            <ConfirmationModal
                buttonStyle="badge-success"
                confirmText="Yes"
                message={`Are you sure you want to delete '${capabilitiesToDelete}' capabilities?`}
                isOpen={!isEmpty(capabilitiesToDelete)}
                onRequestClose={() => setCapabilitiesToDelete("")}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    changeCapabilities(capabilitiesToDelete);
                }}
            />
            <Outlet context={{ user, getUser, setCapabilitiesToDelete }} />
        </div>
    );
}
