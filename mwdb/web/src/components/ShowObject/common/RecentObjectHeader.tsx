export function RecentObjectHeader() {
    return (
        <tr className="d-flex">
            {/* Shrinked mode */}
            <th className="col-6 d-lg-none">Object ID</th>
            <th className="col-6 d-lg-none">Type/First seen/Tags</th>
            {/* Wide mode */}
            <th className="col-4 d-none d-lg-block">Object ID</th>
            <th className="col-1 d-none d-lg-block">Object type</th>
            <th className="col-5 d-none d-lg-block">Tags</th>
            <th className="col-2 d-none d-lg-block">First seen</th>
        </tr>
    );
}
