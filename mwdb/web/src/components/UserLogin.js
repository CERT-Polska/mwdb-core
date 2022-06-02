import React, { useContext, useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";

import { AuthContext } from "@mwdb-web/commons/auth";
import api from "@mwdb-web/commons/api";
import { Extension } from "@mwdb-web/commons/extensions";
import { View } from "@mwdb-web/commons/ui";

export default function UserLogin() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(null);

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

    if (auth.isAuthenticated) return <Navigate to="/" />;

    return (
        <View ident="userLogin" error={loginError}>
            <h2>Login</h2>
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
                <nav className="form-group">
                    <Link to="/recover_password">Forgot password?</Link>
                </nav>
                <input
                    type="submit"
                    value="Submit"
                    className="btn btn-primary"
                />
            </form>
        </View>
    );
}
