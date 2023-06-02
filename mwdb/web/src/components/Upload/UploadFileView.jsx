import React, { useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { Attributes } from "./common/Attributes";

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
import { UploadDropzone } from "./common/UploadDropzone";
import { useGroup } from "./common/hooks/useGroup";
import { getSharingModeHint, sharingModeToUploadParam } from "./common/helpers";

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
    const searchParams = useSearchParams()[0];
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

    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const fileUploadTimeout = config.config["file_upload_timeout"];
    const navigate = useNavigate();

    const { groups } = useGroup(setValue, formFields.shareWith);

    const { file, shareWith, group } = watch();

    const handleParentClear = () => {
        if (searchParams.get("parent")) navigate("/file_upload");
        setValue(formFields.parent, "");
    };

    const updateSharingMode = (ev) => {
        setValue(formFields.shareWith, ev.target.value);
        setValue(formFields.group, "");
    };

    const onSubmit = async (values) => {
        try {
            const body = {
                ...values,
                parent: searchParams.get("parent") || values[formFields.parent],
                shareWith: sharingModeToUploadParam(
                    values[formFields.shareWith],
                    values[formFields.group]
                ),
                fileUploadTimeout,
            };
            const response = await api.uploadFile(body);
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

    return (
        <View ident="fileUpload" showIf={groups !== null}>
            <Extendable ident="fileUploadForm">
                <h2>File upload</h2>
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
                                {getSharingModeHint(shareWith, "file")}
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