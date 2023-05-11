import ReactSelect, { StylesConfig } from "react-select";
import { StateManagerProps } from "react-select/dist/declarations/src/useStateManager";

const selectedBackgroundColor = "#28A745";

const customStyles: StylesConfig = {
    multiValue: (provided) => ({
        ...provided,
        color: "#fff",
        backgroundColor: selectedBackgroundColor,
        borderRadius: 4,
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        color: "#fff",
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
            ? selectedBackgroundColor
            : provided.backgroundColor,
    }),
    clearIndicator: () => ({
        display: "none",
    }),
};

export function Select(props: StateManagerProps) {
    return (
        <ReactSelect {...props} styles={{ ...customStyles, ...props.styles }} />
    );
}
