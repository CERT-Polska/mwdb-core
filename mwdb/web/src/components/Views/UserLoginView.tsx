import { useCallback, useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { api } from "@mwdb-web/commons/api";
import { Extension } from "@mwdb-web/commons/plugins";
import { View, ShowIf, ConfirmationModal } from "@mwdb-web/commons/ui";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { authenticate } from "@mwdb-web/commons/helpers/authenticate";
import { ProviderButton } from "../ProviderButton";
import { ProvidersSelectList } from "../ProvidersSelectList";

export function UserLoginView() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [login, setLogin] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [providers, setProviders] = useState<string[]>([]);
    const [oAuthRegisterModalOpen, setOAuthRegisterModalOpen] =
        useState<boolean>(false);

    const colorsList = ["#3c5799", "#01a0f6", "#d03f30", "#b4878b", "#444444"];
    const isOIDCEnabled = config.config["is_oidc_enabled"];

    const locationState = location.state || {};
    async function tryLogin() {
        try {
            const response = await api.authLogin(login, password);
            const prevLocation = locationState.prevLocation || "/";
            auth.updateSession(response.data);
            navigate(prevLocation);
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }

    const getProviders = useCallback(async () => {
        try {
            const response = await api.oauthGetProviders();
            setProviders(response.data["providers"]);
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }, []);

    useEffect(() => {
        if (isOIDCEnabled) {
            getProviders();
        }
    }, [getProviders, isOIDCEnabled]);

    useEffect(() => {
        if (location.state) {
            if (
                location.state.attemptedProvider &&
                config.config["is_registration_enabled"]
            ) {
                setOAuthRegisterModalOpen(true);
            }
        }
    }, []);

    if (auth.isAuthenticated) return <Navigate to="/" />;

    return (
        <div className="user-login">
            <ConfirmationModal
                buttonStyle="btn-success"
                isOpen={oAuthRegisterModalOpen}
                onRequestClose={() => {
                    setOAuthRegisterModalOpen(false);
                    navigate("/login", {
                        replace: true,
                    });
                }}
                onConfirm={() => {
                    setOAuthRegisterModalOpen(false);
                    authenticate(location.state.attemptedProvider, "register");
                }}
            >
                We couldn't find an account associated with your oAuth identity.
                Do you want to register using{" "}
                {location.state ? location.state.attemptedProvider : ""}?
            </ConfirmationModal>
            <div className="background" />
            <View fluid ident="userLogin">
                <h2>Welcome to MWDB</h2>
                <h6>Log in using mwdb credentials</h6>
                <form
                    onSubmit={(ev) => {
                        ev.preventDefault();
                        tryLogin();
                    }}
                >
                    <Extension ident="userLoginNote" />
                    <div className="form-group">
                        <label className="required">Login</label>
                        <input
                            type="text"
                            name="login"
                            value={login}
                            onChange={(ev) => setLogin(ev.target.value)}
                            className="form-control"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="required">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={(ev) => setPassword(ev.target.value)}
                            className="form-control"
                            required
                        />
                    </div>
                    <input
                        type="submit"
                        value="Log in"
                        className="form-control btn btn-success"
                    />
                    <nav
                        className="form-group"
                        style={{ textAlign: "center", marginTop: "5px" }}
                    >
                        <div className="d-flex justify-content-between">
                            <div>
                                <Link to="/recover_password">
                                    Forgot password?
                                </Link>
                            </div>
                            <div>
                                <ShowIf
                                    condition={
                                        config.config["is_registration_enabled"]
                                    }
                                >
                                    <Link to="/register">Register user</Link>
                                </ShowIf>
                            </div>
                        </div>
                    </nav>
                    <ShowIf condition={providers.length > 0}>
                        <>
                            <hr />
                            <h6>Log in using OAuth</h6>
                            {providers.length <= 5 ? (
                                providers.map((provider, i) => (
                                    <ProviderButton
                                        provider={provider}
                                        color={
                                            colorsList[i % colorsList.length]
                                        }
                                    />
                                ))
                            ) : (
                                <ProvidersSelectList
                                    providersList={providers}
                                />
                            )}
                        </>
                    </ShowIf>
                </form>
            </View>
        </div>
    );
}
