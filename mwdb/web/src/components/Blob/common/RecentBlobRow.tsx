import { useSearchParams, Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRandom } from "@fortawesome/free-solid-svg-icons";

import { RecentRow, RecentInnerRow } from "../../RecentView";
import { TagList } from "@mwdb-web/commons/ui";
import { DateString, ObjectLink, Hash } from "@mwdb-web/commons/ui";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { BlobData } from "@mwdb-web/types/types";
import { RecentRowProps } from "@mwdb-web/types/props";

export function RecentBlobRow(props: RecentRowProps<BlobData>) {
    const remotePath = useRemotePath();
    const searchParams = useSearchParams()[0];
    const diffWith = searchParams.get("diff");
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
    const blobIcon = diffWith ? (
        <FontAwesomeIcon icon={faRandom} style={{ marginRight: "0.3em" }} />
    ) : (
        <></>
    );
    const tags = (
        <TagList
            tag=""
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
            <>
                <td className="col-lg-1 col-6">
                    {/* Shrinked mode */}
                    <RecentInnerRow
                        value={props.blob_name}
                        narrowOnly
                        copyable
                    />
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
            </>
        </RecentRow>
    );
}
