import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { View } from "@mwdb-web/commons/ui";

import { api } from "@mwdb-web/commons/api";

export default function UserSetPassword() {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);
    const token =
        new URLSearchParams(window.location.search).get("token") || "";

    const validationSchema = Yup.object().shape({
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

    const { register, handleSubmit, formState } = useForm(formOptions);
    const { errors } = formState;

    async function onSubmit(form) {
        try {
            let response = await api.authSetPassword(token, form.password);
            setSuccess(
                `Password successfully changed for ${response.data.login}`
            );
            setError(false);
        } catch (error) {
            setError(error);
        }
    }

    return (
        <View ident="userSetPassword" success={success} error={error}>
            <form onSubmit={(e) => e.preventDefault()}>
                <h2>Set password</h2>
                <div className="form-group">
                    <label>New password</label>
                    <input
                        type="password"
                        name="password"
                        className={`form-control ${
                            errors.password ? "is-invalid" : ""
                        }`}
                        required
                        {...register("password")}
                        disabled={success}
                    />
                    {errors.password && <p>{errors.password.message}</p>}
                </div>
                <div className="form-group">
                    <label>Confirm password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        className={`form-control ${
                            errors.confirmPassword ? "is-invalid" : ""
                        }`}
                        required
                        {...register("confirmPassword")}
                        disabled={success}
                    />
                    {errors.confirmPassword && (
                        <p>{errors.confirmPassword.message}</p>
                    )}
                </div>
                <input
                    type="submit"
                    value="Submit"
                    onClick={handleSubmit(onSubmit)}
                    className="btn btn-primary"
                />
            </form>
        </View>
    );
}
