import { useState } from "react";

import { Autocomplete } from "@mwdb-web/commons/ui";

type Props = {
    groups: string[];
    onSubmit: (group: string) => void;
};

export function ShareForm(props: Props) {
    const [group, setGroup] = useState<string>("");
    const groups = props.groups
        .sort()
        .filter(
            (item) => item.toLowerCase().indexOf(group.toLowerCase()) !== -1
        );

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!group) return;
        props.onSubmit(group);
        setGroup("");
    }

    return (
        <form className="tagForm" onSubmit={handleSubmit}>
            <Autocomplete
                value={group}
                items={groups}
                onChange={(value) => setGroup(value)}
                className="form-control"
                placeholder="Share with group"
            >
                <div className="input-group-append">
                    <input
                        className="btn btn-outline-primary"
                        type="submit"
                        value="Add"
                    />
                </div>
            </Autocomplete>
        </form>
    );
}
