import React, { useContext, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-toastify";

import { api } from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View, Label, FormError, LoadingSpinner } from "@mwdb-web/commons/ui";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { useNavRedirect } from "@mwdb-web/commons/hooks";

const formFields = {
    login: "login",
    email: "email",
    affiliation: "affiliation",
    job_title: "job_title",
    job_responsibilities: "job_responsibilities",
    other_info: "other_info",
    recaptcha: "recaptcha",
};

const validationSchema = Yup.object().shape({
    [formFields.login]: Yup.string()
        .required("Login is required")
        .matches(
            /[A-Za-z0-9_-]{1,32}/,
            "Login must contain only letters, digits, '_'and '-' characters, max 32 characters allowed."
        ),
    [formFields.email]: Yup.string()
        .required("Email is required")
        .matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g, "Value is not email"),
    [formFields.affiliation]: Yup.string().required("Affiliation is required"),
    [formFields.job_title]: Yup.string().required("Job title is required"),

    [formFields.job_responsibilities]: Yup.string().required(
        "Job responsibilities is required"
    ),
    [formFields.other_info]: Yup.string().required(
        "Other information is required"
    ),
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

export default function UserRegister() {
    const config = useContext(ConfigContext);
    const { redirectTo } = useNavRedirect();
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm(formOptions);

    const [loading, setLoading] = useState(false);
    const captchaRef = useRef(null);

    async function registerUser(values) {
        try {
            setLoading(true);
            const additional_info = `Affiliation: ${values.affiliation}, Job title: ${values.job_title}, ${values.job_responsibilities} ${values.other_info}`;
            const response = await api.registerUser(
                values.login,
                values.email,
                additional_info,
                values.recaptcha
            );
            toast(
                `User ${response.data.login} registration requested. Account is
                        waiting for confirmation`,
                { type: "success" }
            );
            setLoading(false);
            redirectTo("/login");
        } catch (e) {
            toast(getErrorMessage(e), {
                type: "error",
            });
            setLoading(false);
        } finally {
            captchaRef.current?.reset();
            setValue(formFields.recaptcha, null);
        }
    }

    return (
        <div className="register-form">
            <div className="register-form__background" />
            <div className="register-form__container">
                <View ident="userRegister">
                    <h2 className="text-center">Register user</h2>
                    <p className="text-center">
                        Provided data are needed for vetting process. Keep in
                        mind that all submissions are reviewed manually, so the
                        approval process can take a few days.
                    </p>
                    <form onSubmit={handleSubmit(registerUser)}>
                        <div className="row">
                            <div className="form-group col-md">
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
                            <div className="form-group col-md">
                                <Label
                                    label="Business e-mail"
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
                        </div>
                        <b>Additional information:</b>
                        <div className="row">
                            <div className="form-group col-md">
                                <Label
                                    label="Affiliation"
                                    required
                                    htmlFor={formFields.affiliation}
                                />
                                <input
                                    {...register(formFields.affiliation)}
                                    id={formFields.affiliation}
                                    className={`form-control ${
                                        errors.affiliation ? "is-invalid" : ""
                                    }`}
                                />
                                <FormError errorField={errors.affiliation} />
                                <div className="form-hint">
                                    Provide name of company or university
                                </div>
                            </div>
                            <div className="form-group col-md">
                                <Label
                                    label="Job Title"
                                    required
                                    htmlFor={formFields.job_title}
                                />
                                <input
                                    {...register(formFields.job_title)}
                                    id={formFields.job_title}
                                    className={`form-control ${
                                        errors.job_title ? "is-invalid" : ""
                                    }`}
                                />
                                <FormError errorField={errors.job_title} />
                                <div className="form-hint">
                                    Provide your job title
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <Label
                                label="Job Responsibilities"
                                required
                                htmlFor={formFields.job_responsibilities}
                            />
                            <input
                                {...register(formFields.job_responsibilities)}
                                id={formFields.job_responsibilities}
                                className={`form-control ${
                                    errors.job_responsibilities
                                        ? "is-invalid"
                                        : ""
                                }`}
                            />
                            <FormError
                                errorField={errors.job_responsibilities}
                            />
                            <div className="form-hint">
                                Provide your job responsibilities and experience
                                in the field of malware analysis
                            </div>
                        </div>
                        <div className="form-group">
                            <Label
                                label="Other information"
                                required
                                htmlFor={formFields.other_info}
                            />
                            <textarea
                                {...register(formFields.other_info)}
                                id={formFields.other_info}
                                className={`form-control ${
                                    errors.other_info ? "is-invalid" : ""
                                }`}
                            />
                            <FormError errorField={errors.other_info} />
                            <div className="form-hint">
                                Provide additional information e.g. Twitter
                                handle, invitation info, blog URL etc.
                            </div>
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
