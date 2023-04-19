import React, { useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { isEmpty } from "lodash";
import AceEditor from "react-ace";

import AttributesAddModal from "../AttributesAddModal";

import { api } from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { DataTable, View, getErrorMessage } from "@mwdb-web/commons/ui";
import { Extendable } from "@mwdb-web/commons/plugins";
import { useJsonParseError } from "@mwdb-web/commons/hooks";

export default function UploadConfig() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const searchParams = useSearchParams()[0];
    const [cfg, setCfg] = useState("{}");

    const [parent, setParent] = useState("");
    const [family, setFamily] = useState("");
    const [attributes, setAttributes] = useState([]);
    const [attributeModalOpen, setAttributeModalOpen] = useState(false);
    const { errorMessage: cfgErrorMessage } = useJsonParseError(cfg);

    const handleParentChange = (ev) => {
        ev.preventDefault();
        setParent(ev.target.value);
    };

    const handleParentClear = () => {
        if (searchParams.get("parent")) navigate("/upload");
        setParent("");
    };

    const handleSubmit = async () => {
        try {
            const body = {
                cfg: JSON.parse(cfg),
                family,
                parent: !isEmpty(parent) ? parent : undefined,
                attributes,
            };
            console.log(body);
            let response = await api.uploadConfig(body);
            navigate("/config/" + response.data.id, {
                replace: true,
            });
            toast("File uploaded successfully.", {
                type: "success",
            });
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    };

    const onAttributeAdd = (key, value) => {
        for (let attr of attributes)
            if (attr.key === key && attr.value === value) {
                // that key, value was added yet
                setAttributeModalOpen(false);
                return;
            }
        setAttributes([...attributes, { key, value }]);
        setAttributeModalOpen(false);
    };

    const onAttributeRemove = (idx) => {
        setAttributes([
            ...attributes.slice(0, idx),
            ...attributes.slice(idx + 1),
        ]);
    };

    return (
        <View ident="configUpload">
            <Extendable ident="configUploadForm">
                <form>
                    <div className="form-group">
                        <AceEditor
                            mode="json"
                            theme="github"
                            wrapEnabled
                            onChange={(input) => setCfg(input)}
                            value={cfg}
                            width="500px"
                            height="150px"
                            setOptions={{
                                useWorker: false,
                            }}
                        />
                        <div className="input-group mb-3 mt-3">
                            <div className="input-group-prepend">
                                <label className="input-group-text">
                                    Family
                                </label>
                            </div>
                            <input
                                className="form-control"
                                type="text"
                                style={{ fontSize: "medium" }}
                                placeholder="Family"
                                value={family}
                                onChange={(e) => setFamily(e.target.value)}
                            />
                            <div className="input-group-append">
                                <input
                                    className="btn btn-outline-danger"
                                    type="button"
                                    value="Clear"
                                    onClick={() => setFamily("")}
                                />
                            </div>
                        </div>
                        {auth.hasCapability(Capability.addingParents) && (
                            <div className="input-group mb-3">
                                <div className="input-group-prepend">
                                    <label className="input-group-text">
                                        Parent
                                    </label>
                                </div>
                                <input
                                    className="form-control"
                                    type="text"
                                    style={{ fontSize: "medium" }}
                                    placeholder="(Optional) Type parent identifier..."
                                    value={searchParams.get("parent") || parent}
                                    onChange={handleParentChange}
                                    disabled={searchParams.get("parent")}
                                />
                                <div className="input-group-append">
                                    <input
                                        className="btn btn-outline-danger"
                                        type="button"
                                        value="Clear"
                                        onClick={handleParentClear}
                                    />
                                </div>
                            </div>
                        )}
                        {attributes.length > 0 && (
                            <div>
                                <h5>Attributes</h5>
                                <DataTable>
                                    {attributes.map((attr, idx) => (
                                        <tr key={idx} className="centered">
                                            <th>{attr.key}</th>
                                            <td>
                                                {typeof attr.value ===
                                                "string" ? (
                                                    attr.value
                                                ) : (
                                                    <pre className="attribute-object">
                                                        {"(object)"}{" "}
                                                        {JSON.stringify(
                                                            attr.value,
                                                            null,
                                                            4
                                                        )}
                                                    </pre>
                                                )}
                                            </td>
                                            <td>
                                                <input
                                                    value="Dismiss"
                                                    className="btn btn-danger"
                                                    type="button"
                                                    onClick={() =>
                                                        onAttributeRemove(idx)
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </DataTable>
                            </div>
                        )}
                        <div id="test">{cfgErrorMessage}</div>
                        <input
                            value="Upload Config"
                            className="btn btn-success"
                            type="button"
                            onClick={handleSubmit}
                        />
                        <input
                            value="Add attribute"
                            className="btn btn-success"
                            type="button"
                            onClick={() => setAttributeModalOpen(true)}
                        />
                    </div>
                </form>
            </Extendable>
            <AttributesAddModal
                isOpen={attributeModalOpen}
                onRequestClose={() => setAttributeModalOpen(false)}
                onAdd={onAttributeAdd}
            />
        </View>
    );
}
