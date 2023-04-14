import React, { useEffect, useState } from "react";
import { isEmpty } from "lodash";
import { useParams, Routes, Route, Link, Outlet } from "react-router-dom";
import { isEmpty } from "lodash";

import { api } from "@mwdb-web/commons/api";
import { useViewAlert, ConfirmationModal } from "@mwdb-web/commons/ui";

export default function GroupView() {
    const { setAlert } = useViewAlert();
    const { name } = useParams();
    const [group, setGroup] = useState({});
    const [capabilitiesToDelete, setCapabilitiesToDelete] = useState("");

    async function changeCapabilities(capability) {
        try {
            const capabilities = group.capabilities.filter(
                (item) => item !== capability
            );
            await api.updateGroup(group.name, { capabilities });
            setCapabilitiesToDelete("");
            setAlert({
                success: `Capabilities for ${group.name} successfully changed`,
            });
        } catch (error) {
            setAlert({ error });
        }
    }

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
            <Outlet context={{ group, getGroup, setCapabilitiesToDelete }} />
        </div>
    );
}
