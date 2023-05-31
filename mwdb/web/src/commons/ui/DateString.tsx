type Props = {
    date?: string | Date;
};

export default function DateString(props: Props) {
    if (!props.date) {
        return <></>;
    }
    const date = props.date;
    const d = new Date(date);
    return <span>{date != null ? d.toUTCString() : "(never)"}</span>;
}
