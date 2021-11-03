import React, { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { ShowIf, useViewAlert } from "@mwdb-web/commons/ui";

export default function UserResetPassword({ user }) {
    const viewAlert = useViewAlert();
    const [pending, setPending] = useState(false);
    const [passwordURL, setPasswordURL] = useState("");
    async function resetPassword() {
        setPending(true);
        try {
            await api.userRequestPasswordChange(user.login);
            viewAlert.redirectToAlert({
                target: `/settings/user/${user.login}`,
                success: `Password reset link was successfully sent to '${user.email}'.`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function generatePasswordResetLink() {
        try {
            let getURLFromToken = (token) =>
                encodeURI(`${window.location.origin}/setpasswd/${token}`);
            let response = await api.generateSetPasswordToken(user.login);
            setPasswordURL(getURLFromToken(response.data.token));
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div>
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">
                        Do you want to reset password?
                    </h5>
                    <p className="card-text">
                        Password reset link will be sent to e-mail address (
                        <strong>{user.email}</strong>).
                    </p>

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
                        <Link
                            to={`/settings/user/${user.login}`}
                            className="card-link"
                        >
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
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">
                        Alternatively you can generate reset password link
                    </h5>
                    <button
                        onClick={(ev) => {
                            ev.preventDefault();
                            generatePasswordResetLink();
                        }}
                        type="button"
                        className="btn btn-outline-primary card-link"
                    >
                        Generate
                    </button>
                    <ShowIf condition={passwordURL}>
                        <div className="card card-body border-primary">
                            <div
                                className="text-monospace"
                                style={{ margin: "8pt 0" }}
                            >
                                {passwordURL}
                            </div>
                            <CopyToClipboard text={passwordURL}>
                                <a
                                    href="#copy-token"
                                    className="card-link"
                                    onClick={(ev) => ev.preventDefault()}
                                >
                                    <FontAwesomeIcon icon="copy" /> Copy to
                                    clipboard
                                </a>
                            </CopyToClipboard>
                        </div>
                    </ShowIf>
                </div>
            </div>
        </div>
    );
}
