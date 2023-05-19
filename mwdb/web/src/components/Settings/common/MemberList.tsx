import React, { useState } from "react";
import { Link } from "react-router-dom";
import { faTrash, faCrown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ConfirmationModal, UserBadge } from "@mwdb-web/commons/ui";
import { User } from "@mwdb-web/types/types";

type ModalSpec = {
    message?: string;
    action?: () => void;
    buttonStyle?: string;
    confirmText?: string;
};

type Props = {
    members: { login: string }[];
    admins: string[];
    setAdminMembership: (value: string, membership: boolean) => void;
    removeMember: (value: string) => void;
};

export function MemberList({
    members,
    admins,
    setAdminMembership,
    removeMember,
}: Props) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalSpec, setModalSpec] = useState<ModalSpec>({});

    function setAdmin(member: string, membership: boolean) {
        const message = `Are you sure to change admin group permissions for ${member}?`;

        setModalSpec({
            message,
            action: () => {
                setModalOpen(false);
                setAdminMembership(member, membership);
            },
            buttonStyle: "bg-success",
            confirmText: "Yes",
        });
        setModalOpen(true);
    }

    function removeMembership(member: string, isRemoveBlocked: boolean) {
        const message = `Remove ${member} from this group`;

        setModalSpec({
            message,
            action: () => {
                setModalOpen(false);
                removeMember(member);
            },
            confirmText: "Remove",
        });
        setModalOpen(true);
    }

    return (
        <React.Fragment>
            {members.map((member, index) => (
                <tr key={index}>
                    <th className="col">
                        <UserBadge
                            group={{}}
                            user={member}
                            clickable
                            basePath="/settings"
                        />
                        {admins.includes(member.login) ? (
                            <span
                                data-toggle="tooltip"
                                title="Group admin user"
                            >
                                <FontAwesomeIcon
                                    className="navbar-icon"
                                    icon={faCrown}
                                />
                            </span>
                        ) : (
                            []
                        )}
                    </th>
                    <td className="col-auto">
                        <Link
                            to="#"
                            data-toggle="tooltip"
                            title="Remove user from group"
                            onClick={(ev) => {
                                ev.preventDefault();
                                removeMembership(
                                    member.login,
                                    !admins.includes(member.login)
                                );
                            }}
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </Link>
                    </td>
                    <td className="col-auto">
                        <Link
                            to="#"
                            data-toggle="tooltip"
                            title="Give or revoke group admin permissions"
                            onClick={(ev) => {
                                ev.preventDefault();
                                setAdmin(
                                    member.login,
                                    !admins.includes(member.login)
                                );
                            }}
                        >
                            <FontAwesomeIcon icon={faCrown} />
                        </Link>
                    </td>
                </tr>
            ))}
            <ConfirmationModal
                isOpen={isModalOpen}
                onRequestClose={() => {
                    setModalOpen(false);
                    setModalSpec({});
                }}
                onConfirm={modalSpec.action}
                message={modalSpec.message}
                buttonStyle={modalSpec.buttonStyle}
                confirmText={modalSpec.confirmText}
            />
        </React.Fragment>
    );
}
