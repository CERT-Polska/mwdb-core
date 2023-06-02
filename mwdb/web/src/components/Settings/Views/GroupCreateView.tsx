import * as Yup from "yup";

import { api } from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { UseFormProps, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormError, Label } from "@mwdb-web/commons/ui";

type FormValues = {
    name: string;
};

const validationSchema: Yup.SchemaOf<FormValues> = Yup.object().shape({
    name: Yup.string()
        .matches(
            /[A-Za-z0-9_-]/,
            "Group name must contain only letters, digits, '_' and '-' characters"
        )
        .max(32, "Max 32 characters allowed.")
        .required("Name is required"),
});

const formOptions: UseFormProps<FormValues> = {
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: true,
    defaultValues: {
        name: "",
    },
};

export function GroupCreateView() {
    const viewAlert = useViewAlert();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>(formOptions);

    async function createGroup(values: FormValues) {
        try {
            await api.registerGroup(values.name);
            viewAlert.redirectToAlert({
                target: `/settings/group/${values.name}`,
                success: "Group created successfully.",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div className="container">
            <h2>Create new group</h2>
            <form onSubmit={handleSubmit(createGroup)}>
                <div className="form-group">
                    <Label
                        label="Name"
                        required
                        htmlFor={"name" as keyof FormValues}
                    />
                    <input
                        {...register("name" as keyof FormValues)}
                        id={"name" as keyof FormValues}
                        className={`form-control ${
                            errors.name ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.name} />
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
