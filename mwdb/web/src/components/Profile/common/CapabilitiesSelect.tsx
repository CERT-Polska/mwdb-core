import { useState, useEffect } from "react";
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { find, isNil, isEmpty } from "lodash";
import { MultiValue } from "react-select";
import { api } from "@mwdb-web/commons/api";
import { capabilitiesList } from "@mwdb-web/commons/auth";
import { ConfirmationModal, Select } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { Capability, Group, User } from "@mwdb-web/types/types";

type SelectOptionsType = MultiValue<{
    label: string;
    value: Capability;
}>;

type Props = {
    profile: User | Group;
    getData: () => Promise<void>;
};

export function CapabilitiesSelect({ profile, getData }: Props) {
    const { setAlert } = useViewAlert();

    const [chosenCapabilities, setChosenCapabilities] = useState<Capability[]>(
        []
    );
    const [correctCapabilities, setCorrectCapabilities] = useState<
        Capability[]
    >([]);
    const [isOpen, setIsOpen] = useState(false);

    const isAccount = "groups" in profile;
    const group = isAccount ? profile.login : profile.name;
    const capabilities = Object.keys(capabilitiesList) as Capability[];
    const changedCaps = capabilities.filter(
        (cap: Capability) =>
            chosenCapabilities.includes(cap) !==
            correctCapabilities.includes(cap)
    );

    async function changeCapabilities() {
        try {
            await api.updateGroup(group!, { capabilities: chosenCapabilities });
            getData();
            setIsOpen(false);
            setAlert({
                success: `Capabilities for ${group} successfully changed`,
            });
        } catch (error) {
            setAlert({ error });
        }
    }

    function onSelectChange(newValue: SelectOptionsType) {
        setChosenCapabilities(newValue.map((x) => x.value));
    }

    function renderSelectLabel(cap: Capability) {
        const changed = changedCaps.includes(cap);
        return changed ? `* ${cap}` : cap;
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
                <Select
                    className={"col-lg-9"}
                    placeholder={"No capabilities selected"}
                    isMulti
                    options={capabilities.map((cap) => {
                        return {
                            value: cap,
                            label: renderSelectLabel(cap),
                        };
                    })}
                    value={chosenCapabilities.map((cap) => ({
                        value: cap,
                        label: renderSelectLabel(cap),
                    }))}
                    onChange={onSelectChange}
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                />
                <div className="col-lg-3 d-flex justify-content-between align-items-center">
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
