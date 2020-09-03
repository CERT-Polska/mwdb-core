import React from 'react';

import { RecentView, RecentRow, RecentInnerRow } from "./RecentView";
import {TagList} from './Tag';

import { DateString, ObjectLink } from "@malwarefront/ui";

export function RecentBlobRow(props) {
    const blobType = (
        <a href="#query" onClick={(ev) => { 
            ev.preventDefault(); 
            props.addToQuery("type", props.blob_type)
        }}>
            {props.blob_type}
        </a>
    )
    const blobId = <ObjectLink type="text_blob" id={props.id}/>;
    const tags = (
        <TagList tags={props.tags}
                 tagClick={(ev, tag) => { ev.preventDefault(); props.addToQuery("tag", tag) }}
                 tagRemove={(ev, tag) => props.addToQuery("NOT tag", tag)}
                 filterable/>
    )
    const firstSeen = <DateString date={props.upload_time}/>
    const lastSeen = <DateString date={props.last_seen}/>

    return (
        <RecentRow firstSeen={props.upload_time}>
            <td className="col-lg-1 col-6">
                {/* Shrinked mode */}
                <RecentInnerRow value={props.blob_name} narrowOnly copyable />
                <RecentInnerRow value={props.id} narrowOnly copyable>
                    {blobId}
                </RecentInnerRow>
                {/* Wide mode */}
                <RecentInnerRow value={props.blob_name} wideOnly copyable/>
            </td>
            <td className="col-lg-4 col-6">
                {/* Shrinked mode */}
                <RecentInnerRow labelWidth="3rem" label="Type" value={props.blob_type} narrowOnly copyable>
                    {blobType}
                </RecentInnerRow>
                <RecentInnerRow labelWidth="3rem" label="Date" value={props.upload_time} narrowOnly noEllipsis>
                    {firstSeen}
                </RecentInnerRow>
                <RecentInnerRow narrowOnly noEllipsis>
                    {tags}
                </RecentInnerRow>
                {/* Wide mode */}
                <RecentInnerRow value={props.id} wideOnly copyable>
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
                <RecentInnerRow noEllipsis>
                    {tags}
                </RecentInnerRow>
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
    )
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
    )
}

export default (props) => (
    <RecentView type="blob" 
                rowComponent={RecentBlobRow}
                headerComponent={RecentBlobHeader} 
                dhashOnly 
                {...props}/>
)
