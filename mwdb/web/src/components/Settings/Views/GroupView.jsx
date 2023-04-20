import React, { useEffect, useState } from "react";
import { isEmpty } from "lodash";
import { useParams, Routes, Route, Link, Outlet } from "react-router-dom";

import { api } from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/ui";

export default function GroupView() {
    const { setAlert } = useViewAlert();
    const { name } = useParams();
    const [group, setGroup] = useState({});

    useEffect(() => {
        getGroup();
    }, [name]);

    async function getGroup() {
        try {
            const response = await api.getGroup(name);
            setGroup(response.data);
        } catch (error) {
            setAlert({ error });
        }
    }

    if (isEmpty(group)) return <></>;

    function BreadcrumbItems({ elements = [] }) {
        return [
            <li className="breadcrumb-item" key={"Group details"}>
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
