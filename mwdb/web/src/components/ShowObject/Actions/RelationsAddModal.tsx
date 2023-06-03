import * as Yup from "yup";
import { ConfirmationModal, FormError, Label } from "@mwdb-web/commons/ui";
import { UseFormProps, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

type FormValues = {
    relation: string;
    value: string;
};

const validationSchema: Yup.SchemaOf<FormValues> = Yup.object().shape({
    relation: Yup.string().required(
        "Please select parent or child relationship."
    ),
    value: Yup.string().required("sha256 Identifier is required"),
});

const formOptions: UseFormProps<FormValues> = {
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: true,
    defaultValues: {
        relation: "",
        value: "",
    },
};

type Props = {
    isOpen: boolean;
    onSubmit: (relation: string, value: string) => void;
    onRequestModalClose: () => void;
};

export function RelationsAddModal(props: Props) {
    const {
        register,
        reset,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>(formOptions);

    function handleClose() {
        reset();
        props.onRequestModalClose();
    }

    function createRelation(values: FormValues) {
        props.onSubmit(values.relation, values.value);
    }

    return (
        <ConfirmationModal
            buttonStyle="btn-success"
            confirmText="Add"
            message="Add relation"
            isOpen={props.isOpen}
            onRequestClose={handleClose}
            onConfirm={() => handleSubmit(createRelation)()}
        >
            <div className="form-group">
                <Label
                    label="Relationship"
                    required
                    htmlFor={"relation" as keyof FormValues}
                />
                <select
                    {...register("relation" as keyof FormValues)}
                    id={"relation" as keyof FormValues}
                    className={`form-control ${
                        errors.relation ? "is-invalid" : ""
                    }`.trim()}
                    style={{ width: 200 }}
                >
                    <option value="" hidden>
                        Select relationship
                    </option>
                    <option value="parent">parent</option>
                    <option value="child">child</option>
                </select>
                <FormError errorField={errors.relation} />
            </div>
            <div className="form-group">
                <Label
                    label="sha256 Identifier"
                    required
                    htmlFor={"value" as keyof FormValues}
                />
                <input
                    {...register("value" as keyof FormValues)}
                    id={"value" as keyof FormValues}
                    className={`form-control ${
                        errors.value ? "is-invalid" : ""
                    }`.trim()}
                    style={{ width: 600 }}
                />
                <FormError errorField={errors.value} />
            </div>
        </ConfirmationModal>
    );
}
