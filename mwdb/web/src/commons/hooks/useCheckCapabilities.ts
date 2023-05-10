import { useContext } from "react";
import { AuthContext } from "@mwdb-web/commons/auth";
import { Capabality } from "@mwdb-web/types/types";

export function useCheckCapabilities() {
    const { user } = useContext(AuthContext);

    function userHasCapabilities(cap: Capabality) {
        return user.capabilities.includes(cap);
    }

    return {
        userHasCapabilities,
    };
}
