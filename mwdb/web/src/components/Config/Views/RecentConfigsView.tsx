import { RecentConfigHeader } from "../common/RecentConfigHeader";
import { RecentConfigRow } from "../common/RecentConfigRow";
import { RecentView } from "../../RecentView";

export function RecentConfigsView() {
    return (
        <RecentView
            type="config"
            rowComponent={RecentConfigRow}
            headerComponent={RecentConfigHeader}
        />
    );
}
