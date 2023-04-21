import React, { useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import { isEmpty } from "lodash";
import AceEditor from "react-ace";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

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

const formFields = {
    cfg: "cfg",
    family: "family",
    parent: "parent",
    config_type: "config_type",
    attributes: "attributes",
};

const validationSchema = Yup.object().shape({
    [formFields.cfg]: Yup.string().test({
        message: ({ value }) => {
            if (!value) {
                return "";
            }
            try {
                JSON.parse(value);
                return "";
            } catch (err) {
                return err.toString();
            }
        },
        test: (value) => {
            try {
                JSON.parse(value);
                return true;
            } catch (err) {
                return false;
            }
        },
    }),
});

export default function UploadConfig() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const searchParams = useSearchParams()[0];
    const [attributeModalOpen, setAttributeModalOpen] = useState(false);

    const formOptions = {
        resolver: yupResolver(validationSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
        defaultValues: {
            [formFields.cfg]: "{}",
            [formFields.parent]: searchParams.get("parent") || "",
            [formFields.attributes]: [],
        },
    };

    const {
        register,
        setValue,
        handleSubmit,
        formState: { errors },
        control,
    } = useForm(formOptions);

    const {
        fields: attributes,
        append: appendAttribute,
        remove: removeAttribute,
    } = useFieldArray({
        control,
        name: formFields.attributes,
    });

    const handleParentClear = () => {
        if (searchParams.get("parent")) navigate("/config_upload");
        setValue(formFields.parent, "");
    };

    const onSubmit = async (values) => {
        try {
            const body = {
                ...values,
                [formFields.cfg]: JSON.parse(values[formFields.cfg]),
                [formFields.parent]: !isEmpty(values[formFields.parent])
                    ? values[formFields.parent]
                    : undefined,
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
        appendAttribute({ key, value });
        setAttributeModalOpen(false);
    };

    return (
        <View ident="configUpload">
            <Extendable ident="configUploadForm">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <label className="input-group-text">
                                    Config
                                    <AceEditor
                                        {...register(formFields.cfg)}
                                        defaultValue="{}"
                                        mode="json"
                                        theme="github"
                                        wrapEnabled
                                        onChange={(input) =>
                                            setValue(formFields.cfg, input)
                                        }
                                        height="260px"
                                        setOptions={{
                                            useWorker: false,
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        <FormError errorField={errors[formFields.cfg]} />
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <label
                                    htmlFor={formFields.config_type}
                                    className="input-group-text"
                                >
                                    Config type
                                </label>
                            </div>
                            <select
                                {...register(formFields.config_type)}
                                id={formFields.config_type}
                                className="custom-select"
                            >
                                <option value="static">Static</option>
                                <option value="dynamic">Dynamic</option>
                            </select>
                        </div>
                        <div className="input-group mb-3 mt-3">
                            <div className="input-group-prepend">
                                <label
                                    htmlFor={formFields.family}
                                    className="input-group-text"
                                >
                                    Family
                                </label>
                            </div>
                            <input
                                {...register(formFields.family)}
                                id={formFields.family}
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
                                    onClick={() =>
                                        setValue(formFields.family, "")
                                    }
                                />
                            </div>
                        </div>
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
                            {attributes.map((attr, idx) => (
                                <tr key={idx} className="centered">
                                    <th>{attr.key}</th>
                                    <td>
                                        {typeof attr.value === "string" ? (
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
                                            onClick={() => removeAttribute(idx)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </DataTable>
                        <div className="d-flex justify-content-end">
                            <input
                                value="Upload config"
                                className="btn btn-success"
                                type="submit"
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
