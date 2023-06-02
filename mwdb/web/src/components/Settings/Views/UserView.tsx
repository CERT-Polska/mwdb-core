import { useEffect, useState } from "react";
import { useParams, Outlet, Link, Route, Routes } from "react-router-dom";
import { isEmpty, find } from "lodash";

import { api } from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { DeleteCapabilityModal } from "../common/DeleteCapabilityModal";
import { Capability, User } from "@mwdb-web/types/types";

export function UserView() {
    const [capabilitiesToDelete, setCapabilitiesToDelete] = useState<
        Capability | ""
    >("");
    const { setAlert } = useViewAlert();
    const { login } = useParams();
    const [user, setUser] = useState<User>({} as User);

    useEffect(() => {
        getUser();
    }, [login]);

    async function getUser() {
        try {
            const response = await api.getUser(login!);
            setUser(response.data);
        } catch (error) {
            setAlert({ error });
        }
    }

    async function changeCapabilities(
        capability: Capability | "",
        callback: () => void
    ) {
        try {
            const foundUserCapabilities =
                find(user.groups, {
                    name: user.login,
                })?.capabilities ?? [];
            const capabilities = foundUserCapabilities.filter(
                (item) => item !== capability
            );
            await api.updateGroup(user.login, { capabilities });
            getUser();
            callback();
        } catch (error) {
            setAlert({ error });
        }
    }

    if (isEmpty(user)) return <></>;

    function BreadcrumbItems({ elements = [] }: { elements?: string[] }) {
        return (
            <>
                <li className="breadcrumb-item" key="account-details">
                    <strong>Account details: </strong>
                    {elements.length > 0 ? (
                        <Link to={`/settings/user/${user.login}`}>
                            {user.login}
                        </Link>
                    ) : (
                        <span>{user.login}</span>
                    )}
                </li>
                {...elements.map((element, index) => (
                    <li
                        key={index}
                        className={`breadcrumb-item ${
                            index === elements.length - 1 ? "active" : ""
                        }`}
                    >
                        {element}
                    </li>
                ))}
            </>
        );
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
            <DeleteCapabilityModal
                changeCapabilities={changeCapabilities}
                capabilitiesToDelete={capabilitiesToDelete}
                setCapabilitiesToDelete={setCapabilitiesToDelete}
                successMessage={`Capabilities for ${user.login} successfully changed`}
            />
            <Outlet context={{ user, getUser, setCapabilitiesToDelete }} />
        </div>
    );
}
