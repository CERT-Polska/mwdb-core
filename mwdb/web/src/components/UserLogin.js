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
        backgroundColor: "white",
        padding: "50px",
        marginTop: "7%",
        width: "450px",
        borderRadius: "10px",
    };
    const divStyle = {
        backgroundColor: "#f2f2f2",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: -1,
        minHeight: "100%",
        width: "100%",
    };
    const colorsList = ["#3c5799", "#01a0f6", "#d03f30", "#b4878b", "#444444"];

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
        <div style={divStyle}>
            <View ident="userLogin" error={loginError} style={loginStyle}>
                <h2 align="center">Welcome to MWDB</h2>
                <h6 align="center">Log in using mwdb credentials</h6>
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
                    <nav
                        className="form-group"
                        style={{ textAlign: "center", marginTop: "5px" }}
                    >
                        <table width="100%">
                            <td width="50%" align="left">
                                <Link to="/recover_password">
                                    Forgot password?
                                </Link>
                            </td>
                            <td width="50%" align="right">
                                <ShowIf
                                    condition={
                                        config.config["is_registration_enabled"]
                                    }
                                >
                                    <Link to="/register">Register user</Link>
                                </ShowIf>
                            </td>
                        </table>
                    </nav>
                    <ShowIf condition={providers.length}>
                        <hr />
                        <h6 align="center">Log in using OAuth</h6>
                        {providers.length <= 5 ? (
                            providers.map((provider, i) => (
                                <ProviderButton
                                    provider={provider}
                                    color={colorsList[i % colorsList.length]}
                                />
                            ))
                        ) : (
                            <ProvidersSelectList providersList={providers} />
                        )}
                    </ShowIf>
                </form>
            </View>
        </div>
    );
}
