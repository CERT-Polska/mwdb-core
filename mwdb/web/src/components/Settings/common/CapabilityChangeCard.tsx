import { useState, useEffect } from "react";

import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MultiValue } from "react-select";

import { capabilitiesList } from "@mwdb-web/commons/auth";
import { Autocomplete, GroupBadge, Select } from "@mwdb-web/commons/ui";
import { Capability, Group } from "@mwdb-web/types/types";

type SelectOptionsType = MultiValue<{
    label: string;
    value: Capability;
}>;

type Props = {
    groups: Group[];
    onSubmit: (groupName: string, chosenCapabilities: Capability[]) => void;
};

export function CapabilityChangeCard({ groups, onSubmit }: Props) {
    const [groupName, setGroupName] = useState<string>("");
    const [chosenGroup, setChosenGroup] = useState<Group>({} as Group);
    const [chosenCapabilities, setChosenCapabilities] = useState<Capability[]>(
        []
    );

    const capabilities = Object.keys(capabilitiesList) as Capability[];
    const originalCaps = chosenGroup.capabilities || [];
    const changedCaps = capabilities.filter(
        (cap: Capability) =>
            chosenCapabilities.includes(cap) !== originalCaps.includes(cap)
    );

    function onSelectChange(newValue: SelectOptionsType) {
        setChosenCapabilities(newValue.map((x) => x.value));
    }
    function dismissChanges() {
        setChosenCapabilities(chosenGroup.capabilities);
    }

    function renderSelectLabel(cap: Capability) {
        const changed = changedCaps.includes(cap);
        return changed ? `* ${cap}` : cap;
    }

    useEffect(() => {
        const matchedGroup =
            groups.find((group) => group.name === groupName) || ({} as Group);
        setChosenGroup(matchedGroup);
        setChosenCapabilities(matchedGroup.capabilities || []);
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
                    onChange={setGroupName}
                    className="form-control"
                    placeholder="Group name"
                    renderItem={({ item }) => <GroupBadge group={item} />}
                />
                <Select
                    isMulti
                    placeholder={
                        !groupName
                            ? "Provide group name first"
                            : "No additional capabilities enabled"
                    }
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
                    isDisabled={!groupName}
                />
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
