import { useRef } from "react";

type AutocompleteItem<T> = {
    item: T;
};

type Props<T> = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange"
> & {
    items: T[];
    getItemValue?: (item: T) => string;
    renderItem?: (props: AutocompleteItem<T>) => JSX.Element;
    value: string;
    onChange: (value: string) => void;
    children?: JSX.Element;
    prependChildren?: boolean;
};

export function Autocomplete<T>({
    items,
    getItemValue,
    renderItem,
    value,
    onChange,
    children,
    prependChildren,
    ...inputProps
}: Props<T>) {
    const itemValue = getItemValue || ((item) => item);
    const ItemComponent =
        renderItem ||
        ((({ item }) => itemValue(item)) as React.ComponentType<{ item: T }>);
    const menuStyle = items.length === 0 ? { display: "none" } : {};
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="dropdown input-group">
            {prependChildren ? children : []}
            <input
                value={value}
                onChange={(ev) => {
                    onChange(ev.target.value);
                }}
                {...inputProps}
                data-toggle="dropdown"
                ref={inputRef}
            />
            <div className="dropdown-menu" role="menu" style={menuStyle}>
                {items.map((item, index) => (
                    <button
                        key={index}
                        className="dropdown-item"
                        type="button"
                        onClick={() => {
                            onChange(itemValue(item) as string);
                            // Focus on input after choosing dropdown item
                            inputRef.current?.focus();
                        }}
                    >
                        <ItemComponent item={item} />
                    </button>
                ))}
            </div>
            {prependChildren ? <></> : children}
        </div>
    );
}
