import { useState } from "react";

import { ConfirmationModal, GroupBadge } from "@mwdb-web/commons/ui";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { Group } from "@mwdb-web/types/types";

type Props = {
    groups: Group[];
    removeMember: (member: string) => void;
};

export function GroupsList({ groups, removeMember }: Props) {
    const [isModalOpen, setModalOpen] = useState<boolean>(false);
    const [removeGroup, setRemoveGroup] = useState<string>("");

    return (
        <>
            {groups.map((group) => (
                <tr key={group.name}>
                    <th className="col">
                        <GroupBadge
                            group={group}
                            clickable
                            basePath="/settings"
                        />
                    </th>
                    <td className="col-auto">
                        <Link
                            to="#"
                            data-toggle="tooltip"
                            title="Remove user from group"
                            onClick={(ev) => {
                                ev.preventDefault();
                                setModalOpen(true);
                                setRemoveGroup(group.name);
                            }}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </Link>
                    </td>
                </tr>
            ))}
            <ConfirmationModal
                isOpen={isModalOpen}
                onRequestClose={() => {
                    setModalOpen(false);
                    setRemoveGroup("");
                }}
                onConfirm={() => {
                    removeMember(removeGroup);
                    setModalOpen(false);
                }}
                message={`Are you sure you want to remove user from ${removeGroup} group?`}
                confirmText="Remove"
            />
        </>
    );
}
