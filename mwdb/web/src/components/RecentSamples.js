import React from "react";

import { RecentView, RecentRow, RecentInnerRow } from "./RecentView";
import { TagList } from "@mwdb-web/commons/ui";
import { DateString, Identicon, ObjectLink } from "@mwdb-web/commons/ui";
import { humanFileSize } from "@mwdb-web/commons/helpers";

export function RecentFileRow(props) {
    const identicon = (
        <Identicon
            hash={props.md5}
            size="45"
            style={{
                float: "left",
                marginRight: "8pt",
            }}
        />
    );
    const uploadTime = <DateString date={props.upload_time} />;
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

    return (
        <RecentRow firstSeen={props.upload_time}>
            <td className="col-lg-4 col-6">
                {/* Wide mode */}
                <div className="d-none d-lg-block">{identicon}</div>
                <RecentInnerRow
                    labelWidth="4.5rem"
                    label="Name"
                    value={props.file_name}
                    wideOnly
                    copyable
                />
                <RecentInnerRow
                    labelWidth="4.5rem"
                    label="SHA256"
                    value={props.sha256}
                    wideOnly
                    copyable
                >
                    <ObjectLink type="file" id={props.sha256} />
                </RecentInnerRow>
                <RecentInnerRow
                    labelWidth="4.5rem"
                    label="MD5"
                    value={props.md5}
                    copyable
                    wideOnly
                >
                    <ObjectLink type="file" id={props.md5} />
                </RecentInnerRow>
                {/* Shrinked mode */}
                <RecentInnerRow value={props.file_name} narrowOnly copyable />
                <RecentInnerRow value={props.sha256} narrowOnly copyable>
                    <ObjectLink type="file" id={props.sha256} />
                </RecentInnerRow>
                <RecentInnerRow value={props.upload_time} narrowOnly noEllipsis>
                    {uploadTime}
                </RecentInnerRow>
            </td>
            <td className="col-lg-3 col-6">
                {/* All modes */}
                <RecentInnerRow
                    labelWidth="3rem"
                    label="Size"
                    value={props.file_size}
                    copyable
                >
                    {humanFileSize(props.file_size)}
                </RecentInnerRow>
                <RecentInnerRow
                    labelWidth="3rem"
                    label="Type"
                    value={props.file_type}
                    copyable
                />
                {/* Shrink mode */}
                <RecentInnerRow narrowOnly noEllipsis>
                    {tags}
                </RecentInnerRow>
            </td>
            <td className="col-lg-3 d-none d-lg-block">
                {/* Wide mode */}
                <RecentInnerRow noEllipsis>{tags}</RecentInnerRow>
            </td>
            <td className="col-lg-2 d-none d-lg-block">
                {/* Wide mode */}
                <RecentInnerRow value={props.upload_time} noEllipsis>
                    {uploadTime}
                </RecentInnerRow>
            </td>
        </RecentRow>
    );
}

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

export default (props) => (
    <RecentView
        type="file"
        rowComponent={RecentFileRow}
        headerComponent={RecentFileHeader}
        {...props}
    />
);
