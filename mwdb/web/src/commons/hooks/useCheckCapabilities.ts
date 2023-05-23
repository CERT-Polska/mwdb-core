import { useContext } from "react";
import { AuthContext } from "@mwdb-web/commons/auth";
import { Capability } from "@mwdb-web/types/types";

export function useCheckCapabilities() {
    const { user } = useContext(AuthContext);

    function userHasCapabilities(cap: Capability) {
        return user.capabilities.includes(cap);
    }

    return {
        userHasCapabilities,
    };
}
