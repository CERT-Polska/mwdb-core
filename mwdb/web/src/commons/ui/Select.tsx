import { RefAttributes } from "react";
import ReactSelect, { CSSObjectWithLabel, GroupBase, StylesConfig } from "react-select";
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
        } as CSSObjectWithLabel),
        multiValueLabel: (provided) => ({
            ...provided,
            color: "#fff",
        } as CSSObjectWithLabel),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? selectedBackgroundColor
                : provided.backgroundColor,
        } as CSSObjectWithLabel),
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
