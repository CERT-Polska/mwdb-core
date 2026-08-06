import { useContext } from "react";

import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { Capability } from "@mwdb-web/types/types";
import { isFileDownloadAllowed } from "./fileDownloadAccess";

export function useFileDownloadAccess() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const capabilities = auth.user?.capabilities ?? [];

    return {
        canDownloadFiles: isFileDownloadAllowed(
            config.config.default_file_download_enabled,
            capabilities,
            Capability.downloadingFiles
        ),
        canDownloadZippedFiles: isFileDownloadAllowed(
            config.config.default_zip_download_enabled,
            capabilities,
            Capability.downloadingZippedFiles
        ),
    };
}
