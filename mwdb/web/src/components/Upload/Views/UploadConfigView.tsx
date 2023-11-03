import { useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray, UseFormProps } from "react-hook-form";
import { toast } from "react-toastify";
import { isEmpty } from "lodash";
import AceEditor from "react-ace";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { api } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { View, FormError, Label } from "@mwdb-web/commons/ui";
import { Extendable } from "@mwdb-web/commons/plugins";
import { Capability } from "@mwdb-web/types/types";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { UploadConfigRequest } from "@mwdb-web/types/api";
import { Attributes } from "../common/Attributes";
import { Sharing } from "../common/Sharing";

type FormValues = UploadConfigRequest;

const validationSchema: Yup.SchemaOf<Partial<FormValues>> = Yup.object().shape({
    cfg: Yup.string().test({
        message: ({ value }) => {
            if (!value) {
                return "";
            }
            try {
                JSON.parse(value);
                return "";
            } catch (err: any) {
                return err.toString();
            }
        },
        test: (value) => {
            try {
                JSON.parse(value!);
                return true;
            } catch (err) {
                return false;
            }
        },
    }),
    family: Yup.string().required("Family is required."),
    share3rdParty: Yup.bool(),
    shareWith: Yup.string(),
    config_type: Yup.string(),
    parent: Yup.string(),
    attributes: Yup.array(),
});

export function UploadConfigView() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const searchParams = useSearchParams()[0];

    const formOptions: UseFormProps<FormValues> = {
        resolver: yupResolver(validationSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
        defaultValues: {
            cfg: "{}",
            parent: searchParams.get("parent") || "",
            config_type: "static",
            attributes: [],
            shareWith: "",
        },
    };

    const {
        register,
        setValue,
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<FormValues>(formOptions);

    const handleParentClear = () => {
        if (searchParams.get("parent")) navigate("/config_upload");
        setValue("parent", "");
    };

    const onSubmit = async (values: FormValues) => {
        try {
            const body: FormValues = {
                ...values,
                cfg: JSON.parse(values.cfg!),
                parent: !isEmpty(values.parent) ? values.parent : undefined,
            };
            const response = await api.uploadConfig(body);
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

    return (
        <View ident="configUpload">
            <Extendable ident="configUploadForm">
                <h2>Config upload</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-3">
                        <Label className="input-group-text" label="Config">
                            <AceEditor
                                {...register("cfg" as keyof FormValues)}
                                defaultValue="{}"
                                mode="json"
                                theme="github"
                                wrapEnabled
                                onChange={(input) => setValue("cfg", input)}
                                height="260px"
                                width="100%"
                                setOptions={{
                                    useWorker: false,
                                }}
                            />
                        </Label>
                    </div>
                    <FormError errorField={errors.cfg} />
                    <div className="input-group mb-3 mt-3">
                        <div className="input-group-prepend">
                            <Label
                                htmlFor={"family" as keyof FormValues}
                                className="input-group-text"
                                label="Family"
                            />
                        </div>
                        <input
                            {...register("family" as keyof FormValues)}
                            id={"family" as keyof FormValues}
                            className="form-control"
                            type="text"
                            style={{ fontSize: "medium" }}
                            placeholder="Family"
                        />
                        <div className="input-group-append">
                            <input
                                className="btn btn-outline-danger"
                                type="button"
                                value="Clear"
                                onClick={() => setValue("family", "")}
                            />
                        </div>
                        <FormError errorField={errors.family} />
                    </div>

                    {auth.hasCapability(Capability.addingParents) && (
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <Label
                                    htmlFor={"parent" as keyof FormValues}
                                    className="input-group-text"
                                    label="Parent"
                                />
                            </div>
                            <input
                                {...register("parent" as keyof FormValues)}
                                id={"parent" as keyof FormValues}
                                className="form-control"
                                type="text"
                                style={{ fontSize: "medium" }}
                                placeholder="(Optional) Type parent identifier..."
                                disabled={!isEmpty(searchParams.get("parent"))}
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
                                htmlFor={"config_type" as keyof FormValues}
                                className="input-group-text"
                                label="Config type"
                            />
                        </div>
                        <select
                            {...register("config_type" as keyof FormValues)}
                            id={"config_type" as keyof FormValues}
                            className="custom-select"
                        >
                            <option value="static">Static</option>
                            <option value="dynamic">Dynamic</option>
                        </select>
                    </div>
                    <Sharing sharingKey="share3rdParty" register={register} />
                    <Attributes
                        {...useFieldArray({
                            control,
                            name: "attributes",
                        })}
                    />
                    <div className="d-flex justify-content-end">
                        <input
                            value="Upload config"
                            className="btn btn-success"
                            type="submit"
                        />
                    </div>
                </form>
            </Extendable>
        </View>
    );
}
