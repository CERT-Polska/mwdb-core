import type { Capability } from "@mwdb-web/types/types";

export function isFileDownloadAllowed(
    enabledByDefault: boolean | undefined,
    capabilities: Capability[],
    capability: Capability
) {
    return enabledByDefault !== false || capabilities.includes(capability);
}
