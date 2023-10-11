import { useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray, UseFormProps } from "react-hook-form";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { Attributes } from "../common/Attributes";

import { api } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { Autocomplete, View, FormError, Label } from "@mwdb-web/commons/ui";
import { Extendable } from "@mwdb-web/commons/plugins";
import { useGroup } from "../common/hooks/useGroup";
import {
    getSharingModeHint,
    sharingModeToUploadParam,
} from "../common/helpers";
import { Capability } from "@mwdb-web/types/types";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { isEmpty } from "lodash";
import { UploadBlobRequest } from "@mwdb-web/types/api";
import { Sharing } from "../common/Sharing";

type FormValues = UploadBlobRequest;

const validationSchema: Yup.SchemaOf<Partial<FormValues>> = Yup.object().shape({
    content: Yup.string().required("Content is required"),
    type: Yup.string().required("Type is required"),
    name: Yup.string().required("Name is required"),
    parent: Yup.string(),
    shareWith: Yup.string(),
    share3rdParty: Yup.bool(),
    group: Yup.string(),
    attributes: Yup.array(),
});

export function UploadBlobView() {
    const searchParams = useSearchParams()[0];
    const formOptions: UseFormProps<FormValues> = {
        resolver: yupResolver(validationSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
        defaultValues: {
            content: "",
            shareWith: "",
            type: "",
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
    const navigate = useNavigate();

    const { groups } = useGroup(setValue, "shareWith");

    const { shareWith, group } = watch();

    const handleParentClear = () => {
        if (searchParams.get("parent")) navigate("/blob_upload");
        setValue("parent", "");
    };

    const updateSharingMode = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        setValue("shareWith", ev.target.value);
        setValue("group", "");
    };

    const onSubmit = async (values: FormValues) => {
        try {
            const body: FormValues = {
                ...values,
                parent: searchParams.get("parent") || values.parent,
                shareWith: sharingModeToUploadParam(
                    values.shareWith,
                    values.group
                )!,
            };
            const response = await api.uploadBlob(body);
            navigate("/blob/" + response.data.id, {
                replace: true,
            });
            toast("Blob uploaded successfully.", {
                type: "success",
            });
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    };

    return (
        <View ident="blobUpload" showIf={groups !== null}>
            <Extendable ident="blobUploadForm">
                <h2>Blob upload</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="input-group mb-3">
                        <div className="input-group-prepend">
                            <Label
                                label="Content"
                                className="input-group-text"
                                htmlFor={"content" as keyof FormValues}
                            />
                        </div>
                        <textarea
                            {...register("content" as keyof FormValues)}
                            placeholder="Blob content"
                            className="form-control"
                        />
                        <FormError errorField={errors.content} />
                    </div>
                    <div className="input-group mb-3">
                        <div className="input-group-prepend">
                            <Label
                                label="Name"
                                className="input-group-text"
                                htmlFor={"name" as keyof FormValues}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <input
                                {...register("name" as keyof FormValues)}
                                placeholder="Blob name"
                                className="form-control"
                                style={{ height: "100%" }}
                            />
                        </div>
                        <FormError errorField={errors.name} />
                    </div>
                    <div className="input-group mb-3">
                        <div className="input-group-prepend">
                            <Label
                                label="Type"
                                className="input-group-text"
                                htmlFor={"type" as keyof FormValues}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <input
                                {...register("type" as keyof FormValues)}
                                className="form-control"
                                placeholder="Blob type"
                                style={{ height: "100%" }}
                            />
                        </div>
                        <FormError errorField={errors.type} />
                    </div>
                    <div className="form-group">
                        {auth.hasCapability(Capability.addingParents) && (
                            <div className="input-group mb-3">
                                <div className="input-group-prepend">
                                    <Label
                                        label="Parent"
                                        className="input-group-text"
                                        htmlFor={"parent" as keyof FormValues}
                                    />
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
                                <Label
                                    label="Share with"
                                    className="input-group-text"
                                    htmlFor={"shareWith" as keyof FormValues}
                                />
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
                                    value={group ?? ""}
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
                                        <Label
                                            label="Group name"
                                            className="input-group-text"
                                        />
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
                                value="Upload blob"
                                className="btn btn-success"
                                type="submit"
                            />
                        </div>
                    </div>
                </form>
            </Extendable>
        </View>
    );
}
