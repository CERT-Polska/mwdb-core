import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@mwdb-web/commons/api";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { toast } from "react-toastify";

export default function GroupJoin() {
    const token = new URLSearchParams(window.location.search).get("token");
    const [groupName, setGroupName] = useState("");
    const navigate = useNavigate();

    async function getInvitationDetails() {
        try {
            let response = await api.getInvitationData(token);
            setGroupName(response.data.name);
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
            navigate("/");
        }
    }
    async function acceptInvitation() {
        try {
            await api.acceptGroupInvitation(token);
            toast("You are now a member", {
                type: "success",
            });
            navigate("/");
        } catch (error) {
            console.log(error);
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }

    useEffect(() => {
        getInvitationDetails();
    }, []);

    return (
        <div style={{ textAlign: "center" }}>
            <div className="background" />
            <ConfirmationModal
                isOpen={true}
                message={`Do you want to accept the invitation to ${groupName} group?`}
                buttonStyle="btn-success"
                cancelText="No"
                onRequestClose={() => {
                    navigate("/");
                }}
                onConfirm={acceptInvitation}
            ></ConfirmationModal>
        </div>
    );
}
