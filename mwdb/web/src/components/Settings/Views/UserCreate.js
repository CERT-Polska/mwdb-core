import React, { useState } from "react";

import api from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/ui";

export default function UserCreate() {
    const viewAlert = useViewAlert();
    const [values, setValues] = useState({
        login: "",
        email: "",
        additional_info: "",
        feed_quality: "high",
        send_email: true,
    });

    function handleInputChange(event) {
        const target = event.target;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        setValues((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    }

    async function createUser() {
        try {
            await api.createUser(
                values.login,
                values.email,
                values.additional_info,
                values.feed_quality,
                values.send_email
            );
            viewAlert.redirectToAlert({
                target: `/settings/user/${values.login}`,
                success: "User created successfully.",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div className="container">
            <h2>Create new user</h2>
            <form
                onSubmit={(ev) => {
                    ev.preventDefault();
                    createUser();
                }}
            >
                <div className="form-group">
                    <label>Login</label>
                    <input
                        type="text"
                        name="login"
                        value={values.login}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        pattern="[A-Za-z0-9_-]{1,32}"
                    />
                    <div className="form-hint">
                        Login must contain only letters, digits, '_' and '-'
                        characters, max 32 characters allowed.
                    </div>
                </div>
                <div className="form-group">
                    <label>E-mail</label>
                    <input
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                    <div className="form-hint">
                        Make sure that provided e-mail is active for
                        administration purposes
                    </div>
                </div>
                <div className="form-group">
                    <label>Additional info</label>
                    <input
                        type="text"
                        name="additional_info"
                        value={values.additional_info}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Feed quality</label>
                    <select
                        name="feed_quality"
                        value={values.feed_quality}
                        onChange={handleInputChange}
                        className="form-control"
                    >
                        <option value="high">high</option>
                        <option value="low">low</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Send e-mail with set password link</label>
                    <div className="material-switch">
                        <input
                            type="checkbox"
                            name="send_email"
                            id="send_email_checkbox"
                            checked={values.send_email}
                            onChange={handleInputChange}
                        />
                        <label
                            htmlFor="send_email_checkbox"
                            className="bg-success"
                        />
                    </div>
                </div>
                <input
                    type="submit"
                    value="Submit"
                    className="btn btn-primary"
                />
            </form>
        </div>
    );
}
