type Props = {
    value?: string;
    children?: JSX.Element;
    label: string | JSX.Element;
};

export function AttributeItem(props: Props) {
    const value = props.value ? props.value : "never";
    return (
        <tr className="d-flex">
            <th className="col-3">{props.label}</th>
            <td className="col-9">{props.children || value}</td>
        </tr>
    );
}
