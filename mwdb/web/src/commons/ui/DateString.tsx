type Props = {
    date: string;
};

export default function DateString(props: Props) {
    const date = props.date;
    const d = new Date(date);
    return <span>{date != null ? d.toUTCString() : "(never)"}</span>;
}
