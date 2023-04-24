import { useContext } from "react";
import { AuthContext } from "@mwdb-web/commons/auth";

export function useCheckCapabilities() {
    const { user } = useContext(AuthContext);

    function userHasCapabilities(cap) {
        return user.capabilities.includes(cap);
    }

    return {
        userHasCapabilities,
    };
}
