import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { ShowIf, getErrorMessage } from "@mwdb-web/commons/ui";

export default function ProfileResetPassword({ profile }) {
    const [pending, setPending] = useState(false);
    const history = useHistory();

    async function resetPassword() {
        setPending(true);
        try {
            await api.authRequestPasswordChange();
            history.push({
                pathname: "/settings/profile",
                state: {
                    success:
                        "Password reset link was successfully sent to your e-mail address.",
                },
            });
        } catch (error) {
            history.push({
                pathname: "/settings/profile",
                state: {
                    error: getErrorMessage(error),
                },
            });
        }
    }

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Do you want to reset password?</h5>
                <p className="card-text">
                    Password reset link will be sent to your e-mail address (
                    <strong>{profile.email}</strong>).
                </p>
                <p className="card-text">Continue?</p>
                <ShowIf condition={!pending}>
                    <button
                        type="button"
                        className="btn btn-outline-success card-link"
                        onClick={(ev) => {
                            ev.preventDefault();
                            resetPassword();
                        }}
                    >
                        Send password reset link
                    </button>
                    <Link to="/settings/profile" className="card-link">
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                        >
                            Cancel
                        </button>
                    </Link>
                </ShowIf>
            </div>
        </div>
    );
}
