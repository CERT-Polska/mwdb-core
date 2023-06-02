import { TagList, DateString, ObjectLink } from "@mwdb-web/commons/ui";
import { RecentInnerRow, RecentRow } from "@mwdb-web/components/RecentView";
import { RecentRowProps } from "@mwdb-web/types/props";
import { ObjectData } from "@mwdb-web/types/types";

export function RecentObjectRow(props: RecentRowProps<ObjectData>) {
    const objectId = <ObjectLink type={props.type} id={props.id} />;
    const uploadTime = <DateString date={props.upload_time} />;
    const tags = (
        <TagList
            tag={""}
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
            <>
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
                        <>{props.type}</>
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
                        <>{props.type}</>
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
            </>
        </RecentRow>
    );
}
