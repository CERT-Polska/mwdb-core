import { RecentView } from "@mwdb-web/components/RecentView";
import { RecentFileRow } from "../common/RecentFileRow";
import { RecentFileHeader } from "../common/RecentFileHeader";

export function RecentSamplesView() {
    return (
        <RecentView
            type="file"
            rowComponent={RecentFileRow}
            headerComponent={RecentFileHeader}
        />
    );
}
