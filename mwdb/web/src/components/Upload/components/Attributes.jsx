import React, { useState } from "react";
import { DataTable } from "@mwdb-web/commons/ui";
import AttributesAddModal from "../../AttributesAddModal";

export function Attributes({ fields, append, remove }) {
    const [attributeModalOpen, setAttributeModalOpen] = useState(false);

    const onAttributeAdd = (key, value) => {
        for (let attr of fields)
            if (attr.key === key && attr.value === value) {
                // that key, value was added yet
                setAttributeModalOpen(false);
                return;
            }
        append({ key, value });
        setAttributeModalOpen(false);
    };

    return (
        <>
            <div className="d-flex align-items-center">
                <h5 className="mb-0 mr-3">Attributes</h5>
                <input
                    value="Add attribute"
                    className="btn btn-info"
                    type="button"
                    onClick={() => setAttributeModalOpen(true)}
                />
            </div>
            <DataTable>
                {fields.map((attr, idx) => (
                    <tr key={idx} className="centered">
                        <th>{attr.key}</th>
                        <td>
                            {typeof attr.value === "string" ? (
                                attr.value
                            ) : (
                                <pre className="attribute-object">
                                    {"(object)"}{" "}
                                    {JSON.stringify(attr.value, null, 4)}
                                </pre>
                            )}
                        </td>
                        <td>
                            <input
                                value="Dismiss"
                                className="btn btn-danger"
                                type="button"
                                onClick={() => remove(idx)}
                            />
                        </td>
                    </tr>
                ))}
            </DataTable>
            <AttributesAddModal
                isOpen={attributeModalOpen}
                onRequestClose={() => setAttributeModalOpen(false)}
                onAdd={onAttributeAdd}
            />
        </>
    );
}
