export function RecentFileHeader() {
    return (
        <tr className="d-flex">
            {/* Shrinked mode */}
            <th className="col-6 d-lg-none">Name/SHA256/First seen</th>
            <th className="col-6 d-lg-none">Size/Type/Tags</th>
            {/* Wide mode */}
            <th className="col-4 d-none d-lg-block">Name/Hash</th>
            <th className="col-3 d-none d-lg-block">Size/Type</th>
            <th className="col-3 d-none d-lg-block">Tags</th>
            <th className="col-2 d-none d-lg-block">First seen</th>
        </tr>
    );
}
