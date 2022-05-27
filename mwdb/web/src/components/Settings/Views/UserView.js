import React, { useCallback, useEffect, useState } from "react";
import {
    useParams,
    Outlet,
    Link,
    Route,
    Routes,
} from "react-router-dom-v5-compat";

import api from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/ui";

export default function UserView() {
    const { setAlert } = useViewAlert();
    const { login } = useParams();
    const [user, setUser] = useState({});

    async function updateUser() {
        try {
            const response = await api.getUser(login);
            setUser(response.data);
        } catch (error) {
            setAlert({ error });
        }
    }

    const getUser = useCallback(updateUser, [login, setAlert]);

    useEffect(() => {
        getUser();
    }, [getUser]);

    if (!user) return [];

    function BreadcrumbItems({ elements = [] }) {
        return [
            <li className="breadcrumb-item">
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
            <Outlet context={{ user, getUser }} />
        </div>
    );
}
