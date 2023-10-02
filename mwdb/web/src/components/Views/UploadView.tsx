import { useCallback, useContext, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { AttributesAddModal } from "../AttributesAddModal";

import { api } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { Autocomplete, DataTable, ShowIf, View } from "@mwdb-web/commons/ui";
import { ConfigContext } from "@mwdb-web/commons/config";
import { Extendable } from "@mwdb-web/commons/plugins";
import { UploadDropzone } from "../UploadDropzone";
import { Attribute } from "@mwdb-web/types/types";
import { isEmpty } from "lodash";
import { Capability } from "@mwdb-web/types/types";

export function UploadView() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const fileUploadTimeout = config.config["file_upload_timeout"];
    const navigate = useNavigate();
    const searchParams = useSearchParams()[0];

    const [file, setFile] = useState<File | null>(null);
    const [shareWith, setShareWith] = useState<string>("default");
    const [group, setGroup] = useState<string>("");
    const [groups, setGroups] = useState<string[]>([]);
    const [parent, setParent] = useState<string>("");
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [attributeModalOpen, setAttributeModalOpen] =
        useState<boolean>(false);
    const [share3rdParty, setShare3rdParty] = useState<boolean>(true);

    const handleParentChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        ev.preventDefault();
        setParent(ev.target.value);
    };

    const handleParentClear = () => {
        if (searchParams.get("parent")) navigate("/upload");
        setParent("");
    };

    const updateSharingMode = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        setShareWith(ev.target.value);
        setGroup("");
    };

    const sharingModeToUploadParam = () => {
        if (shareWith === "default") return "*";
        else if (shareWith === "public") return "public";
        else if (shareWith === "private") return "private";
        else if (shareWith === "single") return group;
    };

    const getSharingModeHint = () => {
        if (shareWith === "default")
            return `The sample and all related artifacts will be shared with all your workgroups`;
        else if (shareWith === "public")
            return `The sample will be added to the public feed, so everyone will see it.`;
        else if (shareWith === "private")
            return `The sample will be accessible only from your account.`;
        else if (shareWith === "single")
            return `The sample will be accessible only for you and chosen group.`;
    };

    const handleSubmit = async () => {
        try {
            let response = await api.uploadFile(
                file!,
                searchParams.get("parent") || parent,
                sharingModeToUploadParam()!,
                attributes,
                fileUploadTimeout!,
                share3rdParty
            );
            navigate("/file/" + response.data.sha256, {
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

    const onAttributeAdd = (key: string, value: string) => {
        for (let attr of attributes)
            if (attr.key === key && attr.value === value) {
                // that key, value was added yet
                setAttributeModalOpen(false);
                return;
            }
        setAttributes([...attributes, { key, value }] as Attribute[]);
        setAttributeModalOpen(false);
    };

    const onAttributeRemove = (idx: number) => {
        setAttributes([
            ...attributes.slice(0, idx),
            ...attributes.slice(idx + 1),
        ]);
    };

    useEffect(() => {
        getGroups();
    }, [auth?.user?.login]);

    async function getGroups() {
        try {
            const response = await api.getShareInfo();
            const groups = response.data.groups;
            groups.splice(groups.indexOf("public"), 1);
            groups.splice(groups.indexOf(auth.user.login), 1);
            setGroups(groups);
            setShareWith(groups.length > 0 ? "default" : "private");
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }

    return (
        <View ident="upload" showIf={groups !== null}>
            <Extendable ident="uploadForm">
                <form>
                    <UploadDropzone
                        file={file}
                        onDrop={(data) => setFile(data)}
                    />
                    <div className="form-group">
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
                                    disabled={
                                        !isEmpty(searchParams.get("parent"))
                                    }
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
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <label className="input-group-text">
                                    Share with
                                </label>
                            </div>
                            <select
                                className="custom-select"
                                value={shareWith}
                                onChange={updateSharingMode}
                            >
                                {groups.length
                                    ? [
                                          <option
                                              key={"default"}
                                              value="default"
                                          >
                                              All my groups
                                          </option>,
                                          <option key={"single"} value="single">
                                              Single group...
                                          </option>,
                                      ]
                                    : []}
                                <option value="public">Everybody</option>
                                <option value="private">Only me</option>
                            </select>
                            <div className="form-hint">
                                {getSharingModeHint()}
                            </div>
                        </div>
                        {shareWith === "single" ? (
                            <div className="mb-3">
                                <Autocomplete
                                    value={group}
                                    items={groups.filter(
                                        (item) =>
                                            item
                                                .toLowerCase()
                                                .indexOf(
                                                    group.toLowerCase()
                                                ) !== -1
                                    )}
                                    onChange={(value) => setGroup(value)}
                                    className="form-control"
                                    style={{ fontSize: "medium" }}
                                    placeholder="Type group name..."
                                    prependChildren
                                >
                                    <div className="input-group-prepend">
                                        <label className="input-group-text">
                                            Group name
                                        </label>
                                    </div>
                                </Autocomplete>
                            </div>
                        ) : (
                            []
                        )}
                        {attributes.length > 0 ? (
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
                        ) : (
                            []
                        )}
                        <ShowIf
                            condition={
                                config.config[
                                    "is_3rd_party_sharing_consent_enabled"
                                ]
                            }
                        >
                            <div className="form-group">
                                <div className="material-switch make-horizontal">
                                    <input
                                        type="checkbox"
                                        name="share_3rd"
                                        id="share_3rd_party"
                                        checked={share3rdParty}
                                        onChange={() =>
                                            setShare3rdParty(!share3rdParty)
                                        }
                                    />
                                    <label
                                        htmlFor="share_3rd_party"
                                        className="bg-primary"
                                    />
                                </div>
                                <label>&nbsp; Share with third parties</label>
                            </div>
                        </ShowIf>
                        <input
                            value="Upload File"
                            className="btn btn-success"
                            type="button"
                            onClick={handleSubmit}
                            disabled={!file}
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
