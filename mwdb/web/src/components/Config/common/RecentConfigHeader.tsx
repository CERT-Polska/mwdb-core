export function RecentConfigHeader() {
    return (
        <tr className="d-flex">
            {/* Shrinked mode */}
            <th className="col-6 d-lg-none">Family/Config ID</th>
            <th className="col-6 d-lg-none">Type/First seen/Tags</th>
            {/* Wide mode */}
            <th className="col-1 d-none d-lg-block">Family</th>
            <th className="col-4 d-none d-lg-block">Config ID</th>
            <th className="col-1 d-none d-lg-block">Config type</th>
            <th className="col-4 d-none d-lg-block">Tags</th>
            <th className="col-2 d-none d-lg-block">First seen</th>
        </tr>
    );
}
