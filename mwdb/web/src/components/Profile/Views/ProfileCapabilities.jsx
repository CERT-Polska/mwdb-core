import React, { useState, useCallback, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { find, isNil, isEmpty } from "lodash";

import { capabilitiesList } from "@mwdb-web/commons/auth";
import { GroupBadge, BootstrapSelect } from "@mwdb-web/commons/ui";

function CapabilitiesTable({ profile }) {
    const { setCapabilitiesToDelete } = useOutletContext();

    function isUserDeleteButtonRender(cap) {
        const userCap = find(profile.groups, { name: profile.login });
        if (isNil(userCap)) {
            return false;
        }
        return userCap.capabilities.includes(cap);
    }

    function isDeleteButtonRender(cap) {
        return !isNil(profile.login) ? isUserDeleteButtonRender(cap) : true;
    }

    if (!profile.capabilities) return [];
    return (
        <table className="table table-bordered wrap-table">
            <tbody>
                {profile.capabilities.sort().map((cap) => (
                    <tr key={cap}>
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
                                            .map((group, index) => (
                                                <GroupBadge
                                                    key={index}
                                                    group={group}
                                                    clickable
                                                />
                                            ))}
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

export default function ProfileCapabilities({ profile }) {
    // Component is reused by Settings
    const outletContext = useOutletContext();

    const isAccount = !isNil(profile.groups);
    const [chosenCapabilities, setChosenCapabilities] = useState([]);
    const [correctCapabilities, setCorrectCapabilities] = useState([]);
    if (profile === undefined) {
        profile = outletContext.profile;
    }

    const capabilities = Object.keys(capabilitiesList);
    const selectHandler = useCallback(
        (e, clickedIndex, isSelected) => {
            const selectedCaps = chosenCapabilities || [];
            if (isSelected)
                setChosenCapabilities(
                    selectedCaps.concat(capabilities[clickedIndex])
                );
            else
                setChosenCapabilities(
                    selectedCaps.filter(
                        (cap) => cap !== capabilities[clickedIndex]
                    )
                );
        },
        [chosenCapabilities, capabilities]
    );

    useEffect(() => {
        if (!isEmpty(profile)) {
            if (isAccount) {
                const foundGroup = find(profile.groups, {
                    name: profile.login,
                });
                if (!isNil(foundGroup)) {
                    const newCapabilities = foundGroup.capabilities;
                    setChosenCapabilities(newCapabilities);
                    setCorrectCapabilities(newCapabilities);
                }
            } else {
                const newCapabilities = profile.capabilities;
                setChosenCapabilities(newCapabilities);
                setCorrectCapabilities(newCapabilities);
            }
        }
    }, [profile]);

    return (
        <div className="container">
            <h2>Capabilities</h2>
            <p className="lead">
                Here is the list of {profile.groups ? "account" : "group"}{" "}
                superpowers:
            </p>
            <BootstrapSelect
                data-multiple-separator={""}
                data-live-search="true"
                noneSelectedText={"No capabilities selected"}
                className={"form-control"}
                multiple
                onChange={selectHandler}
            >
                {capabilities.map((cap) => {
                    const selectedCaps = chosenCapabilities || [];
                    const selected = selectedCaps.includes(cap);
                    const changed =
                        chosenCapabilities.includes(cap) !==
                        correctCapabilities.includes(cap);

                    return (
                        <option
                            key={cap}
                            data-content={`
                            ${changed ? "*" : ""}
                                <span class='badge badge-success'>${cap}</span>
                                <small class="text-muted">${cap}</small>
                            `}
                            value={cap}
                            selected={selected}
                        >
                            {cap}
                        </option>
                    );
                })}
            </BootstrapSelect>
            <CapabilitiesTable profile={profile} />
        </div>
    );
}
