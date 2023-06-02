import { useContext, useEffect, useState } from "react";
import { useParams, Outlet } from "react-router-dom";
import { api } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { View } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { DeleteCapabilityModal } from "../Settings/common/DeleteCapabilityModal";
import { Capability, User } from "@mwdb-web/types/types";
import { ProfileNav } from "./common/ProfileNav";

export function ProfileView() {
    const auth = useContext(AuthContext);
    const { redirectToAlert, setAlert } = useViewAlert();
    const userLogin = useParams().user || auth.user.login;
    const [profile, setProfile] = useState<User>({} as User);
    const [capabilitiesToDelete, setCapabilitiesToDelete] = useState<
        Capability | ""
    >("");

    useEffect(() => {
        getProfile();
    }, [userLogin]);

    async function changeCapabilities(
        capability: Capability | "",
        callback: Function
    ) {
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
            const response = await api.getUserProfile(userLogin);
            setProfile(response.data);
        } catch (error) {
            redirectToAlert({
                target: "/profile",
                error,
            });
        }
    }

    if (profile.login !== userLogin) return <></>;

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
                successMessage={`Capabilities for ${userLogin} successfully changed`}
            />
        </View>
    );
}
