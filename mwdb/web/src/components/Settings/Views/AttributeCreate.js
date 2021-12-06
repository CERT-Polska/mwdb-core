import React, { useState } from "react";

import api from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/ui";

export default function AttributeCreate() {
    const viewAlert = useViewAlert();
    const [values, setValues] = useState({
        attributeKey: "",
        label: "",
        description: "",
        url_template: "",
        hidden: false,
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

    async function createAttribute() {
        try {
            await api.addAttributeDefinition(
                values.attributeKey,
                values.label,
                values.description,
                values["url_template"],
                values.hidden
            );
            viewAlert.redirectToAlert({
                target: `/settings/attribute/${values.attributeKey}`,
                success: "Attribute created successfully.",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div className="container">
            <h2>Create new attribute</h2>
            <form
                onSubmit={(ev) => {
                    ev.preventDefault();
                    createAttribute();
                }}
            >
                <div className="form-group">
                    <label>Key</label>
                    <input
                        type="text"
                        name="attributeKey"
                        value={values.attributeKey}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        pattern="[a-z0-9_-]{1,32}"
                    />
                    <div className="form-hint">
                        Key must contain only lowercase letters and digits, max
                        32 characters allowed.
                    </div>
                </div>
                <div className="form-group">
                    <label>Label</label>
                    <input
                        type="text"
                        name="label"
                        value={values.label}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                    <div className="form-hint">
                        User-friendly name for attribute (optional)
                    </div>
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <input
                        type="text"
                        name="description"
                        value={values.description}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                    <div className="form-hint">
                        Description of the attribute meaning (optional)
                    </div>
                </div>
                <div className="form-group">
                    <label>URL template</label>
                    <input
                        type="text"
                        name="url_template"
                        value={values["url_template"]}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                    <div className="form-hint">
                        Provide URL template for specified attribute with $value
                        as a placeholder (e.g. http://system.cert.pl/job/$value)
                    </div>
                </div>
                <div className="form-group">
                    <label>Hidden attribute</label>
                    <div className="material-switch">
                        <input
                            type="checkbox"
                            name="hidden"
                            onChange={handleInputChange}
                            id="hidden_checkbox"
                            checked={values.hidden}
                        />
                        <label
                            htmlFor="hidden_checkbox"
                            className="bg-primary"
                        />
                    </div>
                    <div className="form-hint">
                        Hidden attributes have protected values. Attribute
                        values are not visible for users without
                        reading_all_attributes capability and explicit request
                        for reading them. Also only exact search is allowed.
                        User still must have permission to read key to use it in
                        query.
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
