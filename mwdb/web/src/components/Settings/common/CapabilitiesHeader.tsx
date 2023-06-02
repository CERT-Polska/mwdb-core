import { GroupBadge, ShowIf } from "@mwdb-web/commons/ui";

import { Group } from "@mwdb-web/types/types";
import { GroupAppliesTo } from "./GroupAppliesTo";

type Props = {
    group: Group;
};

export function CapabilitiesHeader({ group }: Props) {
    return (
        <tr className="bg-light">
            <th colSpan={3} className="col">
                <GroupBadge group={group} />
                <ShowIf condition={!group.private}>
                    <GroupAppliesTo group={group} />
                </ShowIf>
            </th>
        </tr>
    );
}
