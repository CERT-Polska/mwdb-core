import React, { useState } from "react";
import { isNil } from "lodash";

import { api } from "@mwdb-web/commons/api";
import { GroupBadge, ConfirmationModal } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { Group } from "@mwdb-web/types/types";

type Props = {
    updateWorkspace: () => Promise<void>;
    workspace: Group;
};

export function ProfileGroupItems({ workspace, updateWorkspace }: Props) {
    const { setAlert } = useViewAlert();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [removeUser, setRemoveUser] = useState<string | null>(null);

    async function handleRemoveMember(login: string | null) {
        if (isNil(login)) {
            return;
        }
        try {
            await api.removeGroupMember(workspace.name, login);
            updateWorkspace();
            setAlert({
                success: `Member '${login}' successfully removed.`,
            });
        } catch (error) {
            setAlert({ error });
        } finally {
            setDeleteModalOpen(false);
            setRemoveUser(null);
        }
    }

    return (
        <React.Fragment>
            {workspace.users
                .sort((userA: string, userB: string) =>
                    userA.localeCompare(userB)
                )
                .map((login: string, idx: number) => (
                    <tr className="nested d-flex" key={idx}>
                        <td className="col-8">
                            <GroupBadge
                                key={idx}
                                group={{
                                    name: login,
                                    private: true,
                                }}
                                clickable
                            />
                            {workspace.admins.includes(login) && " (admin)"}
                        </td>
                        <td className="col-4">
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                    setDeleteModalOpen(true);
                                    setRemoveUser(login);
                                }}
                            >
                                Remove
                            </button>
                        </td>
                    </tr>
                ))}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={() => {
                    handleRemoveMember(removeUser);
                }}
                message={`Are you sure to delete ${removeUser} user from group?`}
            />
        </React.Fragment>
    );
}
