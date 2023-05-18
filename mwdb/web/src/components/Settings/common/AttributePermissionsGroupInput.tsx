import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Autocomplete } from "@mwdb-web/commons/ui";
import { Group, Permission } from "@mwdb-web/types/types";

type Props = {
    permissions: Record<string, Permission>;
    groups: Group[];
    groupName: string;
    setGroupName: (val: string) => void;
    addGroup: (val: string) => Promise<void>;
};

export function AttributePermissionsGroupInput({
    permissions,
    groups,
    addGroup,
    groupName,
    setGroupName,
}: Props) {
    return (
        <div className="card">
            <div className="card-body">
                <Autocomplete
                    value={groupName}
                    items={groups.filter(
                        (item) => !Object.keys(permissions).includes(item.name)
                    )}
                    getItemValue={(item) => item.name}
                    onChange={(value) => setGroupName(value)}
                    className="form-control"
                    placeholder="Group name"
                />
                <button
                    type="button"
                    className="btn btn-outline-success mt-2 mr-1"
                    onClick={() => groupName && addGroup(groupName)}
                    disabled={!groupName}
                    title={!groupName ? "Select group to add" : ""}
                >
                    <FontAwesomeIcon icon={faPlus} /> Add group
                </button>
            </div>
        </div>
    );
}
