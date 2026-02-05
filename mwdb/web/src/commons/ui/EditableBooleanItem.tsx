import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { EditButton } from "./EditButton";
import { Label } from "@mwdb-web/commons/ui/Label";

type Props = {
    name: string;
    defaultValue: boolean;
    onSubmit: (value: Record<string, boolean>) => void;
};

export function EditableBooleanItem(props: Props) {
    const { name, defaultValue, onSubmit } = props;
    const [value, setValue] = useState<boolean>(defaultValue);
    const [edit, setEdit] = useState<boolean>(false);

    return (
        <form
            onSubmit={(ev) => {
                ev.preventDefault();
                onSubmit({ [name]: value });
                setEdit(false);
            }}
        >
            {edit ? (
                <div className="input-group">
                    <div className="material-switch">
                        <input
                            type="checkbox"
                            className={"form-control"}
                            checked={value}
                            name={name}
                            id={name}
                            onChange={(ev) => setValue(ev.target.checked)}
                        />
                        <Label label="" htmlFor={name} className="bg-success" />
                    </div>
                    <div className="input-group-append">
                        <button
                            className="btn btn-outline-success"
                            type="submit"
                        >
                            <small>Save </small>
                            <FontAwesomeIcon icon={faSave} />
                        </button>
                        <button
                            className="btn btn-outline-danger"
                            type="button"
                            onClick={() => {
                                setValue(defaultValue);
                                setEdit(false);
                            }}
                        >
                            <small>Cancel </small>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="material-switch">
                        <input
                            type="checkbox"
                            className={"form-control"}
                            checked={defaultValue}
                            name={name}
                            id={name}
                            readOnly
                        />
                        <Label label="" htmlFor={name} className="bg-success" />
                    </div>
                    <EditButton
                        onClick={(ev) => {
                            ev.preventDefault();
                            setValue(defaultValue);
                            setEdit(true);
                        }}
                    />
                </div>
            )}
        </form>
    );
}
