type Props = {
    indent?: number;
    children: React.ReactNode;
};

export function DataTable(props: Props) {
    const indentLevel = props.indent || 0;
    const indentWidth = `${indentLevel * 8}pt`;

    return (
        <table
            className={`table table-striped table-bordered table-hover data-table ${
                indentLevel > 0 ? "nested" : ""
            }`}
            style={{
                marginLeft: indentWidth,
                width: `calc(100% - ${indentWidth})`,
            }}
        >
            <tbody>{props.children}</tbody>
        </table>
    );
}
