import { useContext } from "react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { find, isNil } from "lodash";
import { capabilitiesList, AuthContext } from "@mwdb-web/commons/auth";
import { GroupBadge } from "@mwdb-web/commons/ui";
import { useCheckCapabilities } from "@mwdb-web/commons/hooks";
import { Capability, Group, User } from "@mwdb-web/types/types";
import { ProfileOutletContext } from "@mwdb-web/types/context";

type Props = {
    profile: User;
};

export function CapabilitiesTable({ profile }: Props) {
    const { user } = useContext(AuthContext);
    const { userHasCapabilities } = useCheckCapabilities();
    const { setCapabilitiesToDelete }: ProfileOutletContext =
        useOutletContext();

    function isUserDeleteButtonRender(cap: Capability) {
        const userCap = find(profile.groups, {
            name: profile.login,
        });
        if (isNil(userCap)) {
            return false;
        }
        return userCap.capabilities.includes(cap);
    }

    function isDeleteButtonRender(cap: Capability) {
        const userOrGroupName = profile.name || profile.login;
        const isManageUsersCapability = cap === Capability.manageUsers;
        if (isManageUsersCapability && userOrGroupName === user.login) {
            return false;
        }
        return !isNil(profile.login) ? isUserDeleteButtonRender(cap) : true;
    }

    if (!profile.capabilities) return <></>;
    return (
        <table className="table table-bordered wrap-table">
            <tbody>
                {profile.capabilities.sort().map((cap) => (
                    <tr key={cap}>
                        {userHasCapabilities(Capability.manageUsers) && (
                            <td className="col-auto">
                                {isDeleteButtonRender(cap) && (
                                    <Link
                                        to={"#"}
                                        onClick={(ev) => {
                                            ev.preventDefault();
                                            setCapabilitiesToDelete(cap);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </Link>
                                )}
                            </td>
                        )}
                        <td>
                            <span className="badge badge-success">{cap}</span>
                        </td>
                        <td>
                            <div>
                                {capabilitiesList[cap] || "(no description)"}
                            </div>
                            <div>
                                {profile.groups && (
                                    <span>
                                        <small className="text-muted">
                                            Got from:
                                        </small>
                                        {profile.groups
                                            .filter((group) =>
                                                group.capabilities.includes(cap)
                                            )
                                            .map(
                                                (
                                                    group: Group,
                                                    index: number
                                                ) => (
                                                    <GroupBadge
                                                        key={index}
                                                        group={group}
                                                        clickable
                                                    />
                                                )
                                            )}
                                    </span>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
