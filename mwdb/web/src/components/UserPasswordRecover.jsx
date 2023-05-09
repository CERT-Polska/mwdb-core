import React, { useState, useContext, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import { api } from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import {
    View,
    getErrorMessage,
    Label,
    FormError,
    LoadingSpinner,
} from "@mwdb-web/commons/ui";
import { useNavRedirect } from "@mwdb-web/commons/hooks";

const formFields = {
    login: "login",
    email: "email",
    recaptcha: "recaptcha",
};

const validationSchema = Yup.object().shape({
    [formFields.login]: Yup.string().required("Login is required"),
    [formFields.email]: Yup.string()
        .required("Email is required")
        .matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g, "Value is not email"),
    [formFields.recaptcha]: Yup.string()
        .nullable()
        .required("Recaptcha is required"),
});

const formOptions = {
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: true,
};

export default function UserPasswordRecover() {
    const config = useContext(ConfigContext);
    const { redirectTo } = useNavRedirect();
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm(formOptions);

    const [loading, setLoading] = useState(false);
    const captchaRef = useRef(null);

    async function recoverPassword(values) {
        try {
            setLoading(true);
            await api.authRecoverPassword(
                values.login,
                values.email,
                values.recaptcha
            );

            toast("Password reset link has been sent to the e-mail address", {
                type: "success",
            });
            setLoading(false);
            redirectTo("/login");
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
            setLoading(false);
            reset();
        } finally {
            captchaRef.current?.reset();
            setValue(formFields.recaptcha, null);
        }
    }

    return (
        <div className="user-password-recover">
            <div className="user-password-recover__background" />
            <div className="user-password-recover__container">
                <View>
                    <h2 className="text-center">Recover password</h2>
                    <form onSubmit={handleSubmit(recoverPassword)}>
                        <div className="form-group">
                            <Label
                                label="Login"
                                required
                                htmlFor={formFields.login}
                            />
                            <input
                                {...register(formFields.login)}
                                id={formFields.login}
                                className={`form-control ${
                                    errors.login ? "is-invalid" : ""
                                }`}
                            />
                            <FormError errorField={errors.login} />
                        </div>
                        <div className="form-group">
                            <Label
                                label="Email"
                                required
                                htmlFor={formFields.email}
                            />
                            <input
                                {...register(formFields.email)}
                                id={formFields.email}
                                className={`form-control ${
                                    errors.email ? "is-invalid" : ""
                                }`}
                            />
                            <FormError errorField={errors.email} />
                        </div>
                        <div>
                            <p>
                                Please enter the information above to recover
                                your password.
                            </p>
                        </div>
                        {config.config["recaptcha_site_key"] && (
                            <>
                                <ReCAPTCHA
                                    ref={captchaRef}
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        marginBottom: 12,
                                    }}
                                    sitekey={
                                        config.config["recaptcha_site_key"]
                                    }
                                    onChange={(val) =>
                                        setValue(formFields.recaptcha, val)
                                    }
                                />
                                <div className="text-center">
                                    <FormError errorField={errors.recaptcha} />
                                </div>
                            </>
                        )}
                        <div className="d-flex justify-content-between">
                            <button
                                className="btn btn-outline-primary btn-lg"
                                onClick={() => redirectTo("/login")}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={loading}
                            >
                                <LoadingSpinner loading={loading} />
                                Submit
                            </button>
                        </div>
                    </form>
                </View>
            </div>
        </div>
    );
}
