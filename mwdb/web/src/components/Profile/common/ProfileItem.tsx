type Props = {
    label: string;
    value?: number | string | Date;
    children?: JSX.Element;
};

export function ProfileItem(props: Props) {
    if (!props.value) return <></>;

    const valueContent =
        typeof props.value === "string" || props.value instanceof Date
            ? props.value.toString()
            : undefined;

    return (
        <tr className="d-flex">
            <th className="col-3">{props.label}</th>
            <td className="col-9">{props.children || valueContent}</td>
        </tr>
    );
}
