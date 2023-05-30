import { RefAttributes } from "react";
import ReactSelect, { GroupBase, StylesConfig } from "react-select";
import SelectDef from "react-select/dist/declarations/src/Select";
import { StateManagerProps } from "react-select/dist/declarations/src/useStateManager";

const selectedBackgroundColor = "#28A745";

export function Select<
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option>
>(
    props: StateManagerProps<Option, IsMulti, Group> &
        RefAttributes<SelectDef<Option, IsMulti, Group>>
) {
    const customStyles: StylesConfig<Option, IsMulti, Group> = {
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
    return (
        <ReactSelect<Option, IsMulti, Group>
            {...props}
            styles={{ ...customStyles, ...props.styles }}
        />
    );
}
