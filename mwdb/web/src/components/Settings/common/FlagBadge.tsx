type Props = {
    enabled?: boolean;
};

export function FlagBadge({ enabled = false }: Props) {
    return enabled ? (
        <span className="badge badge-success">enabled</span>
    ) : (
        <span className="badge badge-danger">disabled</span>
    );
}
