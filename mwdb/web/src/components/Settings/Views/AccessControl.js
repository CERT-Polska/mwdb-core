import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";

import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { capabilitiesList } from "@mwdb-web/commons/auth";
import { intersperse } from "@mwdb-web/commons/helpers";
import {
    Autocomplete,
    BootstrapSelect,
    ConfirmationModal,
    GroupBadge,
    ShowIf,
    useViewAlert,
} from "@mwdb-web/commons/ui";

function GroupAppliesTo({ group }) {
    if (group["name"] === "public")
        return (
            <small className="text-muted">
                Applies to all users in MWDB system
            </small>
        );
    return (
        <div>
            <small className="text-muted">
                Applies to{" "}
                {intersperse(
                    group["users"]
                        .slice(0, 3)
                        .map((user) => (
                            <Link to={`/settings/user/${user}`}>{user}</Link>
                        )),
                    ", "
                )}
                {group["users"].length > 3
                    ? ` and ${group["users"].length - 3}  more...`
                    : []}
            </small>
        </div>
    );
}

function CapabilitiesHeader({ group }) {
    return (
        <tr className="bg-light">
            <th colSpan="3" className="col">
                <GroupBadge group={group} />
                <ShowIf condition={!group["private"]}>
                    <GroupAppliesTo group={group} />
                </ShowIf>
            </th>
        </tr>
    );
}

function CapabilitiesList({ capabilities, onDelete }) {
    return capabilities.map((cap) => (
        <tr>
            <td className="col-auto">
                <Link
                    onClick={(ev) => {
                        ev.preventDefault();
                        onDelete(cap);
                    }}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </Link>
            </td>
            <th className="col-1">
                <span className="badge badge-success">{cap}</span>
            </th>
            <td className="col">
                {capabilitiesList[cap] ||
                    "Undocumented. Possibly internal and required by plugin."}
            </td>
        </tr>
    ));
}

function CapabilityChangeCard({ groups, onSubmit }) {
    const [groupName, setGroupName] = useState("");
    const [chosenGroup, setChosenGroup] = useState({});
    const [chosenCapabilities, setChosenCapabilities] = useState();

    const capabilities = Object.keys(capabilitiesList);
    const originalCaps = chosenGroup.capabilities || [];
    const changedCaps = capabilities.filter(
        (cap) =>
            (chosenCapabilities || []).includes(cap) !==
            originalCaps.includes(cap)
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

    function dismissChanges() {
        setChosenCapabilities(chosenGroup.capabilities);
    }

    useEffect(() => {
        const matchedGroup =
            groups.find((group) => group.name === groupName) || {};
        setChosenGroup(matchedGroup);
        setChosenCapabilities(matchedGroup.capabilities);
    }, [groups, groupName]);

    return (
        <div className="card">
            <div className="card-body">
                <Autocomplete
                    value={groupName}
                    getItemValue={(group) => group.name}
                    items={groups.filter(
                        (group) =>
                            group.name
                                .toLowerCase()
                                .indexOf(groupName.toLowerCase()) !== -1
                    )}
                    onChange={(value) => setGroupName(value)}
                    className="form-control"
                    placeholder="Group name"
                    renderItem={({ item }) => <GroupBadge group={item} />}
                />
                <BootstrapSelect
                    data-multiple-separator={""}
                    data-live-search="true"
                    noneSelectedText={
                        chosenCapabilities === undefined
                            ? "Provide group name first"
                            : "No additional capabilities enabled"
                    }
                    className={"form-control"}
                    multiple
                    disabled={chosenCapabilities === undefined}
                    onChange={selectHandler}
                >
                    {capabilities.map((cap) => {
                        const selectedCaps = chosenCapabilities || [];
                        const changed = changedCaps.includes(cap);
                        const selected = selectedCaps.includes(cap);
                        return (
                            <option
                                data-content={`
                                ${changed ? "*" : ""}
                                <span class='badge badge-success'>${cap}</span>
                                <small class="text-muted">${
                                    capabilitiesList[cap]
                                }</small>
                            `}
                                selected={selected}
                            >
                                {cap}
                            </option>
                        );
                    })}
                </BootstrapSelect>
                {changedCaps.length > 0 && (
                    <div>
                        <small>
                            * There are pending changes. Click Apply if you want
                            to commit them or Dismiss otherwise.
                        </small>
                    </div>
                )}
                <button
                    className="btn btn-outline-success mt-2 mr-1"
                    disabled={changedCaps.length === 0}
                    onClick={() => onSubmit(groupName, chosenCapabilities)}
                >
                    <FontAwesomeIcon icon={faSave} /> Apply
                </button>
                <button
                    className="btn btn-outline-danger mt-2"
                    disabled={changedCaps.length === 0}
                    onClick={() => dismissChanges()}
                >
                    <FontAwesomeIcon icon={faTimes} /> Dismiss
                </button>
            </div>
        </div>
    );
}

export default function AccessControl() {
    const [groups, setGroups] = useState(null);
    const { setAlert } = useViewAlert();

    const [isChangeModalOpen, setChangeModalOpen] = useState(false);
    const [disabledModalButton, setDisabledModalButton] = useState(false);
    const [changeToApply, setChangeToApply] = useState({});

    async function updateGroups() {
        try {
            const response = await api.getGroups();
            const groupList = response.data["groups"].sort(
                (a, b) =>
                    (b["name"] === "public") - (a["name"] === "public") ||
                    a["private"] - b["private"] ||
                    a["name"].localeCompare(b["name"])
            );
            setGroups(groupList);
        } catch (error) {
            setAlert({ error });
        }
    }

    async function changeCapabilities({ group, capabilities }) {
        try {
            setDisabledModalButton(true);
            await api.updateGroup(group, { capabilities });
            await updateGroups();
            setAlert({
                success: `Group '${group}' capabilities successfully changed`,
            });
        } catch (error) {
            setAlert({ error });
        } finally {
            setDisabledModalButton(false);
            setChangeModalOpen(false);
        }
    }

    const getGroups = useCallback(updateGroups, [setAlert]);

    useEffect(() => {
        getGroups();
    }, [getGroups]);

    if (!groups) return [];

    return (
        <div className="container">
            <h2>Access control</h2>
            <p className="lead">
                Use a form below to enable/disable capabilities for specific
                user or group.
            </p>
            <CapabilityChangeCard
                groups={groups}
                onSubmit={(group, capabilities) => {
                    setChangeToApply({ group, capabilities });
                    setChangeModalOpen(true);
                }}
            />
            <table className="table table-bordered wrap-table">
                <tbody>
                    {groups
                        .filter((group) => group.capabilities.length > 0)
                        .map((group) => [
                            <CapabilitiesHeader group={group} />,
                            <CapabilitiesList
                                capabilities={group.capabilities}
                                onDelete={(capToRemove) => {
                                    setChangeToApply({
                                        group: group.name,
                                        capabilities: group.capabilities.filter(
                                            (cap) => cap !== capToRemove
                                        ),
                                    });
                                    setChangeModalOpen(true);
                                }}
                            />,
                        ])}
                </tbody>
            </table>
            <ConfirmationModal
                buttonStyle="badge-success"
                confirmText="Yes"
                message={`Are you sure you want to change '${changeToApply.group}' capabilities?`}
                isOpen={isChangeModalOpen}
                disabled={disabledModalButton}
                onRequestClose={() => setChangeModalOpen(false)}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    changeCapabilities(changeToApply);
                }}
            />
        </div>
    );
}
