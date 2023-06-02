type Props = {
    hash?: string;
    inline?: boolean;
};

export function Hash(props: Props) {
    if (!props.hash) return <></>;
    if (props.inline) {
        return <span className="text-monospace">{props.hash}</span>;
    }
    return (
        <div className="smart-ellipsis text-monospace">
            <div className="start">{props.hash.slice(0, -12)}</div>
            <div className="end">{props.hash.slice(-12)}</div>
        </div>
    );
}
