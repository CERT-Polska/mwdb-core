import React, { useCallback, useEffect, useState } from "react";
import { useParams, Routes, Route, Link, Outlet } from "react-router-dom";

import api from "../../../commons/api";
import { useViewAlert } from "../../../commons/ui";

export default function GroupView() {
    const { setAlert } = useViewAlert();
    const { name } = useParams();
    const [group, setGroup] = useState({});

    async function updateGroup() {
        try {
            const response = await api.getGroup(name);
            setGroup(response.data);
        } catch (error) {
            setAlert({ error });
        }
    }

    const getGroup = useCallback(updateGroup, [name, setAlert]);

    useEffect(() => {
        getGroup();
    }, [getGroup]);

    if (!group) return [];

    function BreadcrumbItems({ elements = [] }) {
        return [
            <li className="breadcrumb-item">
                <strong>Group details: </strong>
                {elements.length > 0 ? (
                    <Link to={`/settings/group/${group.name}`}>
                        {group.name}
                    </Link>
                ) : (
                    <span>{group.name}</span>
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
                            path="members"
                            element={<BreadcrumbItems elements={["Members"]} />}
                        />
                    </Routes>
                </ol>
            </nav>
            <Outlet context={{ group, getGroup }} />
        </div>
    );
}
