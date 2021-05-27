import React, { useState } from "react";

import api from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/ui";

export default function GroupCreate() {
    const viewAlert = useViewAlert();

    const [values, setValues] = useState({
        name: "",
    });

    function handleInputChange(event) {
        const target = event.target;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        setValues((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    }

    async function createGroup() {
        try {
            await api.registerGroup(values.name);
            viewAlert.redirectToAlert({
                target: `/settings/group/${values.name}`,
                success: "Group created successfully.",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div className="container">
            <h2>Create new group</h2>
            <form
                onSubmit={(ev) => {
                    ev.preventDefault();
                    createGroup();
                }}
            >
                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        name="name"
                        value={values.name}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        pattern="[A-Za-z0-9_-]{1,32}"
                    />
                    <div className="form-hint">
                        Group name must contain only letters, digits, '_' and
                        '-' characters , max 32 characters allowed.
                    </div>
                </div>
                <input
                    type="submit"
                    value="Submit"
                    className="btn btn-primary"
                />
            </form>
        </div>
    );
}
