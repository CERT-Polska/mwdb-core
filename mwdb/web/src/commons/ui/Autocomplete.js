import React, { useRef } from "react";

export default function Autocomplete({
    items,
    getItemValue,
    renderItem,
    value,
    onChange,
    children,
    prependChildren,
    ...inputProps
}) {
    const itemValue = getItemValue || ((item) => item);
    const ItemComponent = renderItem || (({ item }) => itemValue(item));
    const menuStyle = items.length === 0 ? { display: "none" } : {};
    const inputRef = useRef(null);

    return (
        <div className="dropdown input-group">
            {prependChildren ? children : []}
            <input
                value={value}
                onChange={(ev) => onChange(ev.target.value)}
                {...(inputProps || {})}
                data-toggle="dropdown"
                ref={inputRef}
            />
            <div className="dropdown-menu" role="menu" style={menuStyle}>
                {items.map((item) => (
                    <button
                        key={itemValue(item)}
                        className="dropdown-item"
                        type="button"
                        onClick={(ev) => {
                            onChange(itemValue(item));
                            // Focus on input after choosing dropdown item
                            inputRef.current.focus();
                        }}
                    >
                        <ItemComponent item={item} />
                    </button>
                ))}
            </div>
            {prependChildren ? [] : children}
        </div>
    );
}
