import { faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import { ObjectTab } from "@mwdb-web/commons/ui";
import { IOCDetails } from "./IOCDetails";

export function IOCTab() {
    return (
        <ObjectTab
            tab="iocs"
            icon={faShieldAlt}
            label="IOCs"
            component={IOCDetails}
            actions={[]}
            dropdownActions={false}
        />
    );
}
