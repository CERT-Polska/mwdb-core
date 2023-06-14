import React from "react";
import { useSearchParams } from "react-router-dom";

import { RecentView } from "../../RecentView";
import { ObjectLink } from "@mwdb-web/commons/ui";
import { RecentBlobRow } from "../common/RecentBlobRow";
import { RecentBlobHeader } from "../common/RecentBlobHeader";

export function RecentBlobsView() {
    const searchParams = useSearchParams()[0];
    const diffWith = searchParams.get("diff");
    return (
        <React.Fragment>
            {diffWith ? (
                <div className="container-fluid">
                    <div className="alert alert-warning">
                        Choose blob to diff with{" "}
                        <ObjectLink type="text_blob" id={diffWith} inline />
                    </div>
                </div>
            ) : (
                <></>
            )}
            <RecentView
                type="blob"
                rowComponent={RecentBlobRow}
                headerComponent={RecentBlobHeader}
            />
        </React.Fragment>
    );
}
