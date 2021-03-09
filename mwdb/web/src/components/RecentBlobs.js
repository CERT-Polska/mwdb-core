import React from "react";
import { useLocation, Link } from "react-router-dom";

import queryString from "query-string";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { RecentView, RecentRow, RecentInnerRow } from "./RecentView";
import { TagList } from "@mwdb-web/commons/ui";
import { DateString, ObjectLink, Hash } from "@mwdb-web/commons/ui";
import { useRemote } from "@mwdb-web/commons/remotes";

export function RecentBlobRow(props) {
    let location = useLocation();
    const remote = useRemote();
    const remotePath = remote ? `/remote/${remote}` : "";
    const diffWith = queryString.parse(location.search)["diff"];
    const blobType = (
        <a
            href="#query"
            onClick={(ev) => {
                ev.preventDefault();
                props.addToQuery("type", props.blob_type);
            }}
        >
            {props.blob_type}
        </a>
    );
    const blobId = diffWith ? (
        props.id === diffWith ? (
            <Hash hash={props.id} />
        ) : (
            <Link to={`${remotePath}/diff/${props.id}/${diffWith}`}>
                <Hash hash={props.id} />
            </Link>
        )
    ) : (
        <ObjectLink type="text_blob" id={props.id} />
    );
    const blobIcon = diffWith && (
        <FontAwesomeIcon
            icon="random"
            size="x"
            style={{ marginRight: "0.3em" }}
        />
    );
    const tags = (
        <TagList
            tags={props.tags}
            tagClick={(ev, tag) => {
                ev.preventDefault();
                props.addToQuery("tag", tag);
            }}
            tagRemove={(ev, tag) => props.addToQuery("NOT tag", tag)}
            filterable
        />
    );
    const firstSeen = <DateString date={props.upload_time} />;
    const lastSeen = <DateString date={props.last_seen} />;

    return (
        <RecentRow firstSeen={props.upload_time}>
            <td className="col-lg-1 col-6">
                {/* Shrinked mode */}
                <RecentInnerRow value={props.blob_name} narrowOnly copyable />
                <RecentInnerRow
                    value={props.id}
                    icon={blobIcon}
                    narrowOnly
                    copyable
                >
                    {blobId}
                </RecentInnerRow>
                {/* Wide mode */}
                <RecentInnerRow value={props.blob_name} wideOnly copyable />
            </td>
            <td className="col-lg-4 col-6">
                {/* Shrinked mode */}
                <RecentInnerRow
                    labelWidth="3rem"
                    label="Type"
                    value={props.blob_type}
                    narrowOnly
                    copyable
                >
                    {blobType}
                </RecentInnerRow>
                <RecentInnerRow
                    labelWidth="3rem"
                    label="Date"
                    value={props.upload_time}
                    narrowOnly
                    noEllipsis
                >
                    {firstSeen}
                </RecentInnerRow>
                <RecentInnerRow narrowOnly noEllipsis>
                    {tags}
                </RecentInnerRow>
                {/* Wide mode */}
                <RecentInnerRow
                    value={props.id}
                    icon={blobIcon}
                    wideOnly
                    copyable
                >
                    {blobId}
                </RecentInnerRow>
            </td>
            <td className="col-lg-1 d-none d-lg-block">
                {/* Wide mode */}
                <RecentInnerRow value={props.blob_type} copyable>
                    {blobType}
                </RecentInnerRow>
            </td>
            <td className="col-lg-2 d-none d-lg-block">
                {/* Wide mode */}
                <RecentInnerRow noEllipsis>{tags}</RecentInnerRow>
            </td>
            <td className="col-lg-2 d-none d-lg-block">
                {/* Wide mode */}
                <RecentInnerRow value={props.upload_time} noEllipsis>
                    {firstSeen}
                </RecentInnerRow>
            </td>
            <td className="col-lg-2 d-none d-lg-block">
                {/* Wide mode */}
                <RecentInnerRow value={props.last_seen} noEllipsis>
                    {lastSeen}
                </RecentInnerRow>
            </td>
        </RecentRow>
    );
}

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

export default (props) => {
    let location = useLocation();
    const diffWith = queryString.parse(location.search)["diff"];
    return (
        <React.Fragment>
            {diffWith ? (
                <div className="alert alert-warning">
                    Choose blob to diff with{" "}
                    <ObjectLink type="text_blob" id={diffWith} inline />
                </div>
            ) : (
                []
            )}
            <RecentView
                type="blob"
                rowComponent={RecentBlobRow}
                headerComponent={RecentBlobHeader}
                dhashOnly
                {...props}
            />
        </React.Fragment>
    );
};
