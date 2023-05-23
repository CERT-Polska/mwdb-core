import { Link } from "react-router-dom";

import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { capabilitiesList } from "@mwdb-web/commons/auth";
import { Capability } from "@mwdb-web/types/types";

type Props = {
    onDelete: (cap: Capability) => void;
    capabilities: Capability[];
};

export function CapabilitiesList({ capabilities, onDelete }: Props) {
    return (
        <>
            {capabilities.map((cap: Capability) => (
                <tr key={cap}>
                    <td className="col-auto">
                        <Link
                            to={"#"}
                            onClick={(ev) => {
                                ev.preventDefault();
                                onDelete(cap);
                            }}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </Link>
                    </td>
                    <th className="col-1">
                        <span className="badge badge-success">{cap}</span>
                    </th>
                    <td className="col">
                        {capabilitiesList[cap] ||
                            "Undocumented. Possibly internal and required by plugin."}
                    </td>
                </tr>
            ))}
        </>
    );
}
