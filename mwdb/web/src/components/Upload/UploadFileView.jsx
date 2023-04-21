import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { Attributes } from "./components/Attributes";

import { api } from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import {
    Autocomplete,
    View,
    getErrorMessage,
    FormError,
} from "@mwdb-web/commons/ui";
import { ConfigContext } from "@mwdb-web/commons/config";
import { Extendable } from "@mwdb-web/commons/plugins";
import { UploadDropzone } from "./components/UploadDropzone";

const formFields = {
    file: "file",
    parent: "parent",
    shareWith: "shareWith",
    group: "group",
    attributes: "attributes",
};

const validationSchema = Yup.object().shape({
    [formFields.file]: Yup.mixed().required("File is required"),
});

export default function UploadFileView() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const fileUploadTimeout = config.config["file_upload_timeout"];
    const navigate = useNavigate();
    const searchParams = useSearchParams()[0];
    const [groups, setGroups] = useState([]);

    const formOptions = {
        resolver: yupResolver(validationSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
        defaultValues: {
            [formFields.file]: null,
            [formFields.shareWith]: "",
            [formFields.group]: "",
            [formFields.parent]: searchParams.get("parent") || "",
            [formFields.attributes]: [],
        },
    };

    const {
        register,
        setValue,
        handleSubmit,
        watch,
        formState: { errors },
        control,
    } = useForm(formOptions);

    const { file, shareWith, group } = watch();

    const handleParentClear = () => {
        if (searchParams.get("parent")) navigate("/file_upload");
        setValue(formFields.parent, "");
    };

    const updateSharingMode = (ev) => {
        setValue(formFields.shareWith, ev.target.value);
        setValue(formFields.group, "");
    };

    const sharingModeToUploadParam = (_shareWith) => {
        if (_shareWith === "default") return "*";
        else if (_shareWith === "public") return "public";
        else if (_shareWith === "private") return "private";
        else if (_shareWith === "single") return group;
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

    const onSubmit = async (values) => {
        try {
            const response = await api.uploadFile(
                values[formFields.file],
                searchParams.get("parent") || values[formFields.parent],
                sharingModeToUploadParam(values[formFields.shareWith]),
                values[formFields.attributes],
                fileUploadTimeout
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

    useEffect(() => {
        getGroups();
    }, [auth?.user?.login]);

    async function getGroups() {
        try {
            let response = await api.getShareInfo();
            let groups = response.data.groups;
            groups.splice(groups.indexOf("public"), 1);
            groups.splice(groups.indexOf(auth.user.login), 1);

            setGroups(groups);
            setValue(
                formFields.shareWith,
                groups.length > 0 ? "default" : "private"
            );
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }

    return (
        <View ident="fileUpload" showIf={groups !== null}>
            <Extendable ident="fileUploadForm">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <UploadDropzone
                        file={file}
                        onDrop={(data) => {
                            setValue(formFields.file, data);
                        }}
                    />
                    <FormError errorField={errors[formFields.file]} />
                    <div className="form-group">
                        {auth.hasCapability(Capability.addingParents) && (
                            <div className="input-group mb-3">
                                <div className="input-group-prepend">
                                    <label
                                        htmlFor={formFields.parent}
                                        className="input-group-text"
                                    >
                                        Parent
                                    </label>
                                </div>
                                <input
                                    {...register(formFields.parent)}
                                    id={formFields.parent}
                                    className="form-control"
                                    type="text"
                                    style={{ fontSize: "medium" }}
                                    placeholder="(Optional) Type parent identifier..."
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
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <label
                                    htmlFor={formFields.shareWith}
                                    className="input-group-text"
                                >
                                    Share with
                                </label>
                            </div>
                            <select
                                {...register(formFields.shareWith)}
                                id={formFields.shareWith}
                                className="custom-select"
                                onChange={updateSharingMode}
                            >
                                {groups.length && (
                                    <>
                                        <option key={"default"} value="default">
                                            All my groups
                                        </option>
                                        <option key={"single"} value="single">
                                            Single group...
                                        </option>
                                    </>
                                )}
                                <option value="public">Everybody</option>
                                <option value="private">Only me</option>
                            </select>
                            <div className="form-hint">
                                {getSharingModeHint()}
                            </div>
                        </div>
                        {shareWith === "single" && (
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
                                    onChange={(value) =>
                                        setValue(formFields.group, value)
                                    }
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
                        )}
                        <Attributes
                            {...useFieldArray({
                                control,
                                name: formFields.attributes,
                            })}
                        />

                        <div className="d-flex justify-content-end">
                            <input
                                value="Upload file"
                                className="btn btn-success"
                                type="submit"
                                disabled={!file}
                            />
                        </div>
                    </div>
                </form>
            </Extendable>
        </View>
    );
}
