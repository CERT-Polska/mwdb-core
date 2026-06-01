import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { EditButton } from "./EditButton";
import { InputHTMLAttributes } from "react";
import { SelectHTMLAttributes } from "react";

type Select = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onSubmit">;
type Input = Omit<InputHTMLAttributes<HTMLInputElement>, "onSubmit">;

type SelectOrInput = Select | Input;

type Props = React.PropsWithChildren<
    SelectOrInput & {
        name: string;
        defaultValue: string;
        type?: string;
        selective?: boolean;
        badge?: boolean;
        masked?: boolean;
        disabled?: boolean;
        onSubmit: (value: Record<string, string>) => void;
    }
>;

export function EditableItem(props: Props) {
    const {
        name,
        type,
        selective,
        badge,
        children,
        defaultValue,
        onSubmit,
        masked,
        disabled,
        ...inputProps
    } = props;
    const [value, setValue] = useState<string>(defaultValue);
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
                    {selective ? (
                        <select
                            {...(inputProps as Select)}
                            className="form-control"
                            value={value}
                            name={name}
                            onChange={(ev) => setValue(ev.target.value)}
                        >
                            {children}
                        </select>
                    ) : (
                        <input
                            {...(inputProps as Input)}
                            type={type || "text"}
                            name={name}
                            className="form-control"
                            value={value}
                            onChange={(ev) => setValue(ev.target.value)}
                        />
                    )}
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
                    <span
                        className={
                            badge
                                ? "badge badge-secondary align-middle"
                                : "align-middle"
                        }
                    >
                        {masked ? (
                            <span>{"•".repeat(defaultValue.length)}</span>
                        ) : (
                            <span>{defaultValue}</span>
                        )}
                    </span>
                    {!disabled ? (
                        <EditButton
                            onClick={(ev) => {
                                ev.preventDefault();
                                setValue(defaultValue);
                                setEdit(true);
                            }}
                        />
                    ) : (
                        []
                    )}
                </div>
            )}
        </form>
    );
}
