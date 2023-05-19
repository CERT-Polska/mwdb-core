type Props = {
    filterValue: string;
    children: string;
};

export function HighlightText(props: Props) {
    if (!props.filterValue) return <>{props.children}</>;

    const filteredText = props.children.toLowerCase();
    const filterValue = props.filterValue.toLowerCase();
    let elements: (string | JSX.Element)[] = [];

    for (
        var prevIndex = 0, index = filteredText.indexOf(filterValue);
        index >= 0;
        prevIndex = index + filterValue.length,
            index = filteredText.indexOf(
                filterValue,
                index + filterValue.length
            )
    ) {
        elements = elements.concat([
            props.children.slice(prevIndex, index),
            <span style={{ backgroundColor: "yellow" }}>
                {props.children.slice(index, index + filterValue.length)}
            </span>,
        ]);
    }

    elements.push(props.children.slice(prevIndex));
    return <>{elements}</>;
}
