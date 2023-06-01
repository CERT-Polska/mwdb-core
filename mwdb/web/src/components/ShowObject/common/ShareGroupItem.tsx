import { Link } from "react-router-dom";

import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { DateString, ShareReasonString } from "@mwdb-web/commons/ui";
import { Reason, Share } from "@mwdb-web/types/types";

type Props = {
    reason: Reason;
    shares: Share[];
    showDhash: boolean;
};

export function ShareGroupItem({ reason, shares, showDhash }: Props) {
    const remotePath = useRemotePath();
    return (
        <table className="table table-striped table-bordered wrap-table share-table">
            <thead>
                <tr>
                    <th colSpan={2}>
                        {(() => {
                            if (reason.relatedUserLogin !== "$hidden") {
                                return (
                                    <ShareReasonString
                                        {...reason}
                                        showDhash={showDhash}
                                    />
                                );
                            } else {
                                return (
                                    <span className="text-muted">
                                        You do not have permission to see the
                                        uploader.
                                    </span>
                                );
                            }
                        })()}
                    </th>
                </tr>
            </thead>
            <tbody>
                {/* @ts-ignore */}
                {shares.map((share, index) => {
                    return (
                        <tr key={index} className="d-flex">
                            <td className="col-6">
                                <Link
                                    to={makeSearchLink({
                                        field:
                                            share.reason_type === "added"
                                                ? "uploader"
                                                : "shared",
                                        value: share.group_name,
                                        pathname: `${remotePath}/search`,
                                    })}
                                >
                                    {share.group_name}
                                </Link>
                            </td>
                            <td className="col">
                                <DateString date={share.access_time} />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
