import * as Yup from "yup";

import { api } from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { UseFormProps, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormError, Label } from "@mwdb-web/commons/ui";
import { CreateUser, FeedQuality } from "@mwdb-web/types/types";

type FormValues = CreateUser;

const validationSchema: Yup.SchemaOf<FormValues> = Yup.object().shape({
    login: Yup.string()
        .matches(
            /[A-Za-z0-9_-]/,
            "Login must contain only letters, digits, '_' and '-'"
        )
        .max(32, "Max 32 characters allowed.")
        .required("Login is required"),
    email: Yup.string()
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid e-mail address")
        .required("Email is required"),
    additional_info: Yup.string().required("Additional info is required"),
    feed_quality: Yup.string().required(
        "Feed quality is required"
    ) as Yup.BaseSchema<FeedQuality>,
    send_email: Yup.boolean().required("Send email is required"),
});

const formOptions: UseFormProps<FormValues> = {
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: true,
    defaultValues: {
        login: "",
        email: "",
        additional_info: "",
        feed_quality: "high",
        send_email: true,
    },
};

export function UserCreateView() {
    const viewAlert = useViewAlert();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>(formOptions);

    async function createUser(values: FormValues) {
        try {
            await api.createUser(values);
            viewAlert.redirectToAlert({
                target: `/settings/user/${values.login}`,
                success: "User created successfully.",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div className="container">
            <h2>Create new user</h2>
            <form onSubmit={handleSubmit(createUser)}>
                <div className="form-group">
                    <Label
                        label="Login"
                        required
                        htmlFor={"login" as keyof FormValues}
                    />
                    <input
                        {...register("login" as keyof FormValues)}
                        id={"login" as keyof FormValues}
                        className={`form-control ${
                            errors.login ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.login} />
                </div>
                <div className="form-group">
                    <Label
                        label="E-mail"
                        required
                        htmlFor={"email" as keyof FormValues}
                    />
                    <input
                        {...register("email" as keyof FormValues)}
                        id={"email" as keyof FormValues}
                        className={`form-control ${
                            errors.email ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.email} />
                    <div className="form-hint">
                        Make sure that provided e-mail is active for
                        administration purposes
                    </div>
                </div>
                <div className="form-group">
                    <Label
                        label="Additional info"
                        required
                        htmlFor={"additional_info" as keyof FormValues}
                    />
                    <input
                        {...register("additional_info" as keyof FormValues)}
                        id={"additional_info" as keyof FormValues}
                        className={`form-control ${
                            errors.additional_info ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.additional_info} />
                </div>
                <div className="form-group">
                    <Label
                        label="Feed quality"
                        required
                        htmlFor={"feed_quality" as keyof FormValues}
                    />
                    <select
                        {...register("feed_quality" as keyof FormValues)}
                        id={"feed_quality" as keyof FormValues}
                        className="form-control"
                    >
                        <option value="high">high</option>
                        <option value="low">low</option>
                    </select>
                    <FormError errorField={errors.feed_quality} />
                </div>
                <div className="form-group">
                    <Label
                        label="Send e-mail with set password link"
                        required
                        htmlFor={"send_email" as keyof FormValues}
                    />
                    <div className="material-switch">
                        <input
                            type="checkbox"
                            {...register("send_email" as keyof FormValues)}
                            id={"send_email" as keyof FormValues}
                            className={`form-control ${
                                errors.send_email ? "is-invalid" : ""
                            }`}
                        />
                        <Label
                            label=""
                            htmlFor="send_email"
                            className="bg-success"
                        />
                        <FormError errorField={errors.send_email} />
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
