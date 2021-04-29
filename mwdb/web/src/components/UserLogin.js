import React, { useContext, useState } from "react";
import { useHistory } from "react-router";
import { Link, Redirect } from "react-router-dom";

import { AuthContext } from "@mwdb-web/commons/auth";
import api from "@mwdb-web/commons/api";
import { Extension } from "@mwdb-web/commons/extensions";
import { View } from "@mwdb-web/commons/ui";

function Autocomplete({items, itemValue, renderItem, value, onChange, ...inputProps}) {
    const getItemValue = itemValue || ((item) => item)
    const ItemComponent = renderItem || (({item}) => getItemValue(item));

    return (
        <div className="dropdown">
            <div data-toggle="dropdown">
                <input value={value} onChange={(ev) => onChange(ev.target.value)}
                       {...(inputProps || {})}
                />
            </div>
            <div className="dropdown-menu" role="menu">
                {
                    items.map((item) => (
                        <button className="dropdown-item"
                                onClick={(ev) => {
                                    ev.preventDefault()
                                    onChange(getItemValue(item));
                                }}>
                            <ItemComponent item={item} />
                        </button>
                    ))
                }
            </div>
        </div>
    )
}

export default function UserLogin() {
    const auth = useContext(AuthContext);
    const history = useHistory();

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState(null);

    const locationState = history.location.state || {};
    async function tryLogin() {
        try {
            const response = await api.authLogin(login, password);
            const prevLocation = locationState.prevLocation || "/";
            auth.updateSession(response.data);
            history.push(prevLocation);
        } catch (error) {
            setLoginError(error);
        }
    }

    if (auth.isAuthenticated) return <Redirect to="/" />;

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
                <Autocomplete items={["item"]} value={"item"} onChange={()=>{}} className="form-control"/>
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
