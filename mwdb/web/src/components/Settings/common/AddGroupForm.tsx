import { useState } from "react";
import { Autocomplete, ConfirmationModal } from "@mwdb-web/commons/ui";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Group } from "@mwdb-web/types/types";

type Props = {
    newGroupsItems: Group[];
    addGroup: (group: string) => void;
};

export function AddGroupForm({ newGroupsItems, addGroup }: Props) {
    const [newGroup, setNewGroup] = useState("");
    const [isModalOpen, setModalOpen] = useState(false);

    return (
        <div className="card">
            <div className="card-body">
                <Autocomplete
                    value={newGroup}
                    getItemValue={(group) => group.name}
                    items={newGroupsItems.filter(
                        (group) =>
                            group.name
                                .toLowerCase()
                                .indexOf(newGroup.toLowerCase()) !== -1
                    )}
                    onChange={(value) => setNewGroup(value)}
                    className="form-control"
                    placeholder="Group name"
                />
                <button
                    className="btn btn-outline-success mt-2 mr-1"
                    disabled={newGroup.length === 0}
                    onClick={() => {
                        setModalOpen(true);
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} /> Add group
                </button>
                <ConfirmationModal
                    isOpen={isModalOpen}
                    onRequestClose={() => {
                        setModalOpen(false);
                    }}
                    onConfirm={() => {
                        addGroup(newGroup);
                        setNewGroup("");
                        setModalOpen(false);
                    }}
                    message={`Are you sure you want to add current user to ${newGroup} group?`}
                    buttonStyle="btn-success"
                    confirmText="Add"
                />
            </div>
        </div>
    );
}
