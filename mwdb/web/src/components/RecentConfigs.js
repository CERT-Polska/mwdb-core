import React from "react";

import { RecentView, RecentRow, RecentInnerRow } from "./RecentView";
import { TagList } from "@mwdb-web/commons/ui";

import { DateString, ObjectLink } from "@mwdb-web/commons/ui";

export function RecentConfigRow(props) {
    const family = (
        <a
            href="#query"
            onClick={(ev) => {
                ev.preventDefault();
                props.addToQuery("family", props.family);
            }}
        >
            {props.family}
        </a>
    );
    const configId = <ObjectLink type="static_config" id={props.id} />;
    const configType = (
        <a
            href="#query"
            onClick={(ev) => {
                ev.preventDefault();
                props.addToQuery("type", props.config_type);
            }}
        >
            {props.config_type}
        </a>
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
            <td className="col-lg-1 col-6">
                {/* Shrinked mode */}
                <RecentInnerRow value={props.family} narrowOnly copyable>
                    {family}
                </RecentInnerRow>
                <RecentInnerRow value={props.id} narrowOnly copyable>
                    {configId}
                </RecentInnerRow>
                {/* Wide mode */}
                <RecentInnerRow value={props.family} wideOnly copyable>
                    {family}
                </RecentInnerRow>
            </td>
            <td className="col-lg-4 col-6">
                {/* Shrinked mode */}
                <RecentInnerRow
                    labelWidth="3rem"
                    label="Type"
                    value={props.config_type}
                    narrowOnly
                    copyable
                >
                    {configType}
                </RecentInnerRow>
                <RecentInnerRow
                    labelWidth="3rem"
                    label="Date"
                    value={props.upload_time}
                    narrowOnly
                    noEllipsis
                >
                    {uploadTime}
                </RecentInnerRow>
                <RecentInnerRow narrowOnly noEllipsis>
                    {tags}
                </RecentInnerRow>
                {/* Wide mode */}
                <RecentInnerRow value={props.id} wideOnly copyable>
                    {configId}
                </RecentInnerRow>
            </td>
            <td className="col-lg-1 d-none d-lg-block">
                <RecentInnerRow value={props.config_type} copyable>
                    {configType}
                </RecentInnerRow>
            </td>
            <td className="col-lg-4 d-none d-lg-block">
                <RecentInnerRow noEllipsis>{tags}</RecentInnerRow>
            </td>
            <td className="col-lg-2 d-none d-lg-block">
                <RecentInnerRow value={props.upload_time} noEllipsis>
                    {uploadTime}
                </RecentInnerRow>
            </td>
        </RecentRow>
    );
}

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

export default (props) => (
    <RecentView
        type="config"
        rowComponent={RecentConfigRow}
        headerComponent={RecentConfigHeader}
        dhashOnly
        {...props}
    />
);
