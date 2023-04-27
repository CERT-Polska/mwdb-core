import ReactSelect from "react-select";

const selectedBackgroundColor = "#28A745";

const customStyles = {
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

export default function Select(props) {
    return (
        <ReactSelect {...props} styles={{ ...customStyles, ...props.styles }} />
    );
}
