import React, { useState, useCallback, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { find, isNil, isEmpty } from "lodash";
import { api } from "@mwdb-web/commons/api";
import { capabilitiesList, Capability } from "@mwdb-web/commons/auth";
import {
    GroupBadge,
    BootstrapSelect,
    ConfirmationModal,
    useViewAlert,
} from "@mwdb-web/commons/ui";
import { useCheckCapabilities } from "@mwdb-web/commons/hooks";

function CapabilitiesTable({ profile }) {
    const { userHasCapabilities } = useCheckCapabilities();
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

function CapabilitiesSelect({ profile, getData }) {
    const { setAlert } = useViewAlert();

    const [chosenCapabilities, setChosenCapabilities] = useState([]);
    const [correctCapabilities, setCorrectCapabilities] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const isAccount = !isNil(profile.groups);
    const group = isAccount ? profile.login : profile.name;
    const capabilities = Object.keys(capabilitiesList);
    const changedCaps = capabilities.filter(
        (cap) =>
            chosenCapabilities.includes(cap) !==
            correctCapabilities.includes(cap)
    );

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

    async function changeCapabilities() {
        try {
            await api.updateGroup(group, { capabilities: chosenCapabilities });
            getData();
            setIsOpen(false);
            setAlert({
                success: `Capabilities for ${group} successfully changed`,
            });
        } catch (error) {
            setAlert({ error });
        }
    }

    function dismissChanges() {
        setChosenCapabilities(correctCapabilities);
    }

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
        <div className="mb-3">
            <div className="row">
                <BootstrapSelect
                    data-multiple-separator={""}
                    data-live-search="true"
                    noneSelectedText={"No capabilities selected"}
                    className={"col-lg-9"}
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
                <div
                    className="col-lg-3 justify-content-between"
                    style={{ display: "flex" }}
                >
                    <button
                        className="btn btn-outline-success"
                        disabled={changedCaps.length === 0}
                        onClick={() => setIsOpen(true)}
                    >
                        <FontAwesomeIcon icon={faSave} /> Apply
                    </button>
                    <button
                        className="btn btn-outline-danger"
                        disabled={changedCaps.length === 0}
                        onClick={() => dismissChanges()}
                    >
                        <FontAwesomeIcon icon={faTimes} /> Dismiss
                    </button>
                </div>
            </div>
            {changedCaps.length > 0 && (
                <div>
                    <small>
                        * There are pending changes. Click Apply if you want to
                        commit them or Dismiss otherwise.
                    </small>
                </div>
            )}
            <ConfirmationModal
                buttonStyle="badge-success"
                confirmText="Yes"
                message={`Are you sure you want to change '${group}' capabilities?`}
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                onConfirm={changeCapabilities}
            />
        </div>
    );
}

export default function ProfileCapabilities({ profile, getData }) {
    // Component is reused by Settings
    const outletContext = useOutletContext();
    const { userHasCapabilities } = useCheckCapabilities();

    if (profile === undefined) {
        profile = outletContext.profile;
    }

    return (
        <div className="container">
            <h2>Capabilities</h2>
            <p className="lead">
                Here is the list of {profile.groups ? "account" : "group"}{" "}
                superpowers:
            </p>
            {userHasCapabilities(Capability.manageUsers) && (
                <CapabilitiesSelect profile={profile} getData={getData} />
            )}
            <CapabilitiesTable profile={profile} />
        </div>
    );
}
