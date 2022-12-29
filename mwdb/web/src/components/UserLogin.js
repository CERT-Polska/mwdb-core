import React, { useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";

import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import api from "@mwdb-web/commons/api";
import { Extension } from "@mwdb-web/commons/extensions";
import { View, ShowIf } from "@mwdb-web/commons/ui";
import { ProviderButton, ProvidersSelectList } from "./OAuth";

export default function UserLogin() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(null);
    const [providers, setProviders] = useState([]);

    const loginStyle = {
        backgroundColor: "#f2f2f2",
        padding: "50px",
        marginTop: "5%",
        width: "450px",
        borderRadius: "10px",
    };

    const locationState = location.state || {};
    async function tryLogin() {
        try {
            const response = await api.authLogin(login, password);
            const prevLocation = locationState.prevLocation || "/";
            auth.updateSession(response.data);
            navigate(prevLocation);
        } catch (error) {
            setLoginError(error);
        }
    }

    async function getProviders() {
        if (!config.config["is_oidc_enabled"]) {
            setProviders([]);
            return;
        }
        try {
            const response = await api.oauthGetProviders();
            setProviders(response.data["providers"]);
        } catch (e) {
            setLoginError(e);
        }
    }

    useEffect(() => {
        getProviders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (auth.isAuthenticated) return <Navigate to="/" />;

    return (
        <View ident="userLogin" error={loginError} style={loginStyle}>
            <h3 align="center">Welcome to MWDB</h3>
            <form
                onSubmit={(ev) => {
                    ev.preventDefault();
                    tryLogin();
                }}
            >
                <Extension ident="userLoginNote" />
                <div className="form-group">
                    <label>Login</label>
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
                    <label>Password</label>
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
                <hr />
                <ShowIf condition={providers.length}>
                    {providers.length <= 5 ? (
                        providers.map((provider) => (
                            <ProviderButton provider={provider} />
                        ))
                    ) : (
                        <ProvidersSelectList providersList={providers} />
                    )}
                    <hr />
                </ShowIf>
                {config.config["is_registration_enabled"] ? (
                    <nav className="form-group" style={{ textAlign: "center" }}>
                        <Link to="/register">Register user</Link>
                    </nav>
                ) : (
                    []
                )}
                <nav className="form-group" style={{ textAlign: "center" }}>
                    <Link to="/recover_password">Forgot password?</Link>
                </nav>
            </form>
        </View>
    );
}
