import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { toast } from "react-toastify";

import { View } from "@mwdb-web/commons/ui";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { api } from "@mwdb-web/commons/api";

type FormValues = {
    password: string;
    confirmPassword: string;
};

export function UserSetPasswordView() {
    const [success, setSuccess] = useState<boolean>(false);
    const token =
        new URLSearchParams(window.location.search).get("token") || "";

    const validationSchema: Yup.SchemaOf<FormValues> = Yup.object().shape({
        password: Yup.string()
            .required("Password is required")
            .min(8, "Password must be at least 8 characters"),
        confirmPassword: Yup.string()
            .required("Password confirmation is required")
            .oneOf(
                [Yup.ref("password")],
                "Password and confirm password does not match"
            ),
    });
    const formOptions = { resolver: yupResolver(validationSchema) };

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>(formOptions);

    async function onSubmit(form: FormValues) {
        try {
            let response = await api.authSetPassword(token, form.password);
            setSuccess(true);
            toast(`Password successfully changed for ${response.data.login}`, {
                type: "success",
            });
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }

    return (
        <View ident="userSetPassword">
            <form onSubmit={handleSubmit(onSubmit)}>
                <h2>Set password</h2>
                <div className="form-group">
                    <label>New password</label>
                    <input
                        type="password"
                        className={`form-control ${
                            errors.password ? "is-invalid" : ""
                        }`}
                        {...register("password")}
                        disabled={success}
                    />
                    {errors.password && (
                        <p className="invalid-feedback">
                            {errors.password.message}
                        </p>
                    )}
                </div>
                <div className="form-group">
                    <label>Confirm password</label>
                    <input
                        type="password"
                        className={`form-control ${
                            errors.confirmPassword ? "is-invalid" : ""
                        }`}
                        {...register("confirmPassword")}
                        disabled={success}
                    />
                    {errors.confirmPassword && (
                        <p className="invalid-feedback">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>
                <input
                    type="submit"
                    value="Submit"
                    className="btn btn-primary"
                />
            </form>
        </View>
    );
}
