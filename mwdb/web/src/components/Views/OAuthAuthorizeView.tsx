import { useContext, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { api } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { ConfigContext } from "@mwdb-web/commons/config";

export function OAuthAuthorizeView() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const navigate = useNavigate();
    // Current query set in URI path
    const searchParams = useSearchParams()[0];
    const { code, state } = Object.fromEntries(searchParams);
    const isRegistrationEnabled =
        config.config["is_oidc_registration_enabled"] ||
        config.config["is_registration_enabled"];

    async function authorize() {
        const stateData = sessionStorage.getItem(`openid_${state}`);
        if (!stateData) {
            toast("Invalid state data", { type: "error" });
            navigate("/");
            return;
        }
        const { provider, nonce, action, expiration } = JSON.parse(stateData);
        sessionStorage.removeItem(`openid_${state}`);
        try {
            const expirationTime = new Date(expiration).getTime();
            if (Date.now() > expirationTime)
                throw new Error("Session expired. Please try again.");
            const response = await api.oauthCallback(
                provider,
                action,
                code,
                nonce,
                state
            );
            if (action === "bind_account") {
                toast("New external identity successfully added", {
                    type: "success",
                });
                navigate("/profile/oauth", {
                    replace: true,
                });
            } else if (action === "register" && !response.data["token"]) {
                toast(
                    `User ${response.data.login} registration requested. Account is
                        waiting for administrator approval`,
                    { type: "success" }
                );
                navigate("/login", {
                    replace: true,
                });
            } else {
                auth.updateSession(response.data);
                navigate("/", {
                    replace: true,
                });
            }
        } catch (e) {
            if (
                action === "authorize" &&
                getErrorMessage(e) === "Unknown identity"
            ) {
                if (isRegistrationEnabled) {
                    // Show proposal to register account
                    navigate("/login", {
                        state: {
                            attemptedProvider: provider,
                        },
                        replace: true,
                    });
                } else {
                    toast(
                        "Account doesn't exist in MWDB and administrator " +
                            "doesn't allow to create new accounts this way",
                        {
                            type: "error",
                        }
                    );
                    navigate("/login", {
                        replace: true,
                    });
                }
            } else if (action === "bind_account") {
                toast(getErrorMessage(e), {
                    type: "error",
                });
                navigate("/profile/oauth", {
                    replace: true,
                });
            } else {
                toast(getErrorMessage(e), {
                    type: "error",
                });
                navigate("/login", {
                    replace: true,
                });
            }
        }
    }

    useEffect(() => {
        authorize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div>Wait for authorization...</div>;
}
