import { isNil } from "lodash";
import { FieldError } from "react-hook-form";

type Props = {
    errorField?: FieldError;
};

export function FormError(props: Props) {
    const { errorField } = props;
    if (isNil(errorField)) {
        return <></>;
    }

    return (
        <div className="invalid-feedback" style={{ display: "block" }}>
            {errorField.message}
        </div>
    );
}
