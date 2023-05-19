import { useContext } from "react";
import * as Yup from "yup";

import { APIContext } from "@mwdb-web/commons/api";

import { useViewAlert } from "@mwdb-web/commons/hooks";
import { Provider } from "@mwdb-web/types/types";
import { yupResolver } from "@hookform/resolvers/yup";
import { UseFormProps, useForm } from "react-hook-form";
import { FormError, Label } from "@mwdb-web/commons/ui";

type FormValues = Provider;

const validationSchema: Yup.SchemaOf<FormValues> = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    client_id: Yup.string().required("Client ID required"),
    client_secret: Yup.string().required("Client secret required"),
    authorization_endpoint: Yup.string().required(
        "Authorization endpoint required"
    ),
    token_endpoint: Yup.string().required("Token endpoint required"),
    userinfo_endpoint: Yup.string().required("Userinfo endpoint required"),
    jwks_endpoint: Yup.string().required("Jwks endpoint required"),
    logout_endpoint: Yup.string().required("Logout endpoint required"),
});

const formOptions: UseFormProps<FormValues> = {
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: true,
    defaultValues: {
        userinfo_endpoint: "",
        jwks_endpoint: "",
        token_endpoint: "",
        name: "",
        authorization_endpoint: "",
        client_id: "",
        client_secret: "",
        logout_endpoint: "",
    },
};

export function OAuthRegisterView() {
    const api = useContext(APIContext);
    const viewAlert = useViewAlert();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>(formOptions);

    async function registerProvider(values: FormValues) {
        try {
            await api.oauthRegisterProvider(values);
            viewAlert.redirectToAlert({
                target: `/settings/oauth`,
                success: "Provider registered successfully",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div className="container">
            <h2>Register new identity provider</h2>
            <form onSubmit={handleSubmit(registerProvider)}>
                <div className="form-group">
                    <Label
                        label="Provider name"
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
                <div className="form-group">
                    <Label
                        label="Client ID"
                        required
                        htmlFor={"client_id" as keyof FormValues}
                    />
                    <input
                        {...register("client_id" as keyof FormValues)}
                        id={"client_id" as keyof FormValues}
                        className={`form-control ${
                            errors.client_id ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.client_id} />
                </div>
                <div className="form-group">
                    <Label
                        label="Client secret"
                        required
                        htmlFor={"client_secret" as keyof FormValues}
                    />
                    <input
                        {...register("client_secret" as keyof FormValues)}
                        id={"client_secret" as keyof FormValues}
                        className={`form-control ${
                            errors.client_secret ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.client_secret} />
                </div>
                <div className="form-group">
                    <Label
                        label="Authorization endpoint"
                        required
                        htmlFor={"authorization_endpoint" as keyof FormValues}
                    />
                    <input
                        {...register(
                            "authorization_endpoint" as keyof FormValues
                        )}
                        id={"authorization_endpoint" as keyof FormValues}
                        className={`form-control ${
                            errors.authorization_endpoint ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.authorization_endpoint} />
                </div>
                <div className="form-group">
                    <Label
                        label="Token endpoint"
                        required
                        htmlFor={"token_endpoint" as keyof FormValues}
                    />
                    <input
                        {...register("token_endpoint" as keyof FormValues)}
                        id={"token_endpoint" as keyof FormValues}
                        className={`form-control ${
                            errors.token_endpoint ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.token_endpoint} />
                </div>
                <div className="form-group">
                    <Label
                        label="Userinfo endpoint"
                        required
                        htmlFor={"userinfo_endpoint" as keyof FormValues}
                    />
                    <input
                        {...register("userinfo_endpoint" as keyof FormValues)}
                        id={"userinfo_endpoint" as keyof FormValues}
                        className={`form-control ${
                            errors.userinfo_endpoint ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.userinfo_endpoint} />
                </div>
                <div className="form-group">
                    <Label
                        label="Jwks endpoint"
                        required
                        htmlFor={"jwks_endpoint" as keyof FormValues}
                    />
                    <input
                        {...register("jwks_endpoint" as keyof FormValues)}
                        id={"jwks_endpoint" as keyof FormValues}
                        className={`form-control ${
                            errors.jwks_endpoint ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.jwks_endpoint} />
                </div>
                <div className="form-group">
                    <Label
                        label="Logout endpoint"
                        required
                        htmlFor={"logout_endpoint" as keyof FormValues}
                    />
                    <input
                        {...register("logout_endpoint" as keyof FormValues)}
                        id={"logout_endpoint" as keyof FormValues}
                        className={`form-control ${
                            errors.logout_endpoint ? "is-invalid" : ""
                        }`}
                    />
                    <FormError errorField={errors.logout_endpoint} />
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
