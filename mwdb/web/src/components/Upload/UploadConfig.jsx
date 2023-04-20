import React, { useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { isEmpty } from "lodash";
import AceEditor from "react-ace";

import AttributesAddModal from "../AttributesAddModal";

import { api } from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import {
    DataTable,
    View,
    getErrorMessage,
    FormError,
} from "@mwdb-web/commons/ui";
import { Extendable } from "@mwdb-web/commons/plugins";
import { useJsonParseError } from "@mwdb-web/commons/hooks";

export default function UploadConfig() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const searchParams = useSearchParams()[0];
    const [cfg, setCfg] = useState("{}");

    const [parent, setParent] = useState("");
    const [family, setFamily] = useState("");
    const [configType, setConfigType] = useState("static");
    const [attributes, setAttributes] = useState([]);
    const [attributeModalOpen, setAttributeModalOpen] = useState(false);
    const { errorMessage: cfgErrorMessage } = useJsonParseError(cfg);

    const handleParentChange = (ev) => {
        ev.preventDefault();
        setParent(ev.target.value);
    };

    const handleParentClear = () => {
        if (searchParams.get("parent")) navigate("/config_upload");
        setParent("");
    };

    const handleSubmit = async () => {
        try {
            const body = {
                cfg: JSON.parse(cfg),
                family,
                parent: !isEmpty(parent) ? parent : undefined,
                config_type: configType,
                attributes,
            };
            let response = await api.uploadConfig(body);
            navigate("/config/" + response.data.id, {
                replace: true,
            });
            toast("Config uploaded successfully.", {
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
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <label
                                    htmlFor="config"
                                    className="input-group-text"
                                >
                                    Config
                                </label>
                                <AceEditor
                                    id="config"
                                    mode="json"
                                    theme="github"
                                    wrapEnabled
                                    onChange={(input) => setCfg(input)}
                                    value={cfg}
                                    height="260px"
                                    setOptions={{
                                        useWorker: false,
                                    }}
                                />
                            </div>
                        </div>

                        <FormError errorField={{ message: cfgErrorMessage }} />
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <label
                                    htmlFor="config_type"
                                    className="input-group-text"
                                >
                                    Config type
                                </label>
                            </div>
                            <select
                                id="config_type"
                                className="custom-select"
                                value={configType}
                                onChange={(e) => setConfigType(e.target.value)}
                            >
                                <option value="static">Static</option>
                                <option value="dynamic">Dynamic</option>
                            </select>
                        </div>
                        <div className="input-group mb-3 mt-3">
                            <div className="input-group-prepend">
                                <label
                                    htmlFor="family"
                                    className="input-group-text"
                                >
                                    Family
                                </label>
                            </div>
                            <input
                                id="family"
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
                                    <label
                                        htmlFor="parent"
                                        className="input-group-text"
                                    >
                                        Parent
                                    </label>
                                </div>
                                <input
                                    id="parent"
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
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <input
                                value="Add attribute"
                                className="btn btn-info"
                                type="button"
                                onClick={() => setAttributeModalOpen(true)}
                            />
                            <input
                                value="Upload config"
                                className="btn btn-success"
                                type="button"
                                //TODO: uncommnent before review
                                // disabled={cfgErrorMessage || cfg === "{}"}
                                onClick={handleSubmit}
                            />
                        </div>
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
