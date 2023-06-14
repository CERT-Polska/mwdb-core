export function RecentBlobHeader() {
    return (
        <tr className="d-flex">
            {/* Shrinked mode */}
            <th className="col-6 d-lg-none">Blob name/Blob ID</th>
            <th className="col-6 d-lg-none">Type/Date/Tags</th>
            {/* Wide mode */}
            <th className="col-1 d-none d-lg-block">Blob name</th>
            <th className="col-4 d-none d-lg-block">Blob ID</th>
            <th className="col-1 d-none d-lg-block">Blob type</th>
            <th className="col-2 d-none d-lg-block">Tags</th>
            <th className="col-2 d-none d-lg-block">First seen</th>
            <th className="col-2 d-none d-lg-block">Last seen</th>
        </tr>
    );
}
