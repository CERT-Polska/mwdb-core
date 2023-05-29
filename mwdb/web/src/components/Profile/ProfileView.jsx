import React, { useContext, useEffect, useState } from "react";
import { NavLink, useParams, Outlet } from "react-router-dom";

import { faUserCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { api } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import DeleteCapabilityModal from "../Settings/Views/DeleteCapabilityModal";

function ProfileNav() {
    const config = useContext(ConfigContext);

    return (
        <div>
            <strong>
                <FontAwesomeIcon icon={faUserCog} /> Profile
            </strong>
            <div className="nav sidenav flex-column">
                <NavLink end to="/profile" className="nav-link">
                    Profile details
                </NavLink>
                <NavLink end to="/profile/capabilities" className="nav-link">
                    Capabilities
                </NavLink>
                <NavLink end to="/profile/groups" className="nav-link">
                    Groups
                </NavLink>
                <NavLink end to="/profile/api-keys" className="nav-link">
                    API keys
                </NavLink>
                {config.config["is_oidc_enabled"] ? (
                    <NavLink end to="/profile/oauth" className="nav-link">
                        OpenID Connect
                    </NavLink>
                ) : (
                    []
                )}
            </div>
            <hr />
        </div>
    );
}

export default function ProfileView() {
    const auth = useContext(AuthContext);
    const { redirectToAlert, setAlert } = useViewAlert();
    const user = useParams().user || auth.user.login;
    const [profile, setProfile] = useState({});
    const [capabilitiesToDelete, setCapabilitiesToDelete] = useState("");

    useEffect(() => {
        getProfile();
    }, [user]);

    async function changeCapabilities(capability, callback) {
        try {
            const capabilities = profile.capabilities.filter(
                (item) => item !== capability
            );
            await api.updateGroup(profile.login, { capabilities });
            getProfile();
            callback();
        } catch (error) {
            setAlert({ error });
        }
    }

    async function getProfile() {
        try {
            const response = await api.getUserProfile(user);
            setProfile(response.data);
        } catch (error) {
            redirectToAlert({
                target: "/profile",
                error,
            });
        }
    }

    if (profile.login !== user) return <></>;

    return (
        <View ident="profile" fluid>
            <div className="row">
                <div className="col-sm-2">
                    <ProfileNav />
                </div>
                <div className="col-sm-8">
                    <Outlet
                        context={{
                            profile,
                            getUser: getProfile,
                            setCapabilitiesToDelete,
                        }}
                    />
                </div>
            </div>
            <DeleteCapabilityModal
                changeCapabilities={changeCapabilities}
                capabilitiesToDelete={capabilitiesToDelete}
                setCapabilitiesToDelete={setCapabilitiesToDelete}
                successMessage={`Capabilities for ${user} successfully changed`}
            />
        </View>
    );
}
