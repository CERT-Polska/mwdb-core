import React, { useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray, UseFormProps } from "react-hook-form";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { api } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { Autocomplete, View, FormError, ShowIf } from "@mwdb-web/commons/ui";
import { ConfigContext } from "@mwdb-web/commons/config";
import { Extendable } from "@mwdb-web/commons/plugins";
import { Capability } from "@mwdb-web/types/types";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { UploadFileRequest } from "@mwdb-web/types/api";
import { isEmpty } from "lodash";
import { useGroup } from "../common/hooks/useGroup";
import { UploadDropzone } from "../common/UploadDropzone";
import {
    getSharingModeHint,
    sharingModeToUploadParam,
} from "../common/helpers";
import { Attributes } from "../common/Attributes";
import { Sharing } from "../common/Sharing";

type FormValues = UploadFileRequest;

const validationSchema = Yup.object().shape({
    file: Yup.mixed().required("File is required"),
});

export function UploadFileView() {
    const searchParams = useSearchParams()[0];
    const formOptions: UseFormProps<UploadFileRequest> = {
        resolver: yupResolver(validationSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
        defaultValues: {
            file: null,
            shareWith: "",
            share3rdParty: false,
            group: "",
            parent: searchParams.get("parent") || "",
            attributes: [],
        },
    };

    const {
        register,
        setValue,
        handleSubmit,
        watch,
        formState: { errors },
        control,
    } = useForm<FormValues>(formOptions);

    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const fileUploadTimeout = config.config.file_upload_timeout;
    const navigate = useNavigate();

    const { groups } = useGroup(setValue, "shareWith");

    const { file, shareWith, group } = watch();

    const handleParentClear = () => {
        if (searchParams.get("parent")) navigate("/upload");
        setValue("parent", "");
    };

    const updateSharingMode = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        setValue("shareWith", ev.target.value);
        setValue("group", "");
    };

    const onSubmit = async (values: FormValues) => {
        try {
            const body: UploadFileRequest = {
                ...values,
                file: values.file!,
                parent: searchParams.get("parent") || values.parent,
                shareWith: sharingModeToUploadParam(
                    values.shareWith,
                    values.group
                )!,
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
                            setValue("file", data);
                        }}
                    />
                    <FormError errorField={errors.file} />
                    <div className="form-group">
                        {auth.hasCapability(Capability.addingParents) && (
                            <div className="input-group mb-3">
                                <div className="input-group-prepend">
                                    <label
                                        htmlFor={"parent" as keyof FormValues}
                                        className="input-group-text"
                                    >
                                        Parent
                                    </label>
                                </div>
                                <input
                                    {...register("parent" as keyof FormValues)}
                                    id={"parent" as keyof FormValues}
                                    className="form-control"
                                    type="text"
                                    style={{ fontSize: "medium" }}
                                    placeholder="(Optional) Type parent identifier..."
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
                                <label
                                    htmlFor={"shareWith" as keyof FormValues}
                                    className="input-group-text"
                                >
                                    Share with
                                </label>
                            </div>
                            <select
                                {...register("shareWith" as keyof FormValues)}
                                id={"shareWith" as keyof FormValues}
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
                                    value={group!}
                                    items={groups.filter(
                                        (item) =>
                                            item
                                                .toLowerCase()
                                                .indexOf(
                                                    group!.toLowerCase()
                                                ) !== -1
                                    )}
                                    onChange={(value) =>
                                        setValue("group", value)
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
                        <Sharing
                            sharingKey="share3rdParty"
                            register={register}
                        />
                        <Attributes
                            {...useFieldArray({
                                control,
                                name: "attributes",
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
