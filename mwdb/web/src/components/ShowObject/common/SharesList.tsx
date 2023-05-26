import { ShareGroupItem } from "../common/ShareGroupItem";
import { ObjectType, Share } from "@mwdb-web/types/types";
import { ShareForm } from "./ShareForm";

type GroupShare = {
    reason: {
        reasonType: string;
        relatedObjectDHash: string;
        relatedObjectType: ObjectType;
        relatedUserLogin: string;
    };
    shares: Share[];
    access_time: string;
};

type SharesByReason = Record<string, Share[]>;

function groupShares(shares: Share[]) {
    function timeCompare(a: Share, b: Share) {
        const a_time = Date.parse(a.access_time);
        const b_time = Date.parse(b.access_time);
        // The same dhash order by time
        if (a_time > b_time) return 1;
        if (a_time < b_time) return -1;
        return 0;
    }
    function reasonAndTimeCompare(a: GroupShare, b: GroupShare) {
        // reasonTypes should be grouped (one after another)
        if (a.reason.reasonType > b.reason.reasonType) return 1;
        if (a.reason.reasonType < b.reason.reasonType) return -1;
        // if two shares have identical reasonType sort by time
        const a_time = Date.parse(a.access_time);
        const b_time = Date.parse(b.access_time);
        if (a_time > b_time) return 1;
        if (a_time < b_time) return -1;
        return 0;
    }
    // Sort by time
    const shares_by_time = shares.sort(timeCompare);
    // Group by reason
    const shares_by_reason = {} as SharesByReason;
    shares_by_time.forEach((share) => {
        const {
            related_object_dhash,
            related_object_type,
            related_user_login,
            reason_type,
        } = share;
        const reasonKey =
            reason_type === "shared"
                ? `${related_object_dhash} ${related_object_type} ${related_user_login} ${reason_type}`
                : `${related_object_dhash} ${related_object_type} ${reason_type}`;
        if (!shares_by_reason[reasonKey]) {
            shares_by_reason[reasonKey] = [share];
        } else {
            shares_by_reason[reasonKey].push(share);
        }
    });
    // Sort by reason and first reason time
    return Object.values(shares_by_reason)
        .map((shares) => {
            const firstShare = shares[0];
            const reason = {
                reasonType: firstShare.reason_type,
                relatedObjectDHash: firstShare.related_object_dhash,
                relatedObjectType: firstShare.related_object_type,
                relatedUserLogin: firstShare.related_user_login,
            };
            return { reason, shares, access_time: firstShare.access_time };
        })
        .sort(reasonAndTimeCompare);
}

type Props = {
    shares?: Share[];
    groups: string[];
    handleShare?: (group: string) => void;
    currentFile: string;
    direct?: boolean;
};

export function SharesList({
    shares = [],
    groups,
    handleShare,
    currentFile,
    direct,
}: Props) {
    function filterShares() {
        const ret: Share[] = [];
        if (direct) {
            shares.forEach((share: Share) => {
                if (share.related_object_dhash === currentFile) {
                    ret.push(share);
                }
            });
        } else {
            shares.forEach((share: Share) => {
                if (share.related_object_dhash !== currentFile) {
                    ret.push(share);
                }
            });
        }
        return ret;
    }

    if (!shares || !groups) {
        return <div className="card-body text-muted">Loading data...</div>;
    }

    const filteredShares = filterShares();
    if (filteredShares.length) {
        const groupedItems = groupShares(filteredShares);
        return (
            <div>
                {groupedItems.map((sharesGroup, index) => (
                    <ShareGroupItem
                        key={index}
                        {...sharesGroup}
                        showDhash={!direct}
                    />
                ))}
                {handleShare && (
                    <ShareForm onSubmit={handleShare} groups={groups} />
                )}
            </div>
        );
    } else {
        return <div className="card-body text-muted">No shares to display</div>;
    }
}
