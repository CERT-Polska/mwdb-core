import React from "react";

import { RecentView, RecentRow, RecentInnerRow } from "./RecentView";
import { TagList } from "@mwdb-web/commons/ui";

import { DateString, ObjectLink } from "@mwdb-web/commons/ui";

export function RecentObjectRow(props) {
    const objectId = <ObjectLink type={props.type} id={props.id} />;
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
                {/* All modes */}
                <RecentInnerRow value={props.id} copyable>
                    {objectId}
                </RecentInnerRow>
            </td>
            <td className="col-lg-1 col-6">
                {/* Shrinked mode */}
                <RecentInnerRow
                    labelWidth="3rem"
                    label="Type"
                    value={props.type}
                    narrowOnly
                    copyable
                >
                    {props.type}
                </RecentInnerRow>
                <RecentInnerRow
                    labelWidth="3rem"
                    label="Date"
                    value={props.upload_time}
                    narrowOnly
                >
                    {uploadTime}
                </RecentInnerRow>
                <RecentInnerRow narrowOnly>{tags}</RecentInnerRow>
                {/* Wide mode */}
                <RecentInnerRow value={props.type} wideOnly copyable>
                    {props.type}
                </RecentInnerRow>
            </td>
            <td className="col-lg-5 d-none d-lg-block">
                <RecentInnerRow>{tags}</RecentInnerRow>
            </td>
            <td className="col-lg-2 d-none d-lg-block">
                <RecentInnerRow value={props.upload_time}>
                    {uploadTime}
                </RecentInnerRow>
            </td>
        </RecentRow>
    );
}

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

export default (props) => (
    <RecentView
        type="object"
        rowComponent={RecentObjectRow}
        headerComponent={RecentObjectHeader}
        dhashOnly
        {...props}
    />
);
