function getRecentRowClass(date: string) {
    let delta = new Date().getTime() - new Date(date).getTime();
    if (delta < 24 * 60 * 60 * 1000) return "today";
    if (delta < 72 * 60 * 60 * 1000) return "recent";
}

type Props = {
    firstSeen: string;
    children: JSX.Element;
};

export function RecentRow(props: Props) {
    return (
        <tr className={`d-flex ${getRecentRowClass(props.firstSeen)}`}>
            {props.children}
        </tr>
    );
}
