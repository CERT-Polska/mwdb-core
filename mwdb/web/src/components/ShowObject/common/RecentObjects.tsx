import { RecentView } from "../../RecentView";
import { RecentObjectHeader } from "./RecentObjectHeader";
import { RecentObjectRow } from "./RecentObjectRow";

export function RecentObjects() {
    return (
        <RecentView
            type="object"
            rowComponent={RecentObjectRow}
            headerComponent={RecentObjectHeader}
        />
    );
}
