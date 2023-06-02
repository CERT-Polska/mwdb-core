import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import { api } from "@mwdb-web/commons/api";
import { ShowIf } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { ProfileOutletContext } from "@mwdb-web/types/context";

export function ProfileResetPassword() {
    const { profile }: ProfileOutletContext = useOutletContext();
    const viewAlert = useViewAlert();
    const [pending, setPending] = useState<boolean>(false);

    async function resetPassword() {
        setPending(true);
        try {
            await api.authRequestPasswordChange();
            viewAlert.redirectToAlert({
                target: "/profile",
                success:
                    "Password reset link was successfully sent to your e-mail address.",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
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
                    <>
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
                        <Link to="/profile" className="card-link">
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                            >
                                Cancel
                            </button>
                        </Link>
                    </>
                </ShowIf>
            </div>
        </div>
    );
}
