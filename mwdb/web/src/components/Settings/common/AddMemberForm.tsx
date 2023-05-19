import { useState } from "react";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Autocomplete } from "@mwdb-web/commons/ui";
import { User } from "@mwdb-web/types/types";

type Props = {
    newMemberItems: User[];
    addMember: (newMember: string) => void;
};

export function AddMemberForm({ newMemberItems, addMember }: Props) {
    const [newMember, setNewMember] = useState<string>("");

    return (
        <div className="card">
            <div className="card-body">
                <Autocomplete
                    value={newMember}
                    getItemValue={(user) => user.login}
                    items={newMemberItems.filter(
                        (user) =>
                            user.login
                                .toLowerCase()
                                .indexOf(newMember.toLowerCase()) !== -1
                    )}
                    onChange={(value) => setNewMember(value)}
                    className="form-control"
                    placeholder="User login"
                />
                <button
                    className="btn btn-outline-success mt-2 mr-1"
                    disabled={newMember.length === 0}
                    onClick={() => {
                        addMember(newMember);
                        setNewMember("");
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} /> Add member
                </button>
            </div>
        </div>
    );
}
