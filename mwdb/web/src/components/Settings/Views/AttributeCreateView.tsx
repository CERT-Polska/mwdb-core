import * as Yup from "yup";

import { api } from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { yupResolver } from "@hookform/resolvers/yup";
import { UseFormProps, useForm } from "react-hook-form";
import { FormError, Label } from "@mwdb-web/commons/ui";

type FormValues = {
    attributeKey: string;
    label?: string;
    description?: string;
    hidden?: boolean;
};

const validationSchema: Yup.SchemaOf<FormValues> = Yup.object().shape({
    attributeKey: Yup.string()
        .required("Login is required")
        .max(32, "Max 32 characters allowed.")
        .matches(
            /[a-z0-9_-]/,
            "Key must contain only lowercase letters and digits"
        ),
    label: Yup.string(),
    description: Yup.string(),
    hidden: Yup.bool().required("Hidden is required"),
});

const formOptions: UseFormProps<FormValues> = {
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: true,
    defaultValues: {
        attributeKey: "",
        label: "",
        description: "",
        hidden: false,
    },
};

export function AttributeCreateView() {
    const viewAlert = useViewAlert();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>(formOptions);

    async function createAttribute(values: FormValues) {
        try {
            await api.addAttributeDefinition({
                ...values,
                key: values.attributeKey,
            });
            viewAlert.redirectToAlert({
                target: `/settings/attribute/${values.attributeKey}`,
                success: "Attribute created successfully.",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div className="container">
            <h2>Create new attribute</h2>
            <form onSubmit={handleSubmit(createAttribute)}>
                <div className="form-group">
                    <Label
                        label="Key"
                        required
                        htmlFor={"attributeKey" as keyof FormValues}
                    />
                    <input
                        {...register("attributeKey" as keyof FormValues)}
                        id={"attributeKey" as keyof FormValues}
                        className={`form-control ${
                            errors.attributeKey ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.attributeKey} />
                </div>
                <div className="form-group">
                    <Label
                        label="Label"
                        htmlFor={"label" as keyof FormValues}
                    />
                    <input
                        {...register("label" as keyof FormValues)}
                        id={"label" as keyof FormValues}
                        className={`form-control`}
                    />
                </div>
                <div className="form-group">
                    <Label
                        label="Description"
                        htmlFor={"description" as keyof FormValues}
                    />
                    <input
                        {...register("description" as keyof FormValues)}
                        id={"description" as keyof FormValues}
                        className={`form-control`}
                    />
                </div>
                <div className="form-group">
                    <Label
                        label="Hidden attribute"
                        htmlFor={"hidden_checkbox"}
                    />
                    <div className="material-switch">
                        <input
                            {...register("hidden" as keyof FormValues)}
                            type="checkbox"
                            id={"hidden_checkbox"}
                        />
                        <Label
                            label=""
                            htmlFor="hidden_checkbox"
                            className="bg-primary"
                        />
                    </div>
                    <div className="form-hint">
                        Hidden attributes have protected values. Attribute
                        values are not visible for users without
                        reading_all_attributes capability and explicit request
                        for reading them. Also only exact search is allowed.
                        User still must have permission to read key to use it in
                        query.
                    </div>
                </div>
                <input
                    type="submit"
                    value="Submit"
                    className="btn btn-primary"
                />
            </form>
        </div>
    );
}
